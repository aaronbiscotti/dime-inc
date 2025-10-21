import { API_URL } from "@/config/api";
import { authFetch, authPost, handleApiResponse } from "@/utils/fetch";

const API_BASE_URL = API_URL;

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  username: string;
}

export interface InstagramInsights {
  plays?: number;
  reach?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saved?: number;
  total_interactions?: number;
}

export interface InstagramConnection {
  connected: boolean;
  username?: string;
  expires_at?: string;
}

class InstagramService {
  /**
   * Save Instagram connection after OAuth
   */
  async saveConnection(
    shortLivedToken: string,
    instagramUserId: string
  ): Promise<{
    success: boolean;
    username?: string;
    expiresIn?: number;
    error?: string;
  }> {
    try {
      const response = await authPost(`${API_BASE_URL}/api/instagram/connect`, {
        short_lived_token: shortLivedToken,
        instagram_user_id: instagramUserId,
      });

      const data = await handleApiResponse<{
        username: string;
        expires_in: number;
      }>(response);

      return {
        success: true,
        username: data.username,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect Instagram",
      };
    }
  }

  /**
   * Get Instagram connection status
   */
  async getConnection(): Promise<InstagramConnection> {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/instagram/connect`);
      const data = await handleApiResponse<InstagramConnection>(response);
      return data;
    } catch (error) {
      console.error("Failed to get Instagram connection:", error);
      return { connected: false };
    }
  }

  /**
   * Fetch user's Instagram media (Reels, posts)
   */
  async getUserMedia(limit: number = 25): Promise<InstagramMedia[]> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/instagram/media?limit=${limit}`
      );
      const data = await handleApiResponse<{ data: InstagramMedia[] }>(
        response
      );
      return data.data || [];
    } catch (error) {
      console.error("Failed to get Instagram media:", error);
      return [];
    }
  }

  /**
   * Fetch insights for a specific media item
   */
  async getMediaInsights(mediaId: string): Promise<InstagramInsights> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/instagram/insights/${mediaId}`
      );
      const data = await handleApiResponse<{ data: InstagramInsights }>(
        response
      );
      return data.data || {};
    } catch (error) {
      console.error("Failed to get Instagram insights:", error);
      return {};
    }
  }
}

export const instagramService = new InstagramService();
