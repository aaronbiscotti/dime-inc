/**
 * Centralized API Configuration
 *
 * This file exports the API base URL used by all service files.
 * The URL MUST be set via the NEXT_PUBLIC_API_URL environment variable.
 *
 * Environment Variables:
 * - Development: Set in .env.local -> NEXT_PUBLIC_API_URL=http://localhost:8000
 * - Production: Set in deployment config -> NEXT_PUBLIC_API_URL=https://api.your-domain.com
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error(
    "❌ NEXT_PUBLIC_API_URL is not defined!\n" +
      "   Please set it in your .env.local file for development:\n" +
      "   NEXT_PUBLIC_API_URL=http://localhost:8000\n\n" +
      "   Or in your production environment variables:\n" +
      "   NEXT_PUBLIC_API_URL=https://api.your-domain.com"
  );

  // Throw error in production, use fallback in development
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL environment variable is required in production"
    );
  }

  // Development fallback
  console.warn("⚠️  Using fallback URL for development: http://localhost:8000");
}

// Export with fallback only for development
export const API_URL = API_BASE_URL || "http://localhost:8000";

// Export a helper to build full API URLs
export const buildApiUrl = (path: string): string => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${normalizedPath}`;
};

// Export common API endpoints as constants
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: "/api/auth/login",
  AUTH_SIGNUP: "/api/auth/signup",
  AUTH_RESET_PASSWORD: "/api/auth/reset-password",
  AUTH_VALIDATE_LOGIN: "/api/auth/validate-login",

  // Users
  USERS_ME: "/api/users/me",
  USERS_DELETE: "/api/users/delete",

  // Profiles
  PROFILES_AMBASSADOR: "/api/profiles/ambassador",
  PROFILES_CLIENT: "/api/profiles/client",

  // Campaigns
  CAMPAIGNS_CREATE: "/api/campaigns/create",
  CAMPAIGNS_LIST: "/api/campaigns",
  CAMPAIGNS_BY_CLIENT: (clientId: string) =>
    `/api/campaigns/client/${clientId}`,
  CAMPAIGNS_ALL: "/api/campaigns/all",
  CAMPAIGNS_BY_ID: (id: string) => `/api/campaigns/${id}`,

  // Chats
  CHATS_CREATE: "/api/chats/create",
  CHATS_GROUP: "/api/chats/group",
  CHATS_LIST: "/api/chats/",
  CHATS_BY_ID: (id: string) => `/api/chats/${id}`,
  CHATS_MESSAGES: (id: string) => `/api/chats/${id}/messages`,
  CHATS_PARTICIPANTS: (id: string) => `/api/chats/${id}/participants`,
  CHATS_OTHER_PARTICIPANT: (id: string) => `/api/chats/${id}/other-participant`,
  CHATS_CONTRACT: (id: string) => `/api/chats/${id}/contract`,

  // Portfolios
  PORTFOLIOS_CREATE: "/api/portfolios/create",
  PORTFOLIOS_BY_AMBASSADOR: (ambassadorId: string) =>
    `/api/portfolios/ambassador/${ambassadorId}`,
  PORTFOLIOS_BY_ID: (id: string) => `/api/portfolios/${id}`,

  // Contracts
  CONTRACTS_CREATE: "/api/contracts/create",
  CONTRACTS_BY_CLIENT: (clientId: string) =>
    `/api/contracts/client/${clientId}`,
  CONTRACTS_BY_AMBASSADOR: (ambassadorId: string) =>
    `/api/contracts/ambassador/${ambassadorId}`,
  CONTRACTS_BY_ID: (id: string) => `/api/contracts/${id}`,

  // Explore
  EXPLORE_AMBASSADORS: "/api/explore/ambassadors",
  EXPLORE_CLIENTS: "/api/explore/clients",
  EXPLORE_AMBASSADOR_BY_ID: (id: string) => `/api/explore/ambassador/${id}`,
  EXPLORE_CLIENT_BY_ID: (id: string) => `/api/explore/client/${id}`,

  // Instagram
  // TODO: Implement Instagram integration backend
  INSTAGRAM_CONNECT: "/api/instagram/connect",
  INSTAGRAM_MEDIA: "/api/instagram/media",
  INSTAGRAM_INSIGHTS: (mediaId: string) => `/api/instagram/insights/${mediaId}`,
};
