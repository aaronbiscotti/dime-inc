/**
 * Explore Service - Handles exploration/discovery operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from '@/config/api';
import { authFetch, handleApiResponse } from '@/utils/fetch';

const API_BASE_URL = API_URL;

// ============================================================================
// EXPLORE SERVICE
// ============================================================================

export const exploreService = {
  /**
   * Get all ambassadors for exploration/discovery
   */
  async getAmbassadors(params?: {
    search?: string;
    niches?: string[];
    location?: string;
  }) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.niches) params.niches.forEach(n => queryParams.append('niches', n));
      if (params?.location) queryParams.append('location', params.location);
      
      const response = await authFetch(`${API_BASE_URL}/api/explore/ambassadors?${queryParams}`);
      const result = await handleApiResponse<{ data: unknown[] }>(response);
      return result.data || [];
    } catch (error) {
      console.error('[ExploreService] getAmbassadors:', error);
      throw error;
    }
  },

  /**
   * Get all clients for exploration/discovery
   */
  async getClients(params?: {
    search?: string;
    industry?: string;
  }) {
    try {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.industry) queryParams.append('industry', params.industry);
      
      const response = await authFetch(`${API_BASE_URL}/api/explore/clients?${queryParams}`);
      const result = await handleApiResponse<{ data: unknown[] }>(response);
      return result.data || [];
    } catch (error) {
      console.error('[ExploreService] getClients:', error);
      throw error;
    }
  },

  /**
   * Get detailed information about a specific ambassador
   */
  async getAmbassadorDetails(ambassadorId: string) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/explore/ambassador/${ambassadorId}`);
      return await handleApiResponse(response);
    } catch (error) {
      console.error('[ExploreService] getAmbassadorDetails:', error);
      throw error;
    }
  },

  /**
   * Get detailed information about a specific client
   */
  async getClientDetails(clientId: string) {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/explore/client/${clientId}`);
      return await handleApiResponse(response);
    } catch (error) {
      console.error('[ExploreService] getClientDetails:', error);
      throw error;
    }
  }
};

