/**
 * Campaign Service - Handles all campaign-related operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from '@/config/api';

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
  requirements?: string[];
  targetNiches?: string[];
  campaignType?: string;
  deliverables?: string[];
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  budget: string;
  timeline: string;
  requirements?: string[];
  target_niches?: string[];
  campaign_type?: string;
  deliverables?: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

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
 * Get authentication token from localStorage
 */
function getAuthToken(): string {
  const token = localStorage.getItem('auth-token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

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
function handleError(error: any, context: string): ErrorResponse {
  console.error(`[CampaignService] ${context}:`, error);
  
  const message = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : 'An unexpected error occurred';
  
  // Propagate error to UI layer
  return {
    data: null,
    error: { message }
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
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: campaignData.title,
          description: campaignData.description,
          budget: campaignData.budget,
          timeline: campaignData.timeline,
          requirements: campaignData.requirements,
          target_niches: campaignData.targetNiches,
          campaign_type: campaignData.campaignType,
          deliverables: campaignData.deliverables
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create campaign');
      }

      return { data: data.campaign, error: null };
    } catch (error) {
      return handleError(error, 'createCampaign');
    }
  }

  /**
   * Get all campaigns for a specific client
   */
  async getCampaignsForClient(clientId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to fetch campaigns');
      }

      return { data: result.data || [], error: null };
    } catch (error) {
      return handleError(error, 'getCampaignsForClient');
    }
  }

  /**
   * Get all open campaigns (for ambassadors to browse)
   */
  async getAllOpenCampaigns() {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to fetch open campaigns');
      }

      return { data: result.data || [], error: null };
    } catch (error) {
      return handleError(error, 'getAllOpenCampaigns');
    }
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaign(campaignId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch campaign');
      }

      return { data, error: null };
    } catch (error) {
      return handleError(error, 'getCampaign');
    }
  }

  /**
   * Update a campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<CampaignData>) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update campaign');
      }

      return { data: data.campaign, error: null };
    } catch (error) {
      return handleError(error, 'updateCampaign');
    }
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(campaignId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete campaign');
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error, 'deleteCampaign');
    }
  }

  /**
   * Publish a campaign (change status from draft to active)
   */
  async publishCampaign(campaignId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to publish campaign');
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error, 'publishCampaign');
    }
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(campaignId: string, status: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update campaign status');
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error, 'updateCampaignStatus');
    }
  }

  /**
   * Add an ambassador to a campaign
   * This creates a campaign_ambassadors relationship and chat room
   */
  async addAmbassadorToCampaign(campaignId: string, ambassadorId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/ambassadors/${ambassadorId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to add ambassador to campaign');
      }

      return { data: data, error: null };
    } catch (error) {
      return handleError(error, 'addAmbassadorToCampaign');
    }
  }

  /**
   * Get ambassadors for a campaign
   */
  async getCampaignAmbassadors(campaignId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/ambassadors`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch campaign ambassadors');
      }

      return { data: data.ambassadors || [], error: null };
    } catch (error) {
      return handleError(error, 'getCampaignAmbassadors');
    }
  }

  /**
   * Delete campaign_ambassadors row by chat_room_id
   * This is used when deleting a chat to keep data in sync
   */
  async deleteCampaignAmbassadorByChatRoomId(chatRoomId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/campaigns/ambassadors/chat/${chatRoomId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to delete campaign ambassador');
      }

      return { data: { success: true }, error: null };
    } catch (error) {
      return handleError(error, 'deleteCampaignAmbassadorByChatRoomId');
    }
  }

  /**
   * Get campaign ambassador rows (join table entries)
   */
  async getCampaignAmbassadorRows(campaignId: string) {
    try {
      const token = getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/campaigns/${campaignId}/ambassador-rows`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to fetch campaign ambassador rows');
      }

      return { data: data.rows || [], error: null };
    } catch (error) {
      return handleError(error, 'getCampaignAmbassadorRows');
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
  publishCampaign,
  updateCampaignStatus,
  addAmbassadorToCampaign,
  getCampaignAmbassadors,
  deleteCampaignAmbassadorByChatRoomId,
  getCampaignAmbassadorRows
} = campaignService;
