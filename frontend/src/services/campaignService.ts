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

async function getCampaignAmbassadors(campaignId: string) {
  const supabase = createClient();
  // Query campaign_ambassadors and join ambassador_profiles (select handles and avatar)
  const { data, error } = await supabase
    .from("campaign_ambassadors")
    .select(`id, ambassador_id, status, ambassador_profiles:ambassador_id (id, full_name, profile_photo_url, instagram_handle, tiktok_handle, twitter_handle)`)
    .eq("campaign_id", campaignId);
  if (error) {
    console.error("Error fetching campaign ambassadors:", error);
    return [];
  }
  // Map to flatten ambassador_profiles
  return (data || []).map((row: any) => ({
    id: row.ambassador_profiles?.id || row.ambassador_id,
    name: row.ambassador_profiles?.full_name,
    avatar_url: row.ambassador_profiles?.profile_photo_url,
    instagram_handle: row.ambassador_profiles?.instagram_handle,
    tiktok_handle: row.ambassador_profiles?.tiktok_handle,
    twitter_handle: row.ambassador_profiles?.twitter_handle,
    status: row.status,
  }));
}

/**
 * Fetch campaign_ambassadors join table rows for a campaign (with id and ambassador_id)
 */
async function getCampaignAmbassadorRows(campaignId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('campaign_ambassadors')
    .select('id, ambassador_id')
    .eq('campaign_id', campaignId);
  if (error) throw error;
  return data || [];
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
   * Now also creates/finds a chat room and links it.
   */
  async addAmbassadorToCampaign({ campaignId, ambassadorId }: { campaignId: string; ambassadorId: string }) {
    const supabase = createClient();

    // Get current user (client)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get ambassador's user_id from ambassador_profiles
    const { data: ambassadorProfile, error: ambassadorProfileError } = await supabase
      .from("ambassador_profiles")
      .select("user_id, full_name")
      .eq("id", ambassadorId)
      .single();
    if (ambassadorProfileError || !ambassadorProfile) {
      throw new Error("Ambassador profile not found");
    }

    // Get client profile for name
    const { data: clientProfile, error: clientProfileError } = await supabase
      .from("client_profiles")
      .select("company_name")
      .eq("user_id", user.id)
      .single();
    if (clientProfileError || !clientProfile) {
      throw new Error("Client profile not found");
    }

    // Create or find private chat between client and ambassador
    // Import chatService at the top: import { chatService } from "./chatService";
    const { data: chat, error: chatError } = await (await import("./chatService")).chatService.createChat({
      participantId: ambassadorProfile.user_id,
      participantName: ambassadorProfile.full_name,
      participantRole: "ambassador",
      subject: clientProfile.company_name,
    });
    if (chatError || !chat) {
      throw new Error("Failed to create/find chat room: " + (typeof chatError === 'object' && chatError && 'message' in chatError ? (chatError as any).message : JSON.stringify(chatError) || "Unknown error"));
    }

    // Insert campaign_ambassadors row with chat_room_id
    const { data, error } = await supabase
      .from("campaign_ambassadors")
      .insert({
        campaign_id: campaignId,
        ambassador_id: ambassadorId,
        status: "proposal_received",
        chat_room_id: chat.id,
      })
      .select()
      .single();
    if (error || !data) {
      console.error("[addAmbassadorToCampaign] Failed to add row:", error);
      throw new Error("Failed to add ambassador to campaign: " + (error?.message || "Unknown error"));
    }
    return data;
  },

  /**
   * Delete campaign_ambassadors row(s) by chat_room_id
   * Call this after deleting a chat room to keep data in sync.
   */
  async deleteCampaignAmbassadorByChatRoomId(chatRoomId: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("campaign_ambassadors")
      .delete()
      .eq("chat_room_id", chatRoomId);
    if (error) {
      console.error("Error deleting campaign_ambassador by chat_room_id:", error);
      throw new Error(error.message);
    }
  },

  /**
   * Placeholder: Fetch ambassadors for a campaign by campaignId
   */
  getCampaignAmbassadors,

  /**
   * Fetch campaign_ambassadors join table rows for a campaign (with id and ambassador_id)
   */
  getCampaignAmbassadorRows,
};