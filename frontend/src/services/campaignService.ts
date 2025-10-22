/**
 * Campaign Service - Handles all campaign-related operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client
import { Campaign } from "@/types/database";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CampaignData {
  id?: string;
  title: string;
  description: string;
  budget: string;
  timeline: string;
  requirements?: string | null;
  targetNiches?: string[];
  campaignType?: string;
  deliverables?: string[];
  clientId?: string; // Add client_id
}

// Type used by the client-side creation form
export interface CreateCampaignData {
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  requirements: string | null;
  max_ambassadors: number;
}

// Use the database Campaign type
export type Campaign = Campaign;

export interface CampaignAmbassador {
  id: string;
  name: string;
  avatar_url?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  twitter_handle?: string;
  status?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Standard error response format
 */
interface ErrorResponse {
  data: null;
  error: { message: string };
}

/**
 * Handle API errors consistently
 */
function handleError(error: unknown, context: string): ErrorResponse {
  console.error(`[CampaignService] ${context}:`, error);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred";

  // Propagate error to UI layer
  return {
    data: null,
    error: { message },
  };
}

// ============================================================================
// CAMPAIGN SERVICE
// ============================================================================

class CampaignService {
  private supabase = createClient(); // Instantiate the client

  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: CampaignData) {
    try {
      // Parse budget range (e.g., "$1000 - $5000" -> min: 1000, max: 5000)
      const budgetRange = campaignData.budget.replace(/[$,]/g, '').split(' - ');
      const budgetMin = parseFloat(budgetRange[0]) || 0;
      const budgetMax = parseFloat(budgetRange[1]) || budgetMin;

      // Parse timeline to deadline (assuming timeline is in days)
      const timelineDays = parseInt(campaignData.timeline) || 30;
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + timelineDays);

      const { data, error } = await this.supabase
        .from("campaigns")
        .insert({
          title: campaignData.title,
          description: campaignData.description,
          budget_min: budgetMin,
          budget_max: budgetMax,
          deadline: deadline.toISOString(),
          requirements: campaignData.requirements,
          max_ambassadors: 10, // Default value
          status: "draft", // Start as draft
          client_id: campaignData.clientId, // Include client_id
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError(error, "createCampaign");
    }
  }

  /**
   * Get all campaigns for the currently logged-in client.
   * RLS policy ensures they can only see their own campaigns.
   */
  async getMyClientCampaigns() {
    try {
      const { data, error } = await this.supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError(error, "getMyClientCampaigns");
    }
  }

  /**
   * Get all active campaigns for ambassadors to browse.
   * RLS policy ensures they can only see campaigns with status = 'active'.
   */
  async getAllOpenCampaigns() {
    try {
      const { data, error } = await this.supabase
        .from("campaigns")
        .select("*, client_profiles(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError(error, "getAllOpenCampaigns");
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string) {
    try {
      const { data, error } = await this.supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError(error, "getCampaign");
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<CampaignData>) {
    try {
      const { data, error } = await this.supabase
        .from("campaigns")
        .update(updates)
        .eq("id", campaignId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError(error, "updateCampaign");
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string) {
    try {
      const { error } = await this.supabase
        .from("campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error, "deleteCampaign");
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: string) {
    try {
      const { error } = await this.supabase
        .from("campaigns")
        .update({ status })
        .eq("id", campaignId);

      if (error) throw error;
      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error, "updateCampaignStatus");
    }
  }

  /**
   * Add an ambassador to a campaign
   * This creates a campaign_ambassadors relationship and chat room
   */
  async addAmbassadorToCampaign(campaignId: string, ambassadorId: string) {
    try {
      // First check if the ambassador is already added to this campaign
      const { data: existing, error: checkError } = await this.supabase
        .from("campaign_ambassadors")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("ambassador_id", ambassadorId)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

      if (checkError) {
        throw checkError;
      }

      if (existing) {
        // Ambassador already added to campaign - return error to block the attempt
        return { 
          data: null, 
          error: { 
            message: "This ambassador has already been added to this campaign",
            code: "DUPLICATE_RELATIONSHIP"
          }
        };
      }

      // Insert new ambassador-campaign relationship
      const { data, error } = await this.supabase
        .from("campaign_ambassadors")
        .insert({
          campaign_id: campaignId,
          ambassador_id: ambassadorId,
        })
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleError(error, "addAmbassadorToCampaign");
    }
  }

  /**
   * Get ambassadors for a campaign
   */
  async getCampaignAmbassadors(campaignId: string) {
    try {
      const { data, error } = await this.supabase
        .from("campaign_ambassadors")
        .select(`
          *,
          ambassador_profiles!inner(
            id,
            name,
            avatar_url,
            instagram_handle,
            tiktok_handle,
            twitter_handle
          )
        `)
        .eq("campaign_id", campaignId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return handleError(error, "getCampaignAmbassadors");
    }
  }

  /**
   * Get campaign ambassador rows (join table entries)
   */
  async getCampaignAmbassadorRows(campaignId: string) {
    try {
      const { data, error } = await this.supabase
        .from("campaign_ambassadors")
        .select("*")
        .eq("campaign_id", campaignId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return handleError(error, "getCampaignAmbassadorRows");
    }
  }

  /**
   * Get all campaigns for a specific ambassador
   */
  async getCampaignsForAmbassador(ambassadorId: string) {
    try {
      const { data, error } = await this.supabase
        .from("campaign_ambassadors")
        .select(`
          *,
          campaigns!inner(*)
        `)
        .eq("ambassador_id", ambassadorId);

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      return handleError(error, "getCampaignsForAmbassador");
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();

// Export individual methods for convenience
export const {
  createCampaign,
  getMyClientCampaigns,
  getAllOpenCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  addAmbassadorToCampaign,
  getCampaignAmbassadors,
  getCampaignAmbassadorRows,
} = campaignService;