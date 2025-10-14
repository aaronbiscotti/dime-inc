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

      console.log('� Creating or finding private chat between:', user.id, 'and', params.participantId);
      console.log('� Participant name:', params.participantName);
      
      // Use the new RPC function to create or find private chat
      // NOTE: You need to run the SQL in create_private_chat.sql in your Supabase SQL editor first!
      const { data: chatResult, error: rpcError } = await supabase
        .rpc('create_private_chat_between_users' as any, {
          participant1_id: user.id,
          participant2_id: params.participantId,
          chat_name: params.subject || `Chat with ${params.participantName}`
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

      console.log('� FALLBACK: Creating chat room manually...');

      // Create a new private chat room
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: params.subject || `Chat with ${params.participantName}`,
          is_group: false,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) {
        console.error('Error creating chat room:', chatError);
        return { data: null, error: chatError };
      }

      // Add current user as participant (this should work)
      const { error: currentUserError } = await supabase
        .from('chat_participants')
        .insert({
          chat_room_id: chatRoom.id,
          user_id: user.id
        });

      if (currentUserError) {
        console.error('❌ Could not add current user as participant:', currentUserError);
        await supabase.from('chat_rooms').delete().eq('id', chatRoom.id);
        return { data: null, error: currentUserError };
      }

      console.log('⚠️ FALLBACK: Chat created with only current user due to RLS restrictions');
      console.log('⚠️ The other participant will need to be added via a different method');
      
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

      console.log('🗑️ Deleting chat room:', chatRoomId);

      // Use the RPC function to delete the chat room
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
};