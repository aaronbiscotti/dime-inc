import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { Database } from "@/types/database";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
type CampaignSubmission =
  Database["public"]["Tables"]["campaign_submissions"]["Row"];

export async function getCampaignForClient(
  campaignId: string,
  userId: string
): Promise<Campaign> {
  noStore(); // avoid cache bleed between users
  const supabase = await createClient();

  // First, get the client profile ID for this user
  const { data: clientProfile, error: profileError } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (profileError || !clientProfile) {
    notFound(); // No client profile found
  }

  // Make ownership explicit: campaign.client_id == client profile ID
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("client_id", clientProfile.id)
    .single();

  if (error) notFound(); // leak-free failure
  return campaign;
}

export async function getCampaignSubmissionsForClient(
  campaignId: string,
  userId: string
): Promise<CampaignSubmission[]> {
  noStore();
  const supabase = await createClient();

  // First, get the client profile ID for this user
  const { data: clientProfile, error: profileError } = await supabase
    .from("client_profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (profileError || !clientProfile) {
    console.log("[getCampaignSubmissionsForClient] No client profile found for user:", userId);
    return [];
  }

  // Get submissions through campaign_ambassadors relationship
  // First get all campaign_ambassadors for this campaign
  const { data: campaignAmbassadors, error: caError } = await supabase
    .from("campaign_ambassadors")
    .select("id")
    .eq("campaign_id", campaignId);

  if (caError) {
    console.log("[getCampaignSubmissionsForClient] Error fetching campaign ambassadors:", caError);
    return [];
  }

  if (!campaignAmbassadors || campaignAmbassadors.length === 0) {
    console.log("[getCampaignSubmissionsForClient] No campaign ambassadors found for campaign:", campaignId);
    return [];
  }

  // Get submissions for these campaign ambassadors
  const { data, error } = await supabase
    .from("campaign_submissions")
    .select("*")
    .in("campaign_ambassador_id", campaignAmbassadors.map(ca => ca.id))
    .order("submitted_at", { ascending: false });

  if (error) {
    console.log("[getCampaignSubmissionsForClient] Error fetching submissions:", error);
    return []; // Return empty array instead of calling notFound()
  }
  
  return data ?? [];
}

export async function getClientCampaigns(userId: string): Promise<Campaign[]> {
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
      "[getClientCampaigns] No client profile found for user:",
      userId
    );
    return [];
  }

  // Get all campaigns for the authenticated client using the profile ID
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false });

  if (error) notFound();
  return campaigns ?? [];
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const supabase = await createClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error || !campaign) {
    redirect("/campaigns");
  }

  return campaign;
}

export async function getCampaignSubmissions(
  campaignId: string
): Promise<CampaignSubmission[]> {
  const supabase = await createClient();

  const { data: submissions, error } = await supabase
    .from("campaign_submissions")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }

  return submissions || [];
}
