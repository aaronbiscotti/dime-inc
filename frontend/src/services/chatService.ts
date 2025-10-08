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

      // Use database function to check for existing private chat
      const { data: existingChatId, error: checkError } = await supabase
        .rpc('find_private_chat_between_users', {
          user1_id: user.id,
          user2_id: params.participantId
        });

      if (checkError) {
        console.error('Error checking for existing chat:', checkError);
        // Continue to try creating a new chat even if check fails
      }

      // If chat exists, fetch and return it
      if (existingChatId) {
        const { data: existingChat, error: fetchError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', existingChatId)
          .single();

        if (!fetchError && existingChat) {
          console.log('Found existing chat:', existingChatId);
          return { data: existingChat, error: null };
        }
      }

      // Create a new private chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: params.subject || null, // Let the UI handle naming
          is_group: false,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat room:', chatError);
        return { data: null, error: chatError };
      }

      // Add both participants to the chat room
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          {
            chat_room_id: chatRoom.id,
            user_id: user.id
          },
          {
            chat_room_id: chatRoom.id,
            user_id: params.participantId
          }
        ]);

      if (participantError) {
        console.error('Error adding participants:', participantError);
        // Clean up - delete the chat room if we can't add participants
        await supabase.from('chat_rooms').delete().eq('id', chatRoom.id);
        return { data: null, error: participantError };
      }

      console.log('Created new private chat:', chatRoom.id);
      return { data: chatRoom, error: null };

    } catch (error) {
      console.error('Unexpected error creating chat:', error);
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
  }
};