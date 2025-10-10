import { NextRequest, NextResponse } from "next/server";
import { instagramService } from "@/services/instagramService";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/instagram/media
 * Fetch user's Instagram media (Reels, posts)
 */
export async function GET(request: NextRequest) {
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

    // Get ambassador profile
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

    // Get Instagram connection
    const { data: connection, error: connectionError } =
      await instagramService.getConnection(ambassadorProfile.id);

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: "Instagram not connected" },
        { status: 404 }
      );
    }

    // Ensure token is valid
    const { accessToken, error: tokenError } =
      await instagramService.ensureValidToken(connection);

    if (tokenError) {
      return NextResponse.json(
        { error: "Failed to refresh Instagram token" },
        { status: 401 }
      );
    }

    // Fetch media
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "25");

    const media = await instagramService.getUserMedia(
      accessToken,
      connection.instagram_user_id,
      limit
    );

    // Filter for Reels only
    const reels = media.filter((item) => item.media_type === "VIDEO");

    return NextResponse.json({ data: reels });
  } catch (error: any) {
    console.error("Fetch Instagram media error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch media" },
      { status: 500 }
    );
  }
}
