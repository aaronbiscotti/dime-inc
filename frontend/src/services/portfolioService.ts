/**
 * Portfolio Service - Handles all portfolio-related operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PortfolioItem {
  id: string;
  ambassador_id: string;
  title: string;
  description?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  media_urls?: string[] | null;
  campaign_date?: string | null;
  client_id?: string | null;
  results?: {
    views?: number;
    likes?: number;
    engagement?: number;
    [key: string]: unknown;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreatePortfolioData {
  ambassador_id: string;
  title: string;
  description?: string;
  instagram_url?: string;
  tiktok_url?: string;
  media_urls?: string[];
  campaign_date?: string;
  client_id?: string;
  results?: any;
}

export interface UpdatePortfolioData {
  title?: string;
  description?: string;
  instagram_url?: string;
  tiktok_url?: string;
  media_urls?: string[];
  campaign_date?: string;
  client_id?: string;
  results?: any;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API errors consistently
 */
function handleError(error: unknown, context: string): never {
  console.error(`[PortfolioService] ${context}:`, error);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred";

  throw new Error(message);
}

// ============================================================================
// PORTFOLIO SERVICE
// ============================================================================

class PortfolioService {
  private supabase = createClient(); // Instantiate the client

  /**
   * Create a new portfolio item
   */
  async createPortfolio(data: CreatePortfolioData): Promise<PortfolioItem> {
    try {
      const { data: result, error } = await this.supabase
        .from("portfolios")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as PortfolioItem;
    } catch (error) {
      return handleError(error, "createPortfolio");
    }
  }

  /**
   * Get all portfolio items for an ambassador
   */
  async getAmbassadorPortfolio(ambassadorId: string): Promise<PortfolioItem[]> {
    try {
      const { data, error } = await this.supabase
        .from("portfolios")
        .select("*")
        .eq("ambassador_id", ambassadorId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as PortfolioItem[];
    } catch (error) {
      return handleError(error, "getAmbassadorPortfolio");
    }
  }

  /**
   * Get a single portfolio item by ID
   */
  async getPortfolioItem(portfolioId: string): Promise<PortfolioItem> {
    try {
      const { data, error } = await this.supabase
        .from("portfolios")
        .select("*")
        .eq("id", portfolioId)
        .single();

      if (error) throw error;
      return data as PortfolioItem;
    } catch (error) {
      return handleError(error, "getPortfolioItem");
    }
  }

  /**
   * Update a portfolio item
   */
  async updatePortfolio(
    portfolioId: string,
    data: UpdatePortfolioData
  ): Promise<PortfolioItem> {
    try {
      const { data: result, error } = await this.supabase
        .from("portfolios")
        .update(data)
        .eq("id", portfolioId)
        .select()
        .single();

      if (error) throw error;
      return result as PortfolioItem;
    } catch (error) {
      return handleError(error, "updatePortfolio");
    }
  }

  /**
   * Delete a portfolio item
   */
  async deletePortfolio(portfolioId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("portfolios")
        .delete()
        .eq("id", portfolioId);

      if (error) throw error;
    } catch (error) {
      return handleError(error, "deletePortfolio");
    }
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();

// Export individual methods for convenience
export const {
  createPortfolio,
  getAmbassadorPortfolio,
  getPortfolioItem,
  updatePortfolio,
  deletePortfolio,
} = portfolioService;
