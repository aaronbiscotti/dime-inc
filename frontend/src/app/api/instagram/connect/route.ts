import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { instagramService } from "@/services/instagramService";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/instagram/connect
 * Save Instagram connection after OAuth
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken || !session?.instagramUserId) {
      return NextResponse.json(
        { error: "Not authenticated with Instagram" },
        { status: 401 }
      );
    }

    // Get current user's Supabase session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated with Supabase" },
        { status: 401 }
      );
    }

    // Get ambassador profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ambassador") {
      return NextResponse.json(
        { error: "Only ambassadors can connect Instagram" },
        { status: 403 }
      );
    }

    const { data: ambassadorProfile } = await supabase
      .from("ambassador_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!ambassadorProfile) {
      return NextResponse.json(
        { error: "Ambassador profile not found" },
        { status: 404 }
      );
    }

    // Exchange short-lived token for long-lived token
    const { access_token, expires_in } =
      await instagramService.exchangeForLongLivedToken(session.accessToken);

    // Fetch Instagram username
    const userInfo = await fetch(
      `https://graph.instagram.com/me?fields=username&access_token=${access_token}`
    );
    const { username } = await userInfo.json();

    // Save connection to database
    const { error } = await instagramService.saveConnection(
      ambassadorProfile.id,
      session.instagramUserId,
      username,
      access_token,
      expires_in
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      username,
      expiresIn: expires_in,
    });
  } catch (error: any) {
    console.error("Instagram connect error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect Instagram" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instagram/connect
 * Check if user has Instagram connected
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { data: ambassadorProfile } = await supabase
      .from("ambassador_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!ambassadorProfile) {
      return NextResponse.json({ connected: false });
    }

    const { data: connection } = await instagramService.getConnection(
      ambassadorProfile.id
    );

    return NextResponse.json({
      connected: !!connection,
      username: connection?.instagram_username,
      expiresAt: connection?.token_expires_at,
    });
  } catch (error: any) {
    console.error("Check Instagram connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check connection" },
      { status: 500 }
    );
  }
}
