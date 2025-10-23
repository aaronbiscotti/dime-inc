import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

// Portfolio types
export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  platform: "instagram" | "tiktok";
  postUrl: string;
  thumbnailUrl?: string;
  date: string;
  views?: string;
  likes?: string;
  engagement?: string;
}

// Campaign types
export interface CampaignDisplay {
  id: string;
  title: string;
  status: "draft" | "active" | "completed" | "cancelled";
  budgetRange: string;
  ambassadorCount: number;
  timeline: string;
  coverImage?: string;
}

/**
 * Get ambassador portfolio items server-side
 */
export async function getAmbassadorPortfolio(
  ambassadorId: string
): Promise<PortfolioItem[]> {
  noStore();
  const supabase = await createClient();

  const { data: portfolios, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("ambassador_id", ambassadorId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching portfolio:", error);
    return [];
  }

  // Convert database portfolios to UI format
  return portfolios.map((portfolio) => ({
    id: portfolio.id,
    title: portfolio.title,
    description: portfolio.description || undefined,
    platform: portfolio.instagram_url
      ? "instagram"
      : portfolio.tiktok_url
      ? "tiktok"
      : ("instagram" as const),
    postUrl: portfolio.instagram_url || portfolio.tiktok_url || "#",
    thumbnailUrl: (portfolio.media_urls as string[])?.[0] || undefined,
    date: new Date(
      portfolio.campaign_date || portfolio.created_at || new Date()
    ).toLocaleDateString(),
    views:
      (portfolio.results as Record<string, unknown>)?.views?.toString() ||
      undefined,
    likes:
      (portfolio.results as Record<string, unknown>)?.likes?.toString() ||
      undefined,
    engagement:
      (portfolio.results as Record<string, unknown>)?.engagement?.toString() ||
      undefined,
  }));
}

/**
 * Get client campaigns server-side
 */
export async function getClientCampaignsForProfile(
  userId: string
): Promise<CampaignDisplay[]> {
  noStore();
  const supabase = await createClient();

  // First, get the client profile ID for this user
  const { data: clientProfile, error: profileError } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (profileError || !clientProfile) {
    console.log(
      "[getClientCampaignsForProfile] No client profile found for user:",
      userId
    );
    return [];
  }

  // Get campaigns for this client
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }

  // Convert to display format and get ambassador counts
  const campaignDisplays: CampaignDisplay[] = await Promise.all(
    campaigns.map(async (campaign) => {
      // Get ambassador count for this campaign
      const { data: ambassadors } = await supabase
        .from("campaign_ambassadors")
        .select("id")
        .eq("campaign_id", campaign.id);

      return {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status as
          | "draft"
          | "active"
          | "completed"
          | "cancelled",
        budgetRange: `$${campaign.budget_min.toFixed(
          2
        )} - $${campaign.budget_max.toFixed(2)}`,
        ambassadorCount: ambassadors?.length || 0,
        timeline: campaign.deadline
          ? new Date(campaign.deadline).toLocaleDateString()
          : "TBD",
        coverImage: undefined,
      };
    })
  );

  return campaignDisplays;
}
