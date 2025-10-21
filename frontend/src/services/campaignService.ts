/**
 * Campaign Service - Handles all campaign-related operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from "@/config/api";
import {
  authFetch,
  authPost,
  authPut,
  authDelete,
  handleApiResponse,
} from "@/utils/fetch";
import { Campaign as DatabaseCampaign } from "@/types/database";

const API_BASE_URL = API_URL;

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
export type Campaign = DatabaseCampaign;

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
  /**
   * Create a new campaign
   */
  async createCampaign(campaignData: CampaignData) {
    try {
      const response = await authPost(`${API_BASE_URL}/api/campaigns/create`, {
        title: campaignData.title,
        description: campaignData.description,
        budget: campaignData.budget,
        timeline: campaignData.timeline,
        requirements: campaignData.requirements,
        target_niches: campaignData.targetNiches,
        campaign_type: campaignData.campaignType,
        deliverables: campaignData.deliverables,
      });

      const data = await handleApiResponse<{ campaign: Campaign }>(response);
      return { data: data.campaign, error: null };
    } catch (error) {
      return handleError(error, "createCampaign");
    }
  }

  /**
   * Get all campaigns for a specific client
   */
  async getCampaignsForClient(clientId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/campaigns/client/${clientId}`
      );
      const result = await handleApiResponse<{ data: Campaign[] }>(response);
      return { data: result.data || [], error: null };
    } catch (error) {
      return handleError(error, "getCampaignsForClient");
    }
  }

  /**
   * Get all open campaigns (for ambassadors to browse)
   */
  async getAllOpenCampaigns() {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/campaigns/all`);
      const result = await handleApiResponse<{ data: Campaign[] }>(response);
      return { data: result.data || [], error: null };
    } catch (error) {
      return handleError(error, "getAllOpenCampaigns");
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}`
      );
      const data = await handleApiResponse<Campaign>(response);
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
      const response = await authPut(
        `${API_BASE_URL}/api/campaigns/${campaignId}`,
        updates
      );
      const data = await handleApiResponse<{ campaign: Campaign }>(response);
      return { data: data.campaign, error: null };
    } catch (error) {
      return handleError(error, "updateCampaign");
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string) {
    try {
      const response = await authDelete(
        `${API_BASE_URL}/api/campaigns/${campaignId}`
      );
      await handleApiResponse(response);
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
      const response = await authPut(
        `${API_BASE_URL}/api/campaigns/${campaignId}/status`,
        { status }
      );
      await handleApiResponse(response);
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
      const response = await authPost(
        `${API_BASE_URL}/api/campaigns/${campaignId}/ambassadors/${ambassadorId}`,
        {}
      );

      const data = await handleApiResponse(response);
      return { data: data, error: null };
    } catch (error) {
      return handleError(error, "addAmbassadorToCampaign");
    }
  }

  /**
   * Get ambassadors for a campaign
   */
  async getCampaignAmbassadors(campaignId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/ambassadors`
      );
      const data = await handleApiResponse<{
        ambassadors: CampaignAmbassador[];
      }>(response);
      return { data: data.ambassadors || [], error: null };
    } catch (error) {
      return handleError(error, "getCampaignAmbassadors");
    }
  }

  /**
   * Get campaign ambassador rows (join table entries)
   */
  async getCampaignAmbassadorRows(campaignId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/ambassador-rows`
      );
      const data = await handleApiResponse<{ rows: unknown[] }>(response);
      return { data: data.rows || [], error: null };
    } catch (error) {
      return handleError(error, "getCampaignAmbassadorRows");
    }
  }

  /**
   * Get all campaigns for a specific ambassador
   */
  async getCampaignsForAmbassador(ambassadorId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/campaigns/ambassador/${ambassadorId}`
      );
      const data = await handleApiResponse<{ data: Campaign[] }>(response);
      return { data: data.data || [], error: null };
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
  getCampaignsForClient,
  getAllOpenCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus,
  addAmbassadorToCampaign,
  getCampaignAmbassadors,
  getCampaignAmbassadorRows,
} = campaignService;
