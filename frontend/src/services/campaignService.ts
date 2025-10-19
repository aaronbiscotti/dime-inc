import { createClient } from "@/lib/supabase";
import { Campaign, CampaignStatus } from "@/types/database";

export interface CreateCampaignData {
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline?: string | null;
  requirements?: string | null;
  proposal_message?: string | null;
  max_ambassadors?: number;
}

export const campaignService = {
  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaignData): Promise<Campaign | null> {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[createCampaign] No authenticated user.");
      throw new Error("User not authenticated");
    }

    // Get the client profile ID
    const { data: clientProfile, error: profileError } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (profileError || !clientProfile) {
      console.error("[createCampaign] Client profile not found.");
      throw new Error("Client profile not found");
    }

    // Create the campaign
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        ...data,
        client_id: clientProfile.id,
        status: "draft" as CampaignStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign - Full error:", JSON.stringify(error, null, 2));
      console.error("Error details:", error.message, error.details, error.hint, error.code);
      throw new Error(`Failed to create campaign: ${error.message || JSON.stringify(error)}`);
    }

    return campaign;
  },

  /**
   * Get all campaigns for the current client
   */
  async getClientCampaigns(): Promise<Campaign[]> {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get the client profile ID
    const { data: clientProfile } = await supabase
      .from("client_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!clientProfile) {
      return [];
    }

    const { data: campaigns, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("client_id", clientProfile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      throw new Error(error.message);
    }

    return campaigns || [];
  },

  /**
   * Publish a campaign (change status from draft to active)
   */
  async publishCampaign(campaignId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("campaigns")
      .update({ status: "active" as CampaignStatus })
      .eq("id", campaignId);

    if (error) {
      console.error("Error publishing campaign:", error);
      throw new Error(error.message);
    }
  },

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("campaigns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", campaignId);

    if (error) {
      console.error("Error updating campaign status:", error);
      throw new Error(error.message);
    }
  },

  /**
   * Update campaign details
   */
  async updateCampaign(campaignId: string, data: Partial<CreateCampaignData>): Promise<Campaign | null> {
    const supabase = createClient();
    
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId)
      .select()
      .single();

    if (error) {
      console.error("Error updating campaign:", error);
      throw new Error(error.message);
    }

    return campaign;
  },

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", campaignId);

    if (error) {
      console.error("Error deleting campaign:", error);
      throw new Error(error.message);
    }
  },

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<Campaign | null> {
    const supabase = createClient();
    
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) {
      console.error("Error fetching campaign:", error);
      throw new Error(error.message);
    }

    return campaign;
  },

  /**
   * Add an ambassador to a campaign (campaign_ambassadors row)
   */
  async addAmbassadorToCampaign({ campaignId, ambassadorId }: { campaignId: string; ambassadorId: string }) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("campaign_ambassadors")
      .insert({
        campaign_id: campaignId,
        ambassador_id: ambassadorId,
        status: "proposal_received",
      })
      .select()
      .single();
    if (error || !data) {
      console.error("[addAmbassadorToCampaign] Failed to add row:", error);
      throw new Error("Failed to add ambassador to campaign: " + (error?.message || "Unknown error"));
    }
    return data;
  },
};