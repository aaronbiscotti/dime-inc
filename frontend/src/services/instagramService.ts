import { createClient } from "@/utils/supabase/client";

const INSTAGRAM_GRAPH_API_URL = "https://graph.instagram.com";

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
  id: string;
  ambassador_id: string;
  instagram_user_id: string;
  instagram_username: string;
  access_token: string;
  token_expires_at: string;
  created_at: string;
  updated_at: string;
}

class InstagramService {
  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API_URL}/access_token?` +
        new URLSearchParams({
          grant_type: "ig_exchange_token",
          client_secret: process.env.INSTAGRAM_APP_SECRET!,
          access_token: shortLivedToken,
        })
    );

    if (!response.ok) {
      throw new Error("Failed to exchange token");
    }

    return await response.json();
  }

  /**
   * Refresh long-lived token before expiration
   */
  async refreshLongLivedToken(currentToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API_URL}/refresh_access_token?` +
        new URLSearchParams({
          grant_type: "ig_refresh_token",
          access_token: currentToken,
        })
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    return await response.json();
  }

  /**
   * Fetch user's media (Reels, posts)
   */
  async getUserMedia(
    accessToken: string,
    userId: string,
    limit: number = 25
  ): Promise<InstagramMedia[]> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API_URL}/${userId}/media?` +
        new URLSearchParams({
          fields:
            "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username",
          limit: limit.toString(),
          access_token: accessToken,
        })
    );

    if (!response.ok) {
      throw new Error("Failed to fetch media");
    }

    const data = await response.json();
    return data.data || [];
  }

  /**
   * Fetch insights for a specific media item
   */
  async getMediaInsights(
    accessToken: string,
    mediaId: string
  ): Promise<InstagramInsights> {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API_URL}/${mediaId}/insights?` +
        new URLSearchParams({
          metric: "plays,reach,likes,comments,shares,saved,total_interactions",
          access_token: accessToken,
        })
    );

    if (!response.ok) {
      throw new Error("Failed to fetch insights");
    }

    const data = await response.json();
    const insights: InstagramInsights = {};

    // Parse insights response
    data.data?.forEach((metric: { name: string; values: { value: number }[] }) => {
      const value = metric.values[0]?.value;
      switch (metric.name) {
        case "plays":
          insights.plays = value;
          break;
        case "reach":
          insights.reach = value;
          break;
        case "likes":
          insights.likes = value;
          break;
        case "comments":
          insights.comments = value;
          break;
        case "shares":
          insights.shares = value;
          break;
        case "saved":
          insights.saved = value;
          break;
        case "total_interactions":
          insights.total_interactions = value;
          break;
      }
    });

    return insights;
  }

  /**
   * Save Instagram connection to database
   */
  async saveConnection(
    ambassadorId: string,
    instagramUserId: string,
    instagramUsername: string,
    accessToken: string,
    expiresIn: number
  ): Promise<{ error: any }> {
    const supabase = createClient();
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error } = await supabase.from("instagram_connections").upsert(
      {
        ambassador_id: ambassadorId,
        instagram_user_id: instagramUserId,
        instagram_username: instagramUsername,
        access_token: accessToken,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "ambassador_id",
      }
    );

    return { error };
  }

  /**
   * Get Instagram connection for ambassador
   */
  async getConnection(ambassadorId: string): Promise<{
    data: InstagramConnection | null;
    error: any;
  }> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("instagram_connections")
      .select("*")
      .eq("ambassador_id", ambassadorId)
      .maybeSingle();

    return { data, error };
  }

  /**
   * Check if token needs refresh (within 7 days of expiration)
   */
  shouldRefreshToken(expiresAt: string): boolean {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry =
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return daysUntilExpiry < 7;
  }

  /**
   * Auto-refresh token if needed
   */
  async ensureValidToken(
    connection: InstagramConnection
  ): Promise<{ accessToken: string; error: any }> {
    if (!this.shouldRefreshToken(connection.token_expires_at)) {
      return { accessToken: connection.access_token, error: null };
    }

    try {
      const { access_token, expires_in } = await this.refreshLongLivedToken(
        connection.access_token
      );

      // Update token in database
      await this.saveConnection(
        connection.ambassador_id,
        connection.instagram_user_id,
        connection.instagram_username,
        access_token,
        expires_in
      );

      return { accessToken: access_token, error: null };
    } catch (error) {
      return { accessToken: "", error };
    }
  }
}

export const instagramService = new InstagramService();
