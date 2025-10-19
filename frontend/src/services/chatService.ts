import { supabase } from '@/lib/supabase';

export interface ChatParticipant {
  id: string;
  name: string;
  profilePhoto?: string;
  role: 'client' | 'ambassador';
}

export interface CreateChatParams {
  participantId: string;
  participantName: string;
  participantRole: 'client' | 'ambassador';
  subject?: string;
}

export interface CreateGroupChatParams {
  name: string;
  participantIds: string[];
}

export interface AmbassadorParticipant {
  userId: string;
  role: 'ambassador';
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  niche?: string[] | null;
  profilePhoto?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  twitterHandle?: string | null;
}

export interface ClientParticipant {
  userId: string;
  role: 'client';
  id: string;
  name: string;
  description?: string | null;
  industry?: string | null;
  logo?: string | null;
  website?: string | null;
}

export type OtherParticipant = AmbassadorParticipant | ClientParticipant;

export const chatService = {
  /**
   * Creates a private chat between two users or returns existing chat
   * Uses database function to ensure no duplicates
   */
  async createChat(params: CreateChatParams) {
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      console.log('🔄 Creating or finding private chat between:', user.id, 'and', params.participantId);
      console.log('👤 Participant name:', params.participantName);
      
      // Create a neutral chat name using sorted user IDs for consistency
      const sortedIds = [user.id, params.participantId].sort();
      const neutralChatName = `chat_${sortedIds[0]}_${sortedIds[1]}`;
      
      console.log('🏷️ Using neutral chat name:', neutralChatName);
      
      // Use the new RPC function to create or find private chat
      // NOTE: You need to run the SQL in create_private_chat.sql in your Supabase SQL editor first!
      const { data: chatResult, error: rpcError } = await supabase
        .rpc('create_private_chat_between_users' as any, {
          participant1_id: user.id,
          participant2_id: params.participantId,
          chat_name: neutralChatName
        });

      if (rpcError) {
        console.error('❌ Error creating chat via RPC:', rpcError);
        
        // Fallback to old method if RPC fails
        console.log('⚠️ Falling back to old chat creation method...');
        return this.createChatFallback(params);
      }

      if (!chatResult) {
        console.error('❌ No result from chat creation RPC');
        return { data: null, error: new Error('Failed to create or find chat') };
      }

      console.log('✅ Chat result:', chatResult);
      
      // Parse the result (it comes as JSON from the database)
      const chat = typeof chatResult === 'string' ? JSON.parse(chatResult) : chatResult;
      
      if (chat.existed) {
        console.log('🎉 *** FOUND EXISTING PRIVATE CHAT *** 🎉:', chat.id);
      } else {
        console.log('✅ *** CREATED NEW PRIVATE CHAT *** ✅:', chat.id);
      }

      return { data: chat, error: null };

    } catch (error) {
      console.error('Unexpected error creating chat:', error);
      return { data: null, error };
    }
  },

  // Fallback method for when RPC function is not available
  async createChatFallback(params: CreateChatParams) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      console.log('🔄 FALLBACK: Creating chat room manually...');

      // Create a neutral chat name using sorted user IDs for consistency
      const sortedIds = [user.id, params.participantId].sort();
      const neutralChatName = `chat_${sortedIds[0]}_${sortedIds[1]}`;
      
      console.log('🏷️ FALLBACK: Using neutral chat name:', neutralChatName);

      // Create a new private chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: neutralChatName,
          is_group: false,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat room:', chatError);
        return { data: null, error: chatError };
      }

      // Add both current user and the other participant as participants
      const participantRecords = [
        { chat_room_id: chatRoom.id, user_id: user.id },
        { chat_room_id: chatRoom.id, user_id: params.participantId },
      ];
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantRecords);

      if (participantsError) {
        console.error('❌ Could not add both participants:', participantsError);
        await supabase.from('chat_rooms').delete().eq('id', chatRoom.id);
        return { data: null, error: participantsError };
      }

      console.log('✅ FALLBACK: Chat room and participants created successfully:', chatRoom.id);
      return { data: chatRoom, error: null };

    } catch (error) {
      console.error('Unexpected error in fallback method:', error);
      return { data: null, error };
    }
  },

  /**
   * Creates a group chat with multiple participants
   */
  async createGroupChat(params: CreateGroupChatParams) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      if (!params.participantIds || params.participantIds.length < 2) {
        return { data: null, error: new Error('Group chat requires at least 2 other participants') };
      }

      // Create group chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: params.name,
          is_group: true,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating group chat room:', chatError);
        return { data: null, error: chatError };
      }

      // Add creator + all participants
      const participantRecords = [
        { chat_room_id: chatRoom.id, user_id: user.id },
        ...params.participantIds.map(id => ({
          chat_room_id: chatRoom.id,
          user_id: id
        }))
      ];

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantRecords);

      if (participantError) {
        console.error('Error adding participants to group chat:', participantError);
        // Clean up
        await supabase.from('chat_rooms').delete().eq('id', chatRoom.id);
        return { data: null, error: participantError };
      }

      console.log('Created new group chat:', chatRoom.id);
      return { data: chatRoom, error: null };

    } catch (error) {
      console.error('Unexpected error creating group chat:', error);
      return { data: null, error };
    }
  },

  /**
   * Checks if a private chat exists between two users
   * Uses database function for accurate detection
   */
  async checkExistingChat(userId1: string, userId2: string) {
    try {
      // Use database function to find existing private chat
      const { data: chatRoomId, error: rpcError } = await supabase
        .rpc('find_private_chat_between_users', {
          user1_id: userId1,
          user2_id: userId2
        });

      if (rpcError) {
        console.error('Error calling find_private_chat_between_users:', rpcError);
        return { data: null, error: rpcError };
      }

      // If no chat found, return null
      if (!chatRoomId) {
        return { data: null, error: null };
      }

      // Fetch the chat room details
      const { data: chatRoom, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', chatRoomId)
        .single();

      if (fetchError) {
        console.error('Error fetching chat room:', fetchError);
        return { data: null, error: fetchError };
      }

      return { data: chatRoom, error: null };
    } catch (error) {
      console.error('Unexpected error checking chat:', error);
      return { data: null, error };
    }
  },

  /**
   * Add a participant to a group chat
   */
  async addParticipant(chatRoomId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('add_chat_participant', {
          p_chat_room_id: chatRoomId,
          p_user_id: userId
        });

      if (error) {
        console.error('Error adding participant:', error);
        return { data: null, error };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Unexpected error adding participant:', error);
      return { data: null, error };
    }
  },

  /**
   * Remove a participant from a group chat
   */
  async removeParticipant(chatRoomId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('remove_chat_participant', {
          p_chat_room_id: chatRoomId,
          p_user_id: userId
        });

      if (error) {
        console.error('Error removing participant:', error);
        return { data: null, error };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Unexpected error removing participant:', error);
      return { data: null, error };
    }
  },

  /**
   * Check if user is a member of a chat
   */
  async isMember(chatRoomId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('is_chat_member', {
          p_chat_room_id: chatRoomId,
          p_user_id: userId
        });

      if (error) {
        console.error('Error checking membership:', error);
        return { data: false, error };
      }

      return { data: data === true, error: null };
    } catch (error) {
      console.error('Unexpected error checking membership:', error);
      return { data: false, error };
    }
  },

  /**
   * Delete a chat room and all associated messages
   */
  async deleteChat(chatRoomId: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      // First, delete campaign_ambassadors row(s) linked to this chat_room_id
      try {
        const { campaignService } = await import("./campaignService");
        await campaignService.deleteCampaignAmbassadorByChatRoomId(chatRoomId);
      } catch (err) {
        console.error('Error deleting campaign_ambassador before chat deletion:', err);
      }

      console.log('🗑️ Deleting chat room:', chatRoomId);

      // Now use the RPC function to delete the chat room
      const { data: deleteResult, error: rpcError } = await supabase
        .rpc('delete_chat_room' as any, {
          chat_room_id: chatRoomId,
          requesting_user_id: user.id
        });

      if (rpcError) {
        console.error('❌ Error deleting chat via RPC:', rpcError);
        return { data: null, error: rpcError };
      }

      if (!deleteResult) {
        console.error('❌ No result from delete chat RPC');
        return { data: null, error: new Error('Failed to delete chat') };
      }

      // Parse the result
      const result = typeof deleteResult === 'string' ? JSON.parse(deleteResult) : deleteResult;
      
      if (!result.success) {
        console.error('❌ Delete chat failed:', result.error);
        return { data: null, error: new Error(result.error) };
      }

      console.log('✅ Chat deleted successfully:', result);
      return { data: result, error: null };

    } catch (error) {
      console.error('Unexpected error deleting chat:', error);
      return { data: null, error };
    }
  },

  /**
   * Send a message to a chat room
   */
  async sendMessage(chatRoomId: string, content: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      // Send the message
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: user.id,
          content: content.trim()
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending message:', messageError);
        return { data: null, error: messageError };
      }

      console.log('Message sent successfully:', message.id);
      return { data: message, error: null };

    } catch (error) {
      console.error('Unexpected error sending message:', error);
      return { data: null, error };
    }
  },

  /**
   * Get the other participant's information in a chat (not the current user)
   */
  async getOtherParticipant(chatRoomId: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      console.log('🔍 Getting other participant for chat:', chatRoomId);
      console.log('🔍 Current user ID:', user.id);

      // First, let's see all participants in this chat
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_room_id', chatRoomId);

      if (allParticipantsError) {
        console.error('❌ Error fetching all participants:', allParticipantsError);
        return { data: null, error: allParticipantsError };
      }

      console.log('👥 All participants in chat:', allParticipants);

      // Get participants excluding current user
      const { data: participants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('chat_room_id', chatRoomId)
        .neq('user_id', user.id); // Exclude current user

      if (participantsError) {
        console.error('❌ Error fetching other participants:', participantsError);
        return { data: null, error: participantsError };
      }

      console.log('👤 Other participants found:', participants);

      if (!participants || participants.length === 0) {
        console.log('ℹ️ No other participants found in chat - trying workaround for RLS issue...');
        
        // Try the workaround method
        return await this.getOtherParticipantFromChatName(chatRoomId);
      }

      // For private chats, there should be exactly one other participant
      const otherParticipant = participants[0];
      const participantUserId = otherParticipant.user_id;

      console.log('👤 Other participant user ID:', participantUserId);

      // Get the user's role from profiles table
      const { data: profileInfo, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', participantUserId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching participant profile:', profileError);
        return { data: null, error: profileError };
      }

      const participantRole = profileInfo?.role;
      // console.log('👤 Other participant role:', participantRole);

      // Fetch detailed profile information based on role
      let profileData = null;
      if (participantRole === 'ambassador') {
        const { data: ambassadorProfile, error: ambassadorError } = await supabase
          .from('ambassador_profiles')
          .select(`
            id,
            full_name,
            bio,
            location,
            niche,
            profile_photo_url,
            instagram_handle,
            tiktok_handle,
            twitter_handle
          `)
          .eq('user_id', participantUserId)
          .single();

        if (ambassadorError) {
          console.error('❌ Error fetching ambassador profile:', ambassadorError);
          return { data: null, error: ambassadorError };
        }

        // console.log('✅ Ambassador profile loaded:', ambassadorProfile);

        profileData = {
          userId: participantUserId,
          role: 'ambassador' as const,
          id: ambassadorProfile.id,
          name: ambassadorProfile.full_name,
          bio: ambassadorProfile.bio,
          location: ambassadorProfile.location,
          niche: ambassadorProfile.niche,
          profilePhoto: ambassadorProfile.profile_photo_url,
          instagramHandle: ambassadorProfile.instagram_handle,
          tiktokHandle: ambassadorProfile.tiktok_handle,
          twitterHandle: ambassadorProfile.twitter_handle,
        };
      } else if (participantRole === 'client') {
        const { data: clientProfile, error: clientError } = await supabase
          .from('client_profiles')
          .select(`
            id,
            company_name,
            company_description,
            industry,
            logo_url,
            website
          `)
          .eq('user_id', participantUserId)
          .single();

        if (clientError) {
          console.error('❌ Error fetching client profile:', clientError);
          return { data: null, error: clientError };
        }

        // console.log('✅ Client profile loaded:', clientProfile);

        profileData = {
          userId: participantUserId,
          role: 'client' as const,
          id: clientProfile.id,
          name: clientProfile.company_name,
          description: clientProfile.company_description,
          industry: clientProfile.industry,
          logo: clientProfile.logo_url,
          website: clientProfile.website,
        };
      }

      // console.log('✅ Other participant profile loaded:', profileData);
      return { data: profileData, error: null };

    } catch (error) {
      console.error('Unexpected error getting other participant:', error);
      return { data: null, error };
    }
  },

  /**
   * Get other participant by parsing neutral chat name to extract user ID
   * This replaces the old username-based parsing approach
   */
  async getOtherParticipantFromChatName(chatRoomId: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: userError || new Error('User not authenticated') };
      }

      // console.log('🔍 Finding other participant via neutral chat name for chat:', chatRoomId);

      // Get chat room info
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .select('name')
        .eq('id', chatRoomId)
        .single();

      if (chatError || !chatRoom) {
        console.error('❌ Error fetching chat room:', chatError);
        return { data: null, error: chatError };
      }

      // console.log('🔍 Chat room name:', chatRoom.name);

      // Parse the chat name to extract the other user ID
      const chatName = chatRoom.name || '';
      // console.log('🔍 Attempting to parse chat name:', chatName);
      
      let otherUserId = null;
      
      // Try neutral format first: "chat_user1_user2"
      const neutralMatch = chatName.match(/^chat_([a-f0-9-]+)_([a-f0-9-]+)$/);
      if (neutralMatch) {
        const [, userId1, userId2] = neutralMatch;
        otherUserId = userId1 === user.id ? userId2 : userId1;
        // console.log('🎯 Neutral format matched - other user ID:', otherUserId);
      } else {
        // Fallback: try old "Chat with username" format
        // console.log('🔍 Trying old format fallback...');
        const oldMatch = chatName.match(/Chat with (.+)/);
        if (oldMatch) {
          const extractedUsername = oldMatch[1];
          // console.log('🔍 Old format matched - extracted username:', extractedUsername);
          
          // Search for this user in profiles to get their ID
          return await this.searchUserByName(extractedUsername);
        } else {
          // console.log('❌ Could not parse chat name in any known format:', chatName);
          return { data: null, error: new Error('Could not parse chat name') };
        }
      }
      
      if (!otherUserId) {
        // console.log('❌ Could not determine other user ID from chat name:', chatName);
        return { data: null, error: new Error('Could not determine other user ID') };
      }

      // console.log('👤 Other user ID:', otherUserId);

      // Get the user's role and profile
      return await this.getProfileByUserId(otherUserId);

    } catch (error) {
      console.error('❌ Unexpected error getting participant from chat name:', error);
      return { data: null, error };
    }
  },

  /**
   * Helper function to get profile by user ID
   */
  async getProfileByUserId(userId: string) {
    try {
      // Get the user's role from profiles table
      const { data: profileInfo, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Error fetching participant profile:', profileError);
        return { data: null, error: profileError };
      }

      const participantRole = profileInfo?.role;
      // console.log('👤 Other participant role:', participantRole);

      // Fetch detailed profile information based on role
      let profileData = null;
      if (participantRole === 'ambassador') {
        const { data: ambassadorProfile, error: ambassadorError } = await supabase
          .from('ambassador_profiles')
          .select(`
            id,
            full_name,
            bio,
            location,
            niche,
            profile_photo_url,
            instagram_handle,
            tiktok_handle,
            twitter_handle
          `)
          .eq('user_id', userId)
          .single();

        if (ambassadorError) {
          console.error('❌ Error fetching ambassador profile:', ambassadorError);
          return { data: null, error: ambassadorError };
        }

        // console.log('✅ Ambassador profile loaded:', ambassadorProfile);

        profileData = {
          userId: userId,
          role: 'ambassador' as const,
          id: ambassadorProfile.id,
          name: ambassadorProfile.full_name,
          bio: ambassadorProfile.bio,
          location: ambassadorProfile.location,
          niche: ambassadorProfile.niche,
          profilePhoto: ambassadorProfile.profile_photo_url,
          instagramHandle: ambassadorProfile.instagram_handle,
          tiktokHandle: ambassadorProfile.tiktok_handle,
          twitterHandle: ambassadorProfile.twitter_handle,
        };
      } else if (participantRole === 'client') {
        const { data: clientProfile, error: clientError } = await supabase
          .from('client_profiles')
          .select(`
            id,
            company_name,
            company_description,
            industry,
            logo_url,
            website
          `)
          .eq('user_id', userId)
          .single();

        if (clientError) {
          console.error('❌ Error fetching client profile:', clientError);
          return { data: null, error: clientError };
        }

        // console.log('✅ Client profile loaded:', clientProfile);

        profileData = {
          userId: userId,
          role: 'client' as const,
          id: clientProfile.id,
          name: clientProfile.company_name,
          description: clientProfile.company_description,
          industry: clientProfile.industry,
          logo: clientProfile.logo_url,
          website: clientProfile.website,
        };
      }

      // console.log('✅ Other participant profile loaded:', profileData);
      return { data: profileData, error: null };

    } catch (error) {
      console.error('❌ Unexpected error getting profile by user ID:', error);
      return { data: null, error };
    }
  },

  /**
   * Helper function to search for user by name (fallback for old chat names)
   */
  async searchUserByName(extractedUsername: string) {
    try {
      // Search for this user in ambassador profiles first
      console.log('🔍 Searching ambassador profiles for:', extractedUsername);
      const { data: ambassadorProfiles, error: ambassadorError } = await supabase
        .from('ambassador_profiles')
        .select(`
          user_id,
          id,
          full_name,
          bio,
          location,
          niche,
          profile_photo_url,
          instagram_handle,
          tiktok_handle,
          twitter_handle
        `)
        .or(`full_name.ilike.%${extractedUsername}%,instagram_handle.ilike.%${extractedUsername}%,tiktok_handle.ilike.%${extractedUsername}%`);

      console.log('🔍 Ambassador search results:', ambassadorProfiles, ambassadorError);

      if (ambassadorError) {
        console.error('❌ Error searching ambassador profiles:', ambassadorError);
      } else if (ambassadorProfiles && ambassadorProfiles.length > 0) {
        const profile = ambassadorProfiles[0];
        console.log('✅ Found ambassador profile:', profile);
        
        return {
          data: {
            userId: profile.user_id,
            role: 'ambassador' as const,
            id: profile.id,
            name: profile.full_name,
            bio: profile.bio,
            location: profile.location,
            niche: profile.niche,
            profilePhoto: profile.profile_photo_url,
            instagramHandle: profile.instagram_handle,
            tiktokHandle: profile.tiktok_handle,
            twitterHandle: profile.twitter_handle,
          },
          error: null
        };
      }

      // Search for this user in client profiles
      console.log('🔍 Searching client profiles for:', extractedUsername);
      const { data: clientProfiles, error: clientError } = await supabase
        .from('client_profiles')
        .select(`
          user_id,
          id,
          company_name,
          company_description,
          industry,
          logo_url,
          website
        `)
        .ilike('company_name', `%${extractedUsername}%`);

      console.log('🔍 Client search results:', clientProfiles, clientError);

      if (clientError) {
        console.error('❌ Error searching client profiles:', clientError);
        return { data: null, error: clientError };
      } else if (clientProfiles && clientProfiles.length > 0) {
        const profile = clientProfiles[0];
        console.log('✅ Found client profile:', profile);
        
        return {
          data: {
            userId: profile.user_id,
            role: 'client' as const,
            id: profile.id,
            name: profile.company_name,
            description: profile.company_description,
            industry: profile.industry,
            logo: profile.logo_url,
            website: profile.website,
          },
          error: null
        };
      }

      console.log('❌ No matching profile found for username:', extractedUsername);
      return { data: null, error: new Error('No matching profile found') };

    } catch (error) {
      console.error('❌ Unexpected error searching user by name:', error);
      return { data: null, error };
    }
  },

  /**
   * Debug function to inspect chat participants (for testing)
   */
  async debugChatParticipants(chatRoomId: string) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return;
      }

      // console.log('🐛 DEBUG: Chat Room ID:', chatRoomId);
      // console.log('🐛 DEBUG: Current User ID:', user.id);

      // Check if chat room exists
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', chatRoomId)
        .single();

      // console.log('🐛 DEBUG: Chat Room:', chatRoom);
      // if (chatRoomError) console.log('🐛 DEBUG: Chat Room Error:', chatRoomError);

      // Get all participants
      const { data: allParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('*')
        .eq('chat_room_id', chatRoomId);

      // console.log('🐛 DEBUG: All Participants:', allParticipants);
      // if (participantsError) console.log('🐛 DEBUG: Participants Error:', participantsError);

      // Get profiles for each participant
      if (allParticipants) {
        // console.log('🐛 DEBUG: Number of participants:', allParticipants.length);
        // for (const participant of allParticipants) {
          // console.log('🐛 DEBUG: Participant object:', participant);
          // const { data: profile, error: profileError } = await supabase
          //   .from('profiles')
          //   .select('*')
          //   .eq('id', participant.user_id)
          //   .single();

          // console.log(`🐛 DEBUG: Profile for ${participant.user_id}:`, profile);
          // if (profileError) console.log(`🐛 DEBUG: Profile Error for ${participant.user_id}:`, profileError);
        // }
      }

      // Let's check if this is an RLS issue by trying to find any user named "bobo_fishsoccer"
      // console.log('🐛 DEBUG: Searching for "bobo_fishsoccer" user...');
      
      // Check ambassador profiles
      const { data: ambassadorSearch, error: ambassadorError } = await supabase
        .from('ambassador_profiles')
        .select('user_id, full_name')
        .ilike('full_name', '%bobo_fishsoccer%');
      
      // console.log('🐛 DEBUG: Ambassador search for bobo_fishsoccer:', ambassadorSearch, ambassadorError);
      
      // Check client profiles  
      const { data: clientSearch, error: clientError } = await supabase
        .from('client_profiles')
        .select('user_id, company_name')
        .ilike('company_name', '%bobo_fishsoccer%');
        
      // console.log('🐛 DEBUG: Client search for bobo_fishsoccer:', clientSearch, clientError);

    } catch (error) {
      console.error('🐛 DEBUG: Unexpected error:', error);
    }
  },

  /**
   * Manual fix function to add a missing participant to a chat (for debugging)
   */
  async addParticipantToChat(chatRoomId: string, participantUserId: string) {
    try {
      console.log('🔧 Adding participant to chat:', { chatRoomId, participantUserId });
      
      const { data, error } = await supabase
        .from('chat_participants')
        .insert({
          chat_room_id: chatRoomId,
          user_id: participantUserId
        })
        .select();

      if (error) {
        console.error('Error adding participant:', error);
        return { data: null, error };
      }

      console.log('✅ Participant added successfully:', data);
      return { data, error: null };

    } catch (error) {
      console.error('Unexpected error adding participant to chat:', error);
      return { data: null, error };
    }
  },

  /**
   * Get contract details by chat room ID
   * This fetches the contract status for a chat room via campaign_ambassadors relationship
   */
  async getContractByChatId(chatRoomId: string) {
    try {
      // Step 1: Find campaign_ambassadors row for this chat_room_id
      const { data: ca, error: caError } = await supabase
        .from('campaign_ambassadors')
        .select('id')
        .eq('chat_room_id', chatRoomId)
        .single();
      if (caError || !ca) {
        return { data: null, error: caError || new Error('No campaign_ambassador for this chat') };
      }
      // Step 2: Find contract for this campaign_ambassador
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', ca.id)
        .single();
      if (contractError || !contract) {
        return { data: null, error: contractError || new Error('No contract for this chat') };
      }
      return { data: contract, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  /**
   * Fetch all contracts for a given client (by client_profile.id)
   * Joins campaign_ambassadors, campaigns, ambassador_profiles
   */
  async getContractsForClient(clientProfileId: string) {
    try {
      // 1. Find all campaign_ambassadors for campaigns owned by this client
      // Workaround: fetch campaign_ambassadors, then fetch campaigns separately
      const { data: caRows, error: caError } = await supabase
        .from('campaign_ambassadors')
        .select('id, campaign_id, ambassador_id, chat_room_id')
      if (caError || !caRows) {
        console.log('[getContractsForClient] caRows:', caRows, 'caError:', caError);
        return { data: [], error: caError || new Error('No campaign_ambassadors found') };
      }
      // Fetch campaigns for this client (use 'title' not 'name')
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, title, client_id')
        .eq('client_id', clientProfileId);
      if (campaignsError || !campaigns) {
        console.log('[getContractsForClient] campaigns:', campaigns, 'campaignsError:', campaignsError);
        return { data: [], error: campaignsError || new Error('No campaigns found') };
      }
      // Only keep campaign_ambassadors for this client's campaigns
      const clientCampaignIds = new Set(campaigns.map((c: any) => c.id));
      const filteredCAs = caRows.filter((ca: any) => clientCampaignIds.has(ca.campaign_id));
      // Fetch ambassador profiles
      const ambassadorIds = Array.from(new Set(filteredCAs.map((ca: any) => ca.ambassador_id)));
      let ambassadorProfiles: any[] = [];
      if (ambassadorIds.length > 0) {
        const { data: ambs, error: ambsError } = await supabase
          .from('ambassador_profiles')
          .select('id, full_name')
          .in('id', ambassadorIds);
        ambassadorProfiles = ambs || [];
      }
      // Fetch contracts
      const contractIds = filteredCAs.map((ca: any) => ca.id);
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
        .in('id', contractIds);
      if (contractsError || !contracts) {
        console.log('[getContractsForClient] contracts:', contracts, 'contractsError:', contractsError);
        return { data: [], error: contractsError || new Error('No contracts found') };
      }
      // Merge info for table display
      const merged = contracts.map(contract => {
        const ca = filteredCAs.find((ca: any) => ca.id === contract.id);
        const campaign = campaigns.find((c: any) => c.id === ca?.campaign_id);
        const ambassador = ambassadorProfiles.find((a: any) => a.id === ca?.ambassador_id);
        return {
          ...contract,
          campaign_name: campaign?.title || '-',
          ambassador_name: ambassador?.full_name || '-',
        };
      });
      console.log('[getContractsForClient] merged:', merged);
      return { data: merged, error: null };
    } catch (error) {
      return { data: [], error };
    }
  },
};
