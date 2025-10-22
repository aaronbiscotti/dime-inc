/**
 * Chat Service - Handles all chat-related operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

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
  private supabase = createClient(); // Instantiate the client

  /**
   * Create a private chat between current user and another user
   * Returns existing chat if one already exists
   */
  async createChat(params: CreateChatParams) {
    try {
      // First check if a chat already exists between these users
      const { data: existingChats, error: checkError } = await this.supabase
        .from("chat_rooms")
        .select(`
          *,
          chat_participants!inner(
            user_id,
            profiles!inner(
              id,
              email,
              role
            )
          )
        `)
        .eq("is_group", false);

      if (checkError) throw checkError;

      // Check if a chat already exists with this participant
      const existingChat = existingChats?.find(chat => 
        chat.chat_participants.some((p: any) => p.user_id === params.participant_id)
      );

      if (existingChat) {
        return {
          data: existingChat,
          existed: true,
          error: null,
        };
      }

      // Create new chat
      const { data: newChat, error: createError } = await this.supabase
        .from("chat_rooms")
        .insert({
          name: null,
          is_group: false,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add participants
      const { error: participantError } = await this.supabase
        .from("chat_participants")
        .insert([
          { chat_room_id: newChat.id, user_id: params.participant_id },
          // Current user will be added automatically by RLS
        ]);

      if (participantError) throw participantError;

      return {
        data: newChat,
        existed: false,
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
      const { data: newChat, error: createError } = await this.supabase
        .from("chat_rooms")
        .insert({
          name: params.name,
          is_group: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add participants
      const participants = params.participant_ids.map(userId => ({
        chat_room_id: newChat.id,
        user_id: userId,
      }));

      const { error: participantError } = await this.supabase
        .from("chat_participants")
        .insert(participants);

      if (participantError) throw participantError;

      return {
        data: newChat,
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
      const { data, error } = await this.supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", chatRoomId)
        .single();

      if (error) throw error;

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
      const { data, error } = await this.supabase
        .from("messages")
        .insert({
          chat_room_id: chatRoomId,
          content: params.content.trim(),
          file_url: params.file_url || null,
          reply_to_message_id: params.reply_to_message_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        data: data as Message,
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
      const { data, error, count } = await this.supabase
        .from("messages")
        .select("*", { count: 'exact' })
        .eq("chat_room_id", chatRoomId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: data as Message[],
        count: count || 0,
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
      const { data, error } = await this.supabase
        .from("chat_participants")
        .select(`
          *,
          profiles!inner(
            id,
            email,
            role
          ),
          ambassador_profiles(
            name,
            bio,
            location,
            niches,
            instagram_handle,
            tiktok_handle,
            twitter_handle,
            avatar_url
          ),
          client_profiles(
            company_name,
            company_description,
            industry,
            logo_url,
            website
          )
        `)
        .eq("chat_room_id", chatRoomId);

      if (error) throw error;

      // Transform the data to match the expected format
      const participants = data?.map((p: any) => ({
        user_id: p.user_id,
        role: p.profiles.role,
        name: p.ambassador_profiles?.name || p.client_profiles?.company_name || 'Unknown',
        profile_photo: p.ambassador_profiles?.avatar_url || p.client_profiles?.logo_url,
        bio: p.ambassador_profiles?.bio,
        location: p.ambassador_profiles?.location,
        niche: p.ambassador_profiles?.niches,
        instagram_handle: p.ambassador_profiles?.instagram_handle,
        tiktok_handle: p.ambassador_profiles?.tiktok_handle,
        twitter_handle: p.ambassador_profiles?.twitter_handle,
        company_description: p.client_profiles?.company_description,
        industry: p.client_profiles?.industry,
        logo_url: p.client_profiles?.logo_url,
        website: p.client_profiles?.website,
      })) || [];

      return {
        data: participants as ChatParticipant[],
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
      const { data: participants, error } = await this.getParticipants(chatRoomId);
      
      if (error) return { data: null, error };

      // Get current user's ID from auth
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: {
            message: "User not authenticated",
            shouldRemove: true,
          } as any,
        };
      }

      // Find the other participant
      const otherParticipant = participants.data?.find(p => p.user_id !== user.id);
      
      if (!otherParticipant) {
        return {
          data: null,
          error: {
            message: "Chat no longer available",
            shouldRemove: true,
          } as any,
        };
      }

      return { data: otherParticipant, error: null };
    } catch (error) {
      return handleError(error, "getOtherParticipant");
    }
  }

  /**
   * Add a participant to a group chat
   */
  async addParticipant(chatRoomId: string, userId: string) {
    try {
      const { error } = await this.supabase
        .from("chat_participants")
        .insert({
          chat_room_id: chatRoomId,
          user_id: userId,
        });

      if (error) throw error;

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
      const { error } = await this.supabase
        .from("chat_participants")
        .delete()
        .eq("chat_room_id", chatRoomId)
        .eq("user_id", userId);

      if (error) throw error;

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
      const { error } = await this.supabase
        .from("chat_rooms")
        .delete()
        .eq("id", chatRoomId);

      if (error) throw error;

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
      const { data, error } = await this.supabase
        .from("chat_rooms")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      return {
        data: data as ChatRoom[],
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
      const { data, error } = await this.supabase
        .from("contracts")
        .select("*")
        .eq("chat_room_id", chatRoomId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned

      return {
        data: data as Contract | null,
        error: null,
      };
    } catch (error) {
      return handleError(error, "getContractByChatId");
    }
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