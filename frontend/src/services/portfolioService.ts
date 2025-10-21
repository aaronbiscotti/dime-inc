/**
 * Portfolio Service - Handles all portfolio-related operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from '@/config/api';
import { authFetch, authPost, authPut, authDelete, handleApiResponse } from '@/utils/fetch';

const API_BASE_URL = API_URL;

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
  media_urls: string[];
  campaign_date?: string | null;
  results?: {
    views?: number;
    likes?: number;
    engagement?: number;
    [key: string]: unknown;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioData {
  title: string;
  description?: string;
  instagram_url?: string;
  tiktok_url?: string;
  media_urls: string[];
  campaign_date?: string;
  results?: {
    views?: number;
    likes?: number;
    engagement?: number;
    [key: string]: unknown;
  };
}

export interface UpdatePortfolioData {
  title?: string;
  description?: string;
  instagram_url?: string;
  tiktok_url?: string;
  media_urls?: string[];
  campaign_date?: string;
  results?: {
    views?: number;
    likes?: number;
    engagement?: number;
    [key: string]: unknown;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handle API errors consistently
 */
function handleError(error: unknown, context: string) {
  console.error(`[PortfolioService] ${context}:`, error);
  
  const message = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : 'An unexpected error occurred';
  
  throw new Error(message);
}

// ============================================================================
// PORTFOLIO SERVICE
// ============================================================================

class PortfolioService {
  /**
   * Create a new portfolio item
   */
  async createPortfolio(data: CreatePortfolioData): Promise<PortfolioItem> {
    try {
      const response = await authPost(`${API_BASE_URL}/api/portfolios/create`, data);
      const result = await handleApiResponse<{ portfolio: PortfolioItem }>(response);
      return result.portfolio;
    } catch (error) {
      return handleError(error, 'createPortfolio');
    }
  }

  /**
   * Get all portfolio items for an ambassador
   */
  async getAmbassadorPortfolio(ambassadorId: string): Promise<PortfolioItem[]> {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/portfolios/ambassador/${ambassadorId}`);
      const result = await handleApiResponse<{ data: PortfolioItem[] }>(response);
      return result.data || [];
    } catch (error) {
      return handleError(error, 'getAmbassadorPortfolio');
    }
  }

  /**
   * Get a single portfolio item by ID
   */
  async getPortfolioItem(portfolioId: string): Promise<PortfolioItem> {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/portfolios/${portfolioId}`);
      return await handleApiResponse<PortfolioItem>(response);
    } catch (error) {
      return handleError(error, 'getPortfolioItem');
    }
  }

  /**
   * Update a portfolio item
   */
  async updatePortfolio(portfolioId: string, data: UpdatePortfolioData): Promise<PortfolioItem> {
    try {
      const response = await authPut(`${API_BASE_URL}/api/portfolios/${portfolioId}`, data);
      const result = await handleApiResponse<{ portfolio: PortfolioItem }>(response);
      return result.portfolio;
    } catch (error) {
      return handleError(error, 'updatePortfolio');
    }
  }

  /**
   * Delete a portfolio item
   */
  async deletePortfolio(portfolioId: string): Promise<void> {
    try {
      const response = await authDelete(`${API_BASE_URL}/api/portfolios/${portfolioId}`);
      await handleApiResponse(response);
    } catch (error) {
      return handleError(error, 'deletePortfolio');
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
  deletePortfolio
} = portfolioService;

