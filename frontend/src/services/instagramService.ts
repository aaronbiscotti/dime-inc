/**
 * Instagram Service - Handles all Instagram-related operations via direct Supabase calls
 * IGNORE THIS FOR NOW.
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

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
  private supabase = createClient(); // Instantiate the client

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
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Save Instagram connection to user's profile
      const { data, error } = await this.supabase
        .from("instagram_connections")
        .upsert({
          user_id: user.id,
          instagram_user_id: instagramUserId,
          access_token: shortLivedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        username: data.username,
        expiresIn: 60 * 24 * 60 * 60, // 60 days in seconds
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
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return { connected: false };

      const { data, error } = await this.supabase
        .from("instagram_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) return { connected: false };

      return {
        connected: true,
        username: data.username,
        expires_at: data.expires_at,
      };
    } catch (error) {
      console.error("Failed to get Instagram connection:", error);
      return { connected: false };
    }
  }

  /**
   * Fetch user's Instagram media (Reels, posts)
   * Note: This would need to be implemented with Instagram Basic Display API
   * or Instagram Graph API integration
   */
  async getUserMedia(limit: number = 25): Promise<InstagramMedia[]> {
    try {
      // This would need to be implemented with actual Instagram API calls
      // For now, return empty array as this requires external API integration
      console.warn("Instagram media fetching not implemented - requires Instagram API integration");
      return [];
    } catch (error) {
      console.error("Failed to get Instagram media:", error);
      return [];
    }
  }

  /**
   * Fetch insights for a specific media item
   * Note: This would need to be implemented with Instagram Graph API
   */
  async getMediaInsights(mediaId: string): Promise<InstagramInsights> {
    try {
      // This would need to be implemented with actual Instagram API calls
      // For now, return empty object as this requires external API integration
      console.warn("Instagram insights fetching not implemented - requires Instagram API integration");
      return {};
    } catch (error) {
      console.error("Failed to get Instagram insights:", error);
      return {};
    }
  }
}

export const instagramService = new InstagramService();