/**
 * Chat Service - Handles all chat-related operations via backend API
 * NO direct Supabase calls - all operations go through FastAPI backend
 */

import { API_URL } from "@/config/api";
import {
  authFetch,
  authPost,
  authDelete,
  handleApiResponse,
} from "@/utils/fetch";

const API_BASE_URL = API_URL;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ChatParticipant {
  user_id: string;
  role: "client" | "ambassador";
  name: string;
  profile_photo?: string | null;
  // Ambassador-specific fields
  bio?: string | null;
  location?: string | null;
  niche?: string[] | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
  // Client-specific fields
  company_description?: string | null;
  industry?: string | null;
  logo_url?: string | null;
  website?: string | null;
}

export interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content: string | null;
  file_url?: string | null;
  reply_to_message_id?: string | null; // FIX: Allow null
  created_at: string;
}

export interface CreateChatParams {
  participant_id: string;
  participant_name?: string;
  participant_role: "client" | "ambassador";
}

export interface CreateGroupChatParams {
  name: string;
  participant_ids: string[];
}

export interface SendMessageParams {
  content: string;
  file_url?: string | null; // FIX: Allow null
  reply_to_message_id?: string | null; // FIX: Allow null
}

export interface Contract {
  id: string;
  ambassador_signed_at: string | null;
  campaign_ambassador_id: string | null;
  client_id: string | null;
  client_signed_at: string | null;
  contract_file_url: string | null;
  contract_text: string | null;
  cost_per_cpm: number | null;
  created_at: string | null;
  payment_type: "pay_per_post" | "pay_per_cpm";
  pdf_url: string | null;
  start_date: string | null;
  target_impressions: number | null;
  terms_accepted: boolean;
  updated_at: string | null;
  usage_rights_duration: string | null;
  // Add campaign and ambassador names for UI display
  campaign_name?: string;
  ambassador_name?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
function handleError(error: unknown, context: string): ErrorResponse {
  console.error(`[ChatService] ${context}:`, error);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "An unexpected error occurred";

  // Propagate error to UI layer - don't just log it!
  return {
    data: null,
    error: { message },
  };
}

// ============================================================================
// CHAT SERVICE
// ============================================================================

class ChatService {
  /**
   * Create a private chat between current user and another user
   * Returns existing chat if one already exists
   */
  async createChat(params: CreateChatParams) {
    try {
      const response = await authPost(`${API_BASE_URL}/api/chats/create`, {
        participant_id: params.participant_id,
        participant_name: params.participant_name,
        participant_role: params.participant_role,
      });

      const data = await handleApiResponse<{
        chat: ChatRoom;
        existed: boolean;
      }>(response);

      return {
        data: data.chat,
        existed: data.existed,
        error: null,
      };
    } catch (error) {
      return handleError(error, "createChat");
    }
  }

  /**
   * Create a group chat with multiple participants
   */
  async createGroupChat(params: CreateGroupChatParams) {
    try {
      const response = await authPost(`${API_BASE_URL}/api/chats/group`, {
        name: params.name,
        participant_ids: params.participant_ids,
      });

      const data = await handleApiResponse<{ chat: ChatRoom }>(response);

      return {
        data: data.chat,
        error: null,
      };
    } catch (error) {
      return handleError(error, "createGroupChat");
    }
  }

  /**
   * Get chat room details
   */
  async getChatRoom(chatRoomId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/chats/${chatRoomId}`
      );
      const data = await handleApiResponse<ChatRoom>(response);

      return {
        data: data as ChatRoom,
        error: null,
      };
    } catch (error) {
      return handleError(error, "getChatRoom");
    }
  }

  /**
   * Send a message to a chat room
   */
  async sendMessage(chatRoomId: string, params: SendMessageParams) {
    try {
      const payload: SendMessageParams = {
        content: params.content.trim(),
        file_url: params.file_url || null,
        reply_to_message_id: params.reply_to_message_id || null,
      };

      const response = await authPost(
        `${API_BASE_URL}/api/chats/${chatRoomId}/messages`,
        payload
      );

      const data = await handleApiResponse<{ message: Message }>(response);

      return {
        data: data.message as Message,
        error: null,
      };
    } catch (error) {
      return handleError(error, "sendMessage");
    }
  }

  /**
   * Get messages from a chat room
   */
  async getMessages(
    chatRoomId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/chats/${chatRoomId}/messages?limit=${limit}&offset=${offset}`
      );

      const data = await handleApiResponse<{
        messages: Message[];
        count: number;
      }>(response);

      return {
        data: data.messages as Message[],
        count: data.count,
        error: null,
      };
    } catch (error) {
      return handleError(error, "getMessages");
    }
  }

  /**
   * Get all participants in a chat room with their profile information
   */
  async getParticipants(chatRoomId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/chats/${chatRoomId}/participants`
      );
      const data = await handleApiResponse<{ participants: ChatParticipant[] }>(
        response
      );

      return {
        data: data.participants as ChatParticipant[],
        error: null,
      };
    } catch (error) {
      return handleError(error, "getParticipants");
    }
  }

  /**
   * Get the other participant in a private chat (not the current user)
   * This endpoint is specifically for 1-on-1 chats
   */
  async getOtherParticipant(chatRoomId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/chats/${chatRoomId}/other-participant`
      );

      if (response.status === 410) {
        // Orphaned chat; trigger local cleanup hint
        await this.handleOrphanedChat(chatRoomId);
        return {
          data: null,
          error: {
            message: "Chat no longer available",
            shouldRemove: true,
          } as any,
        };
      }

      const data = await handleApiResponse<{ participant: ChatParticipant }>(
        response
      );
      return { data: data.participant as ChatParticipant, error: null };
    } catch (error) {
      return handleError(error, "getOtherParticipant");
    }
  }

  private async handleOrphanedChat(chatRoomId: string) {
    try {
      const raw = localStorage.getItem("cached_chats") || "[]";
      const chats = JSON.parse(raw);
      const filtered = Array.isArray(chats)
        ? chats.filter((c: any) => c?.id !== chatRoomId)
        : [];
      localStorage.setItem("cached_chats", JSON.stringify(filtered));
    } catch (e) {
      console.warn("Could not clean local chat cache", e);
    }
  }

  /**
   * Add a participant to a group chat
   */
  async addParticipant(chatRoomId: string, userId: string) {
    try {
      const response = await authPost(
        `${API_BASE_URL}/api/chats/${chatRoomId}/participants`,
        {
          user_id: userId,
        }
      );

      await handleApiResponse(response);

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return handleError(error, "addParticipant");
    }
  }

  /**
   * Remove a participant from a group chat
   */
  async removeParticipant(chatRoomId: string, userId: string) {
    try {
      const response = await authDelete(
        `${API_BASE_URL}/api/chats/${chatRoomId}/participants/${userId}`
      );
      await handleApiResponse(response);

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return handleError(error, "removeParticipant");
    }
  }

  /**
   * Delete a chat room and all associated data
   */
  async deleteChat(chatRoomId: string) {
    try {
      const response = await authDelete(
        `${API_BASE_URL}/api/chats/${chatRoomId}`
      );
      await handleApiResponse(response);

      return {
        data: { success: true },
        error: null,
      };
    } catch (error) {
      return handleError(error, "deleteChat");
    }
  }

  /**
   * Get all chat rooms for the current user
   */
  async getUserChats() {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/chats/`);
      const data = await handleApiResponse<{ chats: ChatRoom[] }>(response);

      return {
        data: data.chats as ChatRoom[],
        error: null,
      };
    } catch (error) {
      return handleError(error, "getUserChats");
    }
  }

  /**
   * Get contract associated with a chat room (via campaign_ambassadors)
   */
  async getContractByChatId(chatRoomId: string) {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/chats/${chatRoomId}/contract`
      );
      const data = await handleApiResponse<{ contract: Contract | null }>(
        response
      );

      return {
        data: data.contract as Contract | null,
        error: null,
      };
    } catch (error) {
      return handleError(error, "getContractByChatId");
    }
  }

  /**
   * Check if a private chat exists between two users
   * Note: This is now handled by createChat which returns existing chats
   * Kept for backwards compatibility
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async checkExistingChat(userId1: string, userId2: string) {
    // This functionality is now handled by createChat
    // If a chat exists, createChat will return it with existed: true
    console.warn(
      "checkExistingChat is deprecated. Use createChat instead which handles existing chats."
    );
    return {
      data: null,
      error: { message: "Use createChat instead" },
    };
  }

  /**
   * Check if user is a member of a chat
   * This is now handled server-side automatically
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async isMember(chatRoomId: string, userId: string) {
    // Membership is checked server-side on all endpoints
    // This method is kept for backwards compatibility
    console.warn(
      "isMember is deprecated. Membership is checked server-side automatically."
    );
    return {
      data: true,
      error: null,
    };
  }
}

// Export singleton instance
export const chatService = new ChatService();

// Export legacy functions for backwards compatibility
export const {
  createChat,
  createGroupChat,
  sendMessage,
  getMessages,
  getParticipants,
  getOtherParticipant,
  addParticipant,
  removeParticipant,
  deleteChat,
  getUserChats,
  getContractByChatId,
  getChatRoom,
} = chatService;
