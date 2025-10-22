/**
 * Explore Service - Handles exploration/discovery operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

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
      const supabase = createClient();
      
      let query = supabase
        .from("ambassador_profiles")
        .select(`
          *,
          profiles!inner(
            id,
            email,
            role,
            created_at
          )
        `);

      // Apply search filter
      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,bio.ilike.%${params.search}%`);
      }

      // Apply niche filter
      if (params?.niches && params.niches.length > 0) {
        query = query.overlaps("niches", params.niches);
      }

      // Apply location filter
      if (params?.location) {
        query = query.ilike("location", `%${params.location}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
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
      const supabase = createClient();
      
      let query = supabase
        .from("client_profiles")
        .select(`
          *,
          profiles!inner(
            id,
            email,
            role,
            created_at
          )
        `);

      // Apply search filter
      if (params?.search) {
        query = query.or(`company_name.ilike.%${params.search}%,company_description.ilike.%${params.search}%`);
      }

      // Apply industry filter
      if (params?.industry) {
        query = query.eq("industry", params.industry);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
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
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("ambassador_profiles")
        .select(`
          *,
          profiles!inner(
            id,
            email,
            role,
            created_at
          )
        `)
        .eq("id", ambassadorId)
        .single();

      if (error) throw error;
      return data;
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
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from("client_profiles")
        .select(`
          *,
          profiles!inner(
            id,
            email,
            role,
            created_at
          )
        `)
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('[ExploreService] getClientDetails:', error);
      throw error;
    }
  }
};