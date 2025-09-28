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

export const chatService = {
  async createChat(params: CreateChatParams) {
    try {
      // Get the current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        return { data: null, error: userError || new Error('User not authenticated') };
      }
  
      // Get the profile ID for the current user
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)  // Assuming profiles.id matches auth user id
        .single();
  
      if (profileError || !currentProfile) {
        console.error('Profile not found:', profileError);
        return { data: null, error: new Error('User profile not found') };
      }
  
      // Create a chat room using the auth user's ID
      const { data: chatRoom, error: chatError } = await supabase
        .from('chat_rooms')
        .insert({
          name: params.subject || `Conversation with ${params.participantName}`,
          is_group: false,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
  
      if (chatError) {
        console.error('Error creating chat room:', chatError);
        return { data: null, error: chatError };
      }
  
      // Add both participants to the chat room using PROFILE IDs
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert([
          {
            chat_room_id: chatRoom.id,
            user_id: currentProfile.id, // Use profile ID
            joined_at: new Date().toISOString()
          },
          {
            chat_room_id: chatRoom.id,
            user_id: params.participantId, // This should be a profile ID
            joined_at: new Date().toISOString()
          }
        ]);
  
      if (participantError) {
        console.error('Error adding participants:', participantError);
        return { data: null, error: participantError };
      }
  
      return { data: chatRoom, error: null };
  
    } catch (error) {
      console.error('Unexpected error creating chat:', error);
      return { data: null, error };
    }
  },
  

  async checkExistingChat(userId1: string, userId2: string) {
    try {
      // Find chat rooms where both users are participants
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          chat_participants!inner(user_id)
        `)
        .eq('is_group', false)
        .eq('chat_participants.user_id', userId1);

      if (error) {
        console.error('Error checking existing chat:', error);
        return { data: null, error };
      }

      // Filter for rooms where both users are participants
      const existingChat = data?.find(room => {
        const participantIds = room.chat_participants.map((p: any) => p.user_id);
        return participantIds.includes(userId1) && participantIds.includes(userId2) && participantIds.length === 2;
      });

      return { data: existingChat || null, error: null };
    } catch (error) {
      console.error('Unexpected error checking chat:', error);
      return { data: null, error };
    }
  }
};