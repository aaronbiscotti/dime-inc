import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mediaId } = await params;

    // For now, return mock data
    // In a real implementation, you would fetch from Instagram API
    const mockInsights = {
      id: mediaId,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      reach: Math.floor(Math.random() * 8000) + 500,
      engagement: Math.floor(Math.random() * 1000) + 100,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 50) + 5,
      shares: Math.floor(Math.random() * 20) + 1,
      saved: Math.floor(Math.random() * 100) + 10,
      video_views: Math.floor(Math.random() * 5000) + 200,
      profile_visits: Math.floor(Math.random() * 200) + 20,
      website_clicks: Math.floor(Math.random() * 50) + 5,
    };

    return NextResponse.json({ data: mockInsights });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
