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
  // Profile IDs for contract creation
  ambassador_profile_id?: string | null;
  client_profile_id?: string | null;
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
   * Simplified invite workflow: Just logs the IDs for debugging
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

      // Fetch the ambassador's user_id from ambassador_profiles
      const { data: ambassadorProfile, error: profileError } = await this.supabase
        .from("ambassador_profiles")
        .select("user_id")
        .eq("id", params.ambassador_id)
        .single();

      if (profileError) {
        console.log("[ChatService] Error fetching ambassador profile:", profileError);
        return {
          data: null,
          error: { message: "Failed to fetch ambassador profile", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] SIMPLIFIED INVITE - IDs:", {
        ambassador_id: params.ambassador_id,
        ambassador_user_id: ambassadorProfile?.user_id,
        campaign_id: params.campaign_id,
        client_id: user.id,
      });

      // Create a chat room
      const chatRoomId = crypto.randomUUID();
      const { data: chatRoom, error: chatError } = await this.supabase
        .from("chat_rooms")
        .insert({
          id: chatRoomId,
          name: `campaign-ambassador-${params.campaign_id}-${params.ambassador_id}`,
          created_by: user.id,
        })
        .select()
        .single();

      if (chatError) {
        console.log("[ChatService] Error creating chat room:", chatError);
        return {
          data: null,
          error: { message: "Failed to create chat room", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Chat room created successfully:", {
        chat_room_id: chatRoom.id,
        chat_room_name: chatRoom.name,
      });

      // Add the creator (client) to chat participants
      const { data: participant, error: participantError } = await this.supabase
        .from("chat_participants")
        .insert({
          chat_room_id: chatRoom.id,
          user_id: user.id,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (participantError) {
        console.log("[ChatService] Error adding client to chat participants:", participantError);
        return {
          data: null,
          error: { message: "Failed to add client to chat participants", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Client added to chat participants:", {
        participant_id: participant.id,
        user_id: participant.user_id,
        chat_room_id: participant.chat_room_id,
      });

      // Add the ambassador to chat participants
      const { data: ambassadorParticipant, error: ambassadorError } = await this.supabase
        .from("chat_participants")
        .insert({
          chat_room_id: chatRoom.id,
          user_id: ambassadorProfile.user_id,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (ambassadorError) {
        console.log("[ChatService] Error adding ambassador to chat participants:", ambassadorError);
        return {
          data: null,
          error: { message: "Failed to add ambassador to chat participants", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Ambassador added to chat participants:", {
        participant_id: ambassadorParticipant.id,
        user_id: ambassadorParticipant.user_id,
        chat_room_id: ambassadorParticipant.chat_room_id,
      });

      // Send initial welcome message using the invite message from the modal
      const welcomeMessage = params.invite_message?.trim() || "Welcome! This chat was created for campaign collaboration.";
      const { data: initialMessage, error: messageError } = await this.supabase
        .from("messages")
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: user.id,
          content: welcomeMessage,
          message_type: "text",
        })
        .select()
        .single();

      if (messageError) {
        console.log("[ChatService] Error sending initial message:", messageError);
        return {
          data: null,
          error: { message: "Failed to send initial message", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Initial message sent:", {
        message_id: initialMessage.id,
        content: initialMessage.content,
        sender_id: initialMessage.sender_id,
        chat_room_id: initialMessage.chat_room_id,
      });

      // Create campaign_ambassador relationship
      const { data: campaignAmbassador, error: campaignAmbassadorError } = await this.supabase
        .from("campaign_ambassadors")
        .insert({
          campaign_id: params.campaign_id,
          ambassador_id: params.ambassador_id,
          chat_room_id: chatRoom.id,
          status: "proposal_received",
        })
        .select()
        .single();

      if (campaignAmbassadorError) {
        console.log("[ChatService] Error creating campaign_ambassador relationship:", campaignAmbassadorError);
        return {
          data: null,
          error: { message: "Failed to create campaign_ambassador relationship", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Campaign_ambassador relationship created:", {
        relationship_id: campaignAmbassador.id,
        campaign_id: campaignAmbassador.campaign_id,
        ambassador_id: campaignAmbassador.ambassador_id,
        chat_room_id: campaignAmbassador.chat_room_id,
        status: campaignAmbassador.status,
      });

      // Return success without doing anything else
      return {
        data: {
          success: true,
          message: "Chat room created, participants added, initial message sent, and campaign_ambassador relationship created successfully",
          chatRoom: chatRoom,
          clientParticipant: participant,
          ambassadorParticipant: ambassadorParticipant,
          initialMessage: initialMessage,
          campaignAmbassador: campaignAmbassador,
        },
        error: null,
      };
    } catch (error) {
      console.error("[ChatService] Simplified invite failed:", error);
      return handleError(error, "createEnhancedInvite");
    }
  }

  /**
   * Delete chat room and all related data (cascade delete)
   * This will delete: chat room, chat participants, messages, and campaign_ambassador relationship
   */
  async deleteChatRoom(chatRoomId: string) {
    try {
      // Get current user for verification
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return {
          data: null,
          error: { message: "User not authenticated", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Starting cascade delete for chat room:", chatRoomId);

      // 1. First, get the campaign_ambassador_id to delete related contracts
      const { data: campaignAmbassador, error: fetchError } = await this.supabase
        .from("campaign_ambassadors")
        .select("id")
        .eq("chat_room_id", chatRoomId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.log("[ChatService] Error fetching campaign_ambassador:", fetchError);
        return {
          data: null,
          error: { message: "Failed to fetch campaign_ambassador relationship", shouldRemove: true } as any,
        };
      }

      // 2. Delete contracts that reference this campaign_ambassador
      if (campaignAmbassador) {
        console.log("[ChatService] Deleting contracts for campaign_ambassador_id:", campaignAmbassador.id);
        
        // First, let's see what contracts exist
        const { data: existingContracts, error: fetchContractsError } = await this.supabase
          .from("contracts")
          .select("id")
          .eq("campaign_ambassador_id", campaignAmbassador.id);

        if (fetchContractsError) {
          console.log("[ChatService] Error fetching contracts:", fetchContractsError);
        } else {
          console.log("[ChatService] Found contracts to delete:", existingContracts?.length || 0);
        }

        const { error: contractsError } = await this.supabase
          .from("contracts")
          .delete()
          .eq("campaign_ambassador_id", campaignAmbassador.id);

        if (contractsError) {
          console.log("[ChatService] Error deleting contracts:", contractsError);
          return {
            data: null,
            error: { message: "Failed to delete contracts", shouldRemove: true } as any,
          };
        }

        console.log("[ChatService] Contracts deleted successfully");
      } else {
        console.log("[ChatService] No campaign_ambassador found, skipping contract deletion");
      }

      // 3. Now delete campaign_ambassador relationship
      const { error: campaignAmbassadorError } = await this.supabase
        .from("campaign_ambassadors")
        .delete()
        .eq("chat_room_id", chatRoomId);

      if (campaignAmbassadorError) {
        console.log("[ChatService] Error deleting campaign_ambassador:", campaignAmbassadorError);
        return {
          data: null,
          error: { message: "Failed to delete campaign_ambassador relationship", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Campaign_ambassador relationship deleted");

      // 4. Delete all messages in the chat room
      const { error: messagesError } = await this.supabase
        .from("messages")
        .delete()
        .eq("chat_room_id", chatRoomId);

      if (messagesError) {
        console.log("[ChatService] Error deleting messages:", messagesError);
        return {
          data: null,
          error: { message: "Failed to delete messages", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Messages deleted");

      // 5. Delete all chat participants
      const { error: participantsError } = await this.supabase
        .from("chat_participants")
        .delete()
        .eq("chat_room_id", chatRoomId);

      if (participantsError) {
        console.log("[ChatService] Error deleting chat participants:", participantsError);
        return {
          data: null,
          error: { message: "Failed to delete chat participants", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Chat participants deleted");

      // 6. Finally, delete the chat room itself
      const { error: chatRoomError } = await this.supabase
        .from("chat_rooms")
        .delete()
        .eq("id", chatRoomId);

      if (chatRoomError) {
        console.log("[ChatService] Error deleting chat room:", chatRoomError);
        return {
          data: null,
          error: { message: "Failed to delete chat room", shouldRemove: true } as any,
        };
      }

      console.log("[ChatService] Chat room deleted successfully");

      return {
        data: {
          success: true,
          message: "Chat room and all related data deleted successfully",
        },
        error: null,
      };
    } catch (error) {
      console.error("[ChatService] Delete chat room failed:", error);
      return handleError(error, "deleteChatRoom");
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
        .eq("user_id", user?.id || "");
      
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
          profiles(
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
          role: 'client' as const,
          name: 'Unknown User',
          profile_photo: null,
        }));

        console.log("[ChatService] Using fallback participants:", participants);
        return {
          data: participants as ChatParticipant[],
          error: null,
        };
      }

      // If no data returned from complex query, use simple data with enhanced lookup
      if (!data || data.length === 0) {
        console.log("[ChatService] Complex query returned no data, using enhanced fallback");
        
        const participants: ChatParticipant[] = [];
        
        for (const participant of simpleData) {
          try {
            // Try to get basic profile info for each participant
            const { data: profile } = await this.supabase
              .from("profiles")
              .select("id, email, role")
              .eq("id", participant.user_id)
              .single();

            if (profile) {
              // Try to get role-specific profile data for better names
              let displayName = profile.email || 'Unknown User';
              
              if (profile.role === 'ambassador') {
                const { data: ambassadorProfile } = await this.supabase
                  .from('ambassador_profiles')
                  .select('full_name')
                  .eq('user_id', participant.user_id)
                  .single();
                
                if (ambassadorProfile?.full_name) {
                  displayName = ambassadorProfile.full_name;
                }
              } else if (profile.role === 'client') {
                const { data: clientProfile } = await this.supabase
                  .from('client_profiles')
                  .select('company_name')
                  .eq('user_id', participant.user_id)
                  .single();
                
                if (clientProfile?.company_name) {
                  displayName = clientProfile.company_name;
                }
              }

              participants.push({
                user_id: participant.user_id,
                role: profile.role,
                name: displayName,
                profile_photo: null,
              });
            } else {
              participants.push({
                user_id: participant.user_id,
                role: 'client' as const,
                name: 'Unknown User',
                profile_photo: null,
              });
            }
          } catch (error) {
            console.warn("[ChatService] Could not get profile for participant:", participant.user_id);
            participants.push({
              user_id: participant.user_id,
              role: 'client' as const,
              name: 'Unknown User',
              profile_photo: null,
            });
          }
        }

        console.log("[ChatService] Using enhanced fallback participants:", participants);
        return {
          data: participants,
          error: null,
        };
      }

      console.log("[ChatService] Raw participants data:", data);
      console.log("[ChatService] Raw participants data details:", data?.map(p => ({ 
        user_id: p.user_id, 
        profiles: p.profiles ? 'has profile' : 'null profile',
        profile_role: p.profiles?.role,
        ambassador_name: p.profiles?.ambassador_profiles?.full_name,
        client_name: p.profiles?.client_profiles?.company_name
      })));

      // Transform the data to match the expected format
      const participants = [];
      
      for (const p of data || []) {
        let displayName = 'Unknown';
        let role = 'client';
        let profilePhoto = null;
        let bio = null;
        let location = null;
        let niche = null;
        let instagramHandle = null;
        let tiktokHandle = null;
        let twitterHandle = null;
        let companyDescription = null;
        let industry = null;
        let logoUrl = null;
        let website = null;
        let ambassadorProfileId = null;
        let clientProfileId = null;
        
        if (p.profiles) {
          // Profile data is available from the main query
          displayName = p.profiles.ambassador_profiles?.full_name || 
                       p.profiles.client_profiles?.company_name || 
                       'Unknown';
          role = p.profiles.role || 'client';
          profilePhoto = p.profiles.ambassador_profiles?.profile_photo_url || p.profiles.client_profiles?.logo_url;
          bio = p.profiles.ambassador_profiles?.bio;
          location = p.profiles.ambassador_profiles?.location;
          niche = p.profiles.ambassador_profiles?.niche;
          instagramHandle = p.profiles.ambassador_profiles?.instagram_handle;
          tiktokHandle = p.profiles.ambassador_profiles?.tiktok_handle;
          twitterHandle = p.profiles.ambassador_profiles?.twitter_handle;
          companyDescription = p.profiles.client_profiles?.company_description;
          industry = p.profiles.client_profiles?.industry;
          logoUrl = p.profiles.client_profiles?.logo_url;
          website = p.profiles.client_profiles?.website;
          ambassadorProfileId = p.profiles.ambassador_profiles?.id;
          clientProfileId = p.profiles.client_profiles?.id;
        } else {
          // Profile data is blocked by RLS - try to get it directly from ambassador/client tables
          try {
            // Try ambassador profile first
            const { data: ambassadorData } = await this.supabase
              .from("ambassador_profiles")
              .select("*")
              .eq("user_id", p.user_id)
              .single();

            if (ambassadorData) {
              displayName = ambassadorData.full_name || `User ${p.user_id.slice(0, 8)}`;
              role = 'ambassador';
              profilePhoto = ambassadorData.profile_photo_url;
              bio = ambassadorData.bio;
              location = ambassadorData.location;
              niche = ambassadorData.niche;
              instagramHandle = ambassadorData.instagram_handle;
              tiktokHandle = ambassadorData.tiktok_handle;
              twitterHandle = ambassadorData.twitter_handle;
              ambassadorProfileId = ambassadorData.id;
            } else {
              // Try client profile
              const { data: clientData } = await this.supabase
                .from("client_profiles")
                .select("*")
                .eq("user_id", p.user_id)
                .single();

              if (clientData) {
                displayName = clientData.company_name || `User ${p.user_id.slice(0, 8)}`;
                role = 'client';
                profilePhoto = clientData.logo_url;
                companyDescription = clientData.company_description;
                industry = clientData.industry;
                logoUrl = clientData.logo_url;
                website = clientData.website;
                clientProfileId = clientData.id;
              } else {
                displayName = `User ${p.user_id.slice(0, 8)}`;
                role = 'client';
              }
            }
          } catch (error) {
            console.log(`[ChatService] Could not fetch profile for ${p.user_id}:`, error);
            displayName = `User ${p.user_id.slice(0, 8)}`;
            role = 'client';
          }
        }

        participants.push({
          user_id: p.user_id,
          role: role,
          name: displayName,
          profile_photo: profilePhoto,
          bio: bio,
          location: location,
          niche: niche,
          instagram_handle: instagramHandle,
          tiktok_handle: tiktokHandle,
          twitter_handle: twitterHandle,
          company_description: companyDescription,
          industry: industry,
          logo_url: logoUrl,
          website: website,
          ambassador_profile_id: ambassadorProfileId,
          client_profile_id: clientProfileId,
        });
      }

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

      // If no participants found, return null
      if (!participantsResult.data || participantsResult.data.length === 0) {
        console.log("[ChatService] No participants found");
        return {
          data: null,
          error: null,
        };
      }

      // Find the other participant
      const otherParticipant = participantsResult.data?.find(p => p.user_id !== user.id);
      
      console.log("[ChatService] Other participant found:", otherParticipant ? otherParticipant.name : "None");
      
      if (!otherParticipant) {
        console.log("[ChatService] No other participant found. Available participants:", participantsResult.data?.map(p => ({ id: p.user_id, name: p.name })));
        return {
          data: null,
          error: null,
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
      // First, check if there are any campaign_ambassador references
      const { data: campaignAmbassadors, error: caError } = await this.supabase
        .from("campaign_ambassadors")
        .select("id")
        .eq("chat_room_id", chatRoomId);

      if (caError) {
        console.log("[ChatService] Error checking campaign_ambassadors:", caError);
        throw caError;
      }

      // If there are campaign_ambassador references, delete them first
      if (campaignAmbassadors && campaignAmbassadors.length > 0) {
        console.log("[ChatService] Deleting campaign_ambassador records before chat deletion");
        const { error: deleteCAError } = await this.supabase
          .from("campaign_ambassadors")
          .delete()
          .eq("chat_room_id", chatRoomId);

        if (deleteCAError) {
          console.log("[ChatService] Error deleting campaign_ambassadors:", deleteCAError);
          throw deleteCAError;
        }
      }

      // Delete chat participants first
      const { error: participantsError } = await this.supabase
        .from("chat_participants")
        .delete()
        .eq("chat_room_id", chatRoomId);

      if (participantsError) {
        console.log("[ChatService] Error deleting participants:", participantsError);
        throw participantsError;
      }

      // Delete messages
      const { error: messagesError } = await this.supabase
        .from("messages")
        .delete()
        .eq("chat_room_id", chatRoomId);

      if (messagesError) {
        console.log("[ChatService] Error deleting messages:", messagesError);
        throw messagesError;
      }

      // Finally, delete the chat room
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

      // First, get all chat_room_ids where the current user is a participant
      const { data: userChatIds, error: participantError } = await this.supabase
        .from("chat_participants")
        .select("chat_room_id")
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      if (!userChatIds || userChatIds.length === 0) {
        return {
          data: [],
          error: null,
        };
      }

      // Extract the chat room IDs
      const chatRoomIds = userChatIds.map(p => p.chat_room_id);

      // Now get only the chat rooms where the user is a participant
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
        .in("id", chatRoomIds)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform the data to include display_name and latest_message
      const transformedData = [];
      
      for (const chatRoom of data || []) {
        // Get latest message
        const latestMessage = chatRoom.messages?.sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        // Generate display name based on chat type and participants
        let displayName = null; // Don't use chatRoom.name, always generate our own
        
        if (!chatRoom.is_group) {
          // For private chats, use participant names - same logic as center interface
          const participants = chatRoom.chat_participants || [];
          const otherParticipants = participants.filter((p: any) => p.user_id !== user.id);
          
          if (otherParticipants.length > 0) {
            const otherParticipant = otherParticipants[0];
            let name = 'Unknown User';
            
            // Try to get name from profiles if available
            if (otherParticipant.profiles) {
              name = otherParticipant.profiles.ambassador_profiles?.full_name || 
                     otherParticipant.profiles.client_profiles?.company_name || 
                     otherParticipant.profiles.email || 
                     'Unknown User';
            } else {
              // Profile data blocked by RLS - try direct queries
              try {
                // Try ambassador profile first
                const { data: ambassadorData } = await this.supabase
                  .from("ambassador_profiles")
                  .select("full_name")
                  .eq("user_id", otherParticipant.user_id)
                  .single();

                if (ambassadorData?.full_name) {
                  name = ambassadorData.full_name;
                } else {
                  // Try client profile
                  const { data: clientData } = await this.supabase
                    .from("client_profiles")
                    .select("company_name")
                    .eq("user_id", otherParticipant.user_id)
                    .single();

                  if (clientData?.company_name) {
                    name = clientData.company_name;
                  } else {
                    name = `User ${otherParticipant.user_id.slice(0, 8)}`;
                  }
                }
              } catch (error) {
                console.log(`[ChatService] Could not fetch name for ${otherParticipant.user_id}:`, error);
                name = `User ${otherParticipant.user_id.slice(0, 8)}`;
              }
            }
            
            // Use the same format as center interface
            displayName = `Chat with ${name}`;
          } else {
            displayName = 'Private Chat';
          }
        } else if (chatRoom.is_group) {
          displayName = chatRoom.name || 'Group Chat';
        }

        transformedData.push({
          ...chatRoom,
          display_name: displayName,
          latest_message: latestMessage,
        });
      }

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