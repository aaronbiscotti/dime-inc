import { NextRequest, NextResponse } from "next/server";
import { instagramService } from "@/services/instagramService";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/instagram/insights/[mediaId]
 * Fetch insights for a specific media item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } }
) {
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

    // Fetch insights
    const insights = await instagramService.getMediaInsights(
      accessToken,
      params.mediaId
    );

    return NextResponse.json({ data: insights });
  } catch (error: any) {
    console.error("Fetch Instagram insights error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
