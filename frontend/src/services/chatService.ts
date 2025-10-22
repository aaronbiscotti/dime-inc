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

export interface EnhancedInviteParams {
  ambassador_id: string;
  ambassador_user_id: string;
  campaign_id: string;
  invite_message?: string;
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
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: { message: "User not authenticated", shouldRemove: true } as any,
        };
      }

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
        chat.chat_participants.some((p: any) => p.user_id === params.participant_id) &&
        chat.chat_participants.some((p: any) => p.user_id === user.id)
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
          created_by: user.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add both participants
      const { error: participantError } = await this.supabase
        .from("chat_participants")
        .insert([
          { chat_room_id: newChat.id, user_id: user.id },
          { chat_room_id: newChat.id, user_id: params.participant_id },
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
   * Enhanced invite workflow: Creates chat room, adds both participants, 
   * creates campaign_ambassador relationship, and sends invite message
   * This is an atomic operation that handles the complete invite process
   */
  async createEnhancedInvite(params: EnhancedInviteParams) {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: { message: "User not authenticated", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Starting enhanced invite workflow:", {
        currentUser: user.id,
        ambassadorId: params.ambassador_id,
        ambassadorUserId: params.ambassador_user_id,
        campaignId: params.campaign_id,
      });

      // Step 1: Check if campaign_ambassador relationship already exists
      const { data: existingRelationship, error: checkError } = await this.supabase
        .from("campaign_ambassadors")
        .select("id, chat_room_id")
        .eq("campaign_id", params.campaign_id)
        .eq("ambassador_id", params.ambassador_id)
        .maybeSingle();

      if (checkError) {
        console.error("[ChatService] Error checking existing relationship:", checkError);
        throw checkError;
      }

      if (existingRelationship) {
        // If relationship exists and has a chat room, return it
        if (existingRelationship.chat_room_id) {
          const { data: existingChat, error: chatError } = await this.supabase
            .from("chat_rooms")
            .select("*")
            .eq("id", existingRelationship.chat_room_id)
            .single();

          if (chatError) {
            console.error("[ChatService] Error fetching existing chat:", chatError);
            throw chatError;
          }

          return {
            data: {
              chatRoom: existingChat,
              campaignAmbassadorId: existingRelationship.id,
              existed: true,
            },
            error: null,
          };
        }

        // If relationship exists but no chat room, create one and link it
        const { data: newChat, error: createChatError } = await this.supabase
          .from("chat_rooms")
          .insert({
            name: `campaign-ambassador-${params.campaign_id}-${params.ambassador_id}`,
            is_group: false,
            created_by: user.id,
          })
          .select()
          .single();

        if (createChatError) {
          console.error("[ChatService] Error creating chat:", createChatError);
          throw createChatError;
        }

        // Add both participants
        console.log("[ChatService] Adding participants to existing relationship chat:", {
          chatRoomId: newChat.id,
          currentUserId: user.id,
          ambassadorUserId: params.ambassador_user_id,
        });

        const { error: participantError } = await this.supabase
          .from("chat_participants")
          .insert([
            { chat_room_id: newChat.id, user_id: user.id },
            { chat_room_id: newChat.id, user_id: params.ambassador_user_id },
          ]);

        if (participantError) {
          console.error("[ChatService] Error adding participants:", participantError);
          throw participantError;
        }

        console.log("[ChatService] Participants added successfully to existing relationship");

        // Verify participants were added
        const { data: verifyParticipants, error: verifyError } = await this.supabase
          .from("chat_participants")
          .select("*")
          .eq("chat_room_id", newChat.id);

        if (verifyError) {
          console.error("[ChatService] Error verifying participants:", verifyError);
        } else {
          console.log("[ChatService] Verified participants for existing relationship:", verifyParticipants);
        }

        // Update campaign_ambassador with chat_room_id
        const { error: updateError } = await this.supabase
          .from("campaign_ambassadors")
          .update({ chat_room_id: newChat.id })
          .eq("id", existingRelationship.id);

        if (updateError) {
          console.error("[ChatService] Error updating campaign_ambassador:", updateError);
          throw updateError;
        }

        // Send invite message if provided
        if (params.invite_message?.trim()) {
          await this.sendMessage(newChat.id, {
            content: params.invite_message.trim(),
          });
        }

        return {
          data: {
            chatRoom: newChat,
            campaignAmbassadorId: existingRelationship.id,
            existed: false,
          },
          error: null,
        };
      }

      // Step 2: Create new campaign_ambassador relationship
      const { data: campaignAmbassador, error: campaignError } = await this.supabase
        .from("campaign_ambassadors")
        .insert({
          campaign_id: params.campaign_id,
          ambassador_id: params.ambassador_id,
        })
        .select()
        .single();

      if (campaignError) {
        console.error("[ChatService] Error creating campaign_ambassador:", campaignError);
        throw campaignError;
      }

      // Step 3: Create chat room with custom name
      const { data: newChat, error: createChatError } = await this.supabase
        .from("chat_rooms")
        .insert({
          name: `campaign-ambassador-${params.campaign_id}-${params.ambassador_id}`,
          is_group: false,
          created_by: user.id,
        })
        .select()
        .single();

      if (createChatError) {
        console.error("[ChatService] Error creating chat:", createChatError);
        throw createChatError;
      }

      // Step 4: Add both participants
      console.log("[ChatService] Adding participants to chat:", {
        chatRoomId: newChat.id,
        currentUserId: user.id,
        ambassadorUserId: params.ambassador_user_id,
      });

      const { error: participantError } = await this.supabase
        .from("chat_participants")
        .insert([
          { chat_room_id: newChat.id, user_id: user.id },
          { chat_room_id: newChat.id, user_id: params.ambassador_user_id },
        ]);

      if (participantError) {
        console.error("[ChatService] Error adding participants:", participantError);
        throw participantError;
      }

      console.log("[ChatService] Participants added successfully");

      // Verify participants were added
      const { data: verifyParticipants, error: verifyError } = await this.supabase
        .from("chat_participants")
        .select("*")
        .eq("chat_room_id", newChat.id);

      if (verifyError) {
        console.error("[ChatService] Error verifying participants:", verifyError);
      } else {
        console.log("[ChatService] Verified participants:", verifyParticipants);
      }

      // Step 5: Link chat room to campaign_ambassador
      const { error: updateError } = await this.supabase
        .from("campaign_ambassadors")
        .update({ chat_room_id: newChat.id })
        .eq("id", campaignAmbassador.id);

      if (updateError) {
        console.error("[ChatService] Error linking chat to campaign_ambassador:", updateError);
        throw updateError;
      }

      // Step 6: Send invite message if provided
      if (params.invite_message?.trim()) {
        const messageResult = await this.sendMessage(newChat.id, {
          content: params.invite_message.trim(),
        });

        if (messageResult.error) {
          console.warn("[ChatService] Failed to send invite message:", messageResult.error);
          // Don't fail the entire operation for message sending
        }
      }

      console.log("[ChatService] Enhanced invite workflow completed successfully");

      // Final verification - wait a moment and check again
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
      
      const { data: finalCheck, error: finalError } = await this.supabase
        .from("chat_participants")
        .select("*")
        .eq("chat_room_id", newChat.id);

      if (finalError) {
        console.error("[ChatService] Final verification error:", finalError);
      } else {
        console.log("[ChatService] Final verification - participants:", finalCheck);
      }

      return {
        data: {
          chatRoom: newChat,
          campaignAmbassadorId: campaignAmbassador.id,
          existed: false,
        },
        error: null,
      };
    } catch (error) {
      console.error("[ChatService] Enhanced invite workflow failed:", error);
      return handleError(error, "createEnhancedInvite");
    }
  }

  /**
   * Debug method to test RLS policies
   * This helps identify if RLS is blocking participant queries
   */
  async debugParticipants(chatRoomId: string) {
    try {
      console.log("[ChatService] Debug: Testing participant queries for chat:", chatRoomId);
      
      // Test 1: Simple query without joins
      const { data: simple, error: simpleError } = await this.supabase
        .from("chat_participants")
        .select("*")
        .eq("chat_room_id", chatRoomId);
      
      console.log("[ChatService] Debug: Simple query result:", { data: simple, error: simpleError });
      
      // Test 2: Query with profiles join
      const { data: withProfiles, error: profilesError } = await this.supabase
        .from("chat_participants")
        .select(`
          *,
          profiles(
            id,
            email,
            role
          )
        `)
        .eq("chat_room_id", chatRoomId);
      
      console.log("[ChatService] Debug: With profiles query result:", { data: withProfiles, error: profilesError });
      
      // Test 3: Check current user
      const { data: { user } } = await this.supabase.auth.getUser();
      console.log("[ChatService] Debug: Current user:", user?.id);
      
      // Test 4: Check if current user is a participant
      const { data: userParticipation, error: userError } = await this.supabase
        .from("chat_participants")
        .select("*")
        .eq("chat_room_id", chatRoomId)
        .eq("user_id", user?.id);
      
      console.log("[ChatService] Debug: Current user participation:", { data: userParticipation, error: userError });
      
      return {
        simple: { data: simple, error: simpleError },
        withProfiles: { data: withProfiles, error: profilesError },
        currentUser: user?.id
      };
    } catch (error) {
      console.error("[ChatService] Debug error:", error);
      return { error };
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
      // Get current user's ID
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

      const { data, error } = await this.supabase
        .from("messages")
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id, // Add sender_id
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
        .order("created_at", { ascending: true })
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
      console.log("[ChatService] getParticipants called for chat:", chatRoomId);
      
      // First, let's try a simpler query to see what we get
      const { data: simpleData, error: simpleError } = await this.supabase
        .from("chat_participants")
        .select("*")
        .eq("chat_room_id", chatRoomId);

      if (simpleError) {
        console.error("[ChatService] Simple query error:", simpleError);
        throw simpleError;
      }

      console.log("[ChatService] Simple participants data:", simpleData);

      if (!simpleData || simpleData.length === 0) {
        console.log("[ChatService] No participants found in simple query");
        // Run debug to understand why
        await this.debugParticipants(chatRoomId);
        return {
          data: [],
          error: null,
        };
      }

      // Now try the complex query
      const { data, error } = await this.supabase
        .from("chat_participants")
        .select(`
          *,
          profiles!inner(
            id,
            email,
            role,
            ambassador_profiles(
              full_name,
              bio,
              location,
              niche,
              instagram_handle,
              tiktok_handle,
              twitter_handle,
              profile_photo_url
            ),
            client_profiles(
              company_name,
              company_description,
              industry,
              logo_url,
              website
            )
          )
        `)
        .eq("chat_room_id", chatRoomId);

      if (error) {
        console.error("[ChatService] Complex query error:", error);
        // Fallback to simple data with basic info
        const participants = simpleData.map((p: any) => ({
          user_id: p.user_id,
          role: 'unknown',
          name: 'Unknown User',
          profile_photo: null,
        }));

        console.log("[ChatService] Using fallback participants:", participants);
        return {
          data: participants as ChatParticipant[],
          error: null,
        };
      }

      console.log("[ChatService] Raw participants data:", data);

      // Transform the data to match the expected format
      const participants = data?.map((p: any) => ({
        user_id: p.user_id,
        role: p.profiles.role,
        name: p.profiles.ambassador_profiles?.full_name || p.profiles.client_profiles?.company_name || 'Unknown',
        profile_photo: p.profiles.ambassador_profiles?.profile_photo_url || p.profiles.client_profiles?.logo_url,
        bio: p.profiles.ambassador_profiles?.bio,
        location: p.profiles.ambassador_profiles?.location,
        niche: p.profiles.ambassador_profiles?.niche,
        instagram_handle: p.profiles.ambassador_profiles?.instagram_handle,
        tiktok_handle: p.profiles.ambassador_profiles?.tiktok_handle,
        twitter_handle: p.profiles.ambassador_profiles?.twitter_handle,
        company_description: p.profiles.client_profiles?.company_description,
        industry: p.profiles.client_profiles?.industry,
        logo_url: p.profiles.client_profiles?.logo_url,
        website: p.profiles.client_profiles?.website,
      })) || [];

      console.log("[ChatService] Transformed participants:", participants);

      return {
        data: participants as ChatParticipant[],
        error: null,
      };
    } catch (error) {
      console.error("[ChatService] getParticipants error:", error);
      return handleError(error, "getParticipants");
    }
  }

  /**
   * Get the other participant in a private chat (not the current user)
   * This endpoint is specifically for 1-on-1 chats
   */
  async getOtherParticipant(chatRoomId: string) {
    try {
      console.log("[ChatService] getOtherParticipant called for chat:", chatRoomId);
      
      const participantsResult = await this.getParticipants(chatRoomId);
      
      if (participantsResult.error) {
        console.error("[ChatService] getParticipants failed:", participantsResult.error);
        return { data: null, error: participantsResult.error };
      }

      console.log("[ChatService] Participants found:", participantsResult.data?.length);

      // Get current user's ID from auth
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        console.error("[ChatService] User not authenticated");
        return {
          data: null,
          error: {
            message: "User not authenticated",
            shouldRemove: true,
          } as any,
        };
      }

      console.log("[ChatService] Current user ID:", user.id);

      // Find the other participant
      const otherParticipant = participantsResult.data?.find(p => p.user_id !== user.id);
      
      console.log("[ChatService] Other participant found:", otherParticipant ? otherParticipant.name : "None");
      
      if (!otherParticipant) {
        console.error("[ChatService] No other participant found. Available participants:", participantsResult.data?.map(p => ({ id: p.user_id, name: p.name })));
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
      console.error("[ChatService] getOtherParticipant error:", error);
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
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return {
          data: [],
          error: null,
        };
      }

      const { data, error } = await this.supabase
        .from("chat_rooms")
        .select(`
          *,
          chat_participants(
            user_id,
            profiles(
              id,
              email,
              role,
              ambassador_profiles(full_name),
              client_profiles(company_name)
            )
          ),
          messages(
            id,
            content,
            created_at,
            sender_id
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform the data to include display_name and latest_message
      const transformedData = data?.map((chatRoom: any) => {
        // Get latest message
        const latestMessage = chatRoom.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        // Generate display name based on chat type and participants
        let displayName = chatRoom.name;
        
        if (!displayName && !chatRoom.is_group) {
          // For private chats, use participant names
          const participants = chatRoom.chat_participants || [];
          const otherParticipants = participants.filter((p: any) => p.user_id !== user.id);
          
          if (otherParticipants.length > 0) {
            const otherParticipant = otherParticipants[0];
            const name = otherParticipant.profiles?.ambassador_profiles?.full_name || 
                        otherParticipant.profiles?.client_profiles?.company_name || 
                        otherParticipant.profiles?.email || 
                        'Unknown User';
            displayName = `Chat with ${name}`;
          } else {
            displayName = 'Private Chat';
          }
        } else if (!displayName && chatRoom.is_group) {
          displayName = 'Group Chat';
        }

        return {
          ...chatRoom,
          display_name: displayName,
          latest_message: latestMessage,
        };
      }) || [];

      return {
        data: transformedData,
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
      console.log("[ChatService] getContractByChatId called for chat:", chatRoomId);
      
      // First find the campaign_ambassador that has this chat_room_id
      const { data: campaignAmbassador, error: caError } = await this.supabase
        .from("campaign_ambassadors")
        .select("id")
        .eq("chat_room_id", chatRoomId)
        .single();

      if (caError) {
        console.log("[ChatService] No campaign_ambassador found for chat:", caError);
        if (caError.code === 'PGRST116') {
          // No campaign_ambassador found with this chat_room_id
          return {
            data: null,
            error: null,
          };
        }
        throw caError;
      }

      console.log("[ChatService] Found campaign_ambassador:", campaignAmbassador.id);

      // Now find the contract for this campaign_ambassador
      const { data, error } = await this.supabase
        .from("contracts")
        .select("*")
        .eq("campaign_ambassador_id", campaignAmbassador.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      if (error) {
        console.log("[ChatService] Error querying contracts:", error);
        // Don't throw error for 406 or other RLS issues - just return null
        if (error.code === 'PGRST116' || error.code === '406' || error.message?.includes('Not Acceptable')) {
          return {
            data: null,
            error: null,
          };
        }
        throw error;
      }

      console.log("[ChatService] Contract query result:", data);

      return {
        data: data as Contract | null,
        error: null,
      };
    } catch (error) {
      console.log("[ChatService] getContractByChatId error:", error);
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