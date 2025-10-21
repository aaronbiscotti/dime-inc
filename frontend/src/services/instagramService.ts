const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
   * Get authentication token from localStorage
   */
  private getAuthToken(): string {
    const token = localStorage.getItem('auth-token');
    if (!token) {
      throw new Error('Not authenticated');
    }
    return token;
  }

  /**
   * Save Instagram connection after OAuth
   */
  async saveConnection(
    shortLivedToken: string,
    instagramUserId: string
  ): Promise<{ success: boolean; username?: string; expiresIn?: number; error?: string }> {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/instagram/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          short_lived_token: shortLivedToken,
          instagram_user_id: instagramUserId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || 'Failed to connect Instagram' };
      }

      return {
        success: true,
        username: data.username,
        expiresIn: data.expires_in
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Instagram'
      };
    }
  }

  /**
   * Get Instagram connection status
   */
  async getConnection(): Promise<InstagramConnection> {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/instagram/connect`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return { connected: false };
      }

      const data = await response.json();
      
      return {
        connected: data.connected,
        username: data.username,
        expires_at: data.expires_at
      };
    } catch (error) {
      console.error('Failed to get Instagram connection:', error);
      return { connected: false };
    }
  }

  /**
   * Fetch user's Instagram media (Reels, posts)
   */
  async getUserMedia(limit: number = 25): Promise<InstagramMedia[]> {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/instagram/media?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch Instagram media:', error);
      throw error;
    }
  }

  /**
   * Fetch insights for a specific media item
   */
  async getMediaInsights(mediaId: string): Promise<InstagramInsights> {
    try {
      const token = this.getAuthToken();
      
      const response = await fetch(
        `${API_BASE_URL}/api/instagram/insights/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      return data.data || {};
    } catch (error) {
      console.error('Failed to fetch Instagram insights:', error);
      throw error;
    }
  }
}

export const instagramService = new InstagramService();
