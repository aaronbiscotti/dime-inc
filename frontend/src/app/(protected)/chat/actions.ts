"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// CHAT ROOM ACTIONS
// ============================================================================

export async function createChatRoomAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const isGroup = formData.get("isGroup") === "true";
  const participantIds = JSON.parse(
    String(formData.get("participantIds") ?? "[]")
  );

  if (!participantIds.length) {
    return {
      ok: false,
      error: "At least one participant is required",
    } as const;
  }

  // Create chat room
  const { data: chatRoom, error: roomError } = await supabase
    .from("chat_rooms")
    .insert({
      name: name || null,
      is_group: isGroup,
      created_by: user.id,
    })
    .select()
    .single();

  if (roomError) return { ok: false, error: roomError.message } as const;

  // Add participants
  const participants = [
    { chat_room_id: chatRoom.id, user_id: user.id },
    ...participantIds.map((id: string) => ({
      chat_room_id: chatRoom.id,
      user_id: id,
    })),
  ];

  const { error: participantsError } = await supabase
    .from("chat_participants")
    .insert(participants);

  if (participantsError) {
    // Clean up the chat room if participants failed
    await supabase.from("chat_rooms").delete().eq("id", chatRoom.id);
    return { ok: false, error: participantsError.message } as const;
  }

  revalidatePath("/chat");
  return { ok: true, data: chatRoom } as const;
}

export async function getChatRoomsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: chatRooms, error } = await supabase
    .from("chat_rooms")
    .select(
      `
      id,
      name,
      is_group,
      created_by,
      created_at,
      updated_at,
      chat_participants!inner(
        user_id,
        profiles!inner(
          id,
          role,
          ambassador_profiles(
            id,
            full_name,
            profile_photo_url,
            instagram_handle
          ),
          client_profiles(
            id,
            company_name,
            logo_url
          )
        )
      )
    `
    )
    .eq("chat_participants.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: chatRooms || [] } as const;
}

// ============================================================================
// MESSAGE ACTIONS
// ============================================================================

export async function sendMessageAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const chatRoomId = String(formData.get("chatRoomId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const fileUrl = String(formData.get("fileUrl") ?? "").trim();
  const replyToMessageId = String(
    formData.get("replyToMessageId") ?? ""
  ).trim();

  if (!chatRoomId || (!content && !fileUrl)) {
    return {
      ok: false,
      error: "Chat room ID and content are required",
    } as const;
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      chat_room_id: chatRoomId,
      sender_id: user.id,
      content: content || null,
      file_url: fileUrl || null,
      reply_to_message_id: replyToMessageId || null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message } as const;

  // Update chat room's updated_at timestamp
  await supabase
    .from("chat_rooms")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", chatRoomId);

  revalidatePath(`/chat/${chatRoomId}`);
  return { ok: true, data: message } as const;
}

export async function getMessagesAction(chatRoomId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify user is participant in this chat room
  const { data: participant } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_room_id", chatRoomId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { data: messages, error } = await supabase
    .from("messages")
    .select(
      `
      id,
      chat_room_id,
      sender_id,
      content,
      file_url,
      reply_to_message_id,
      created_at,
      profiles!inner(
        id,
        role,
        ambassador_profiles(
          id,
          full_name,
          profile_photo_url
        ),
        client_profiles(
          id,
          company_name,
          logo_url
        )
      )
    `
    )
    .eq("chat_room_id", chatRoomId)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: messages || [] } as const;
}

// ============================================================================
// PARTICIPANT ACTIONS
// ============================================================================

export async function addParticipantAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const chatRoomId = String(formData.get("chatRoomId") ?? "");
  const participantId = String(formData.get("participantId") ?? "");

  if (!chatRoomId || !participantId) {
    return {
      ok: false,
      error: "Chat room ID and participant ID are required",
    } as const;
  }

  // Verify user is participant in this chat room
  const { data: participant } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_room_id", chatRoomId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase.from("chat_participants").insert({
    chat_room_id: chatRoomId,
    user_id: participantId,
  });

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/chat/${chatRoomId}`);
  return { ok: true } as const;
}

export async function removeParticipantAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const chatRoomId = String(formData.get("chatRoomId") ?? "");
  const participantId = String(formData.get("participantId") ?? "");

  if (!chatRoomId || !participantId) {
    return {
      ok: false,
      error: "Chat room ID and participant ID are required",
    } as const;
  }

  // Verify user is participant in this chat room
  const { data: participant } = await supabase
    .from("chat_participants")
    .select("user_id")
    .eq("chat_room_id", chatRoomId)
    .eq("user_id", user.id)
    .single();

  if (!participant) {
    return { ok: false, error: "Access denied" } as const;
  }

  const { error } = await supabase
    .from("chat_participants")
    .delete()
    .eq("chat_room_id", chatRoomId)
    .eq("user_id", participantId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/chat/${chatRoomId}`);
  return { ok: true } as const;
}

// ============================================================================
// CHAT SERVICE REPLACEMENTS
// ============================================================================

export async function getUserChatsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: chatRooms, error } = await supabase
    .from("chat_rooms")
    .select(
      `
      id,
      name,
      is_group,
      created_by,
      created_at,
      updated_at,
      chat_participants!inner(
        user_id,
        profiles!inner(
          id,
          role,
          ambassador_profiles(
            id,
            full_name,
            profile_photo_url,
            instagram_handle
          ),
          client_profiles(
            id,
            company_name,
            logo_url
          )
        )
      ),
      messages(
        id,
        content,
        created_at,
        sender_id
      )
    `
    )
    .eq("chat_participants.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: error.message } as const;
  return { ok: true, data: chatRooms || [] } as const;
}

export async function createGroupChatAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const participantIds = JSON.parse(
    String(formData.get("participantIds") ?? "[]")
  );

  if (!participantIds.length) {
    return {
      ok: false,
      error: "At least one participant is required",
    } as const;
  }

  // Create chat room
  const { data: chatRoom, error: roomError } = await supabase
    .from("chat_rooms")
    .insert({
      name: name || null,
      is_group: true,
      created_by: user.id,
    })
    .select()
    .single();

  if (roomError) return { ok: false, error: roomError.message } as const;

  // Add participants
  const participants = [
    { chat_room_id: chatRoom.id, user_id: user.id },
    ...participantIds.map((id: string) => ({
      chat_room_id: chatRoom.id,
      user_id: id,
    })),
  ];

  const { error: participantsError } = await supabase
    .from("chat_participants")
    .insert(participants);

  if (participantsError) {
    // Clean up the chat room if participants failed
    await supabase.from("chat_rooms").delete().eq("id", chatRoom.id);
    return { ok: false, error: participantsError.message } as const;
  }

  revalidatePath("/chat");
  return { ok: true, data: chatRoom } as const;
}

export async function createChatAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const participantId = String(formData.get("participantId") ?? "");

  if (!participantId) {
    return {
      ok: false,
      error: "Participant ID is required",
    } as const;
  }

  // Check if chat already exists between these users
  const { data: existingChat } = await supabase
    .from("chat_rooms")
    .select(
      `
      id,
      chat_participants!inner(user_id)
    `
    )
    .eq("is_group", false)
    .eq("chat_participants.user_id", user.id);

  // Check if the other participant is also in this chat
  const { data: otherParticipant } = await supabase
    .from("chat_participants")
    .select("chat_room_id")
    .eq("user_id", participantId)
    .in("chat_room_id", existingChat?.map((c) => c.id) || []);

  if (otherParticipant && otherParticipant.length > 0) {
    return {
      ok: true,
      data: { id: otherParticipant[0].chat_room_id },
    } as const;
  }

  // Create new chat room
  const { data: chatRoom, error: roomError } = await supabase
    .from("chat_rooms")
    .insert({
      name: null,
      is_group: false,
      created_by: user.id,
    })
    .select()
    .single();

  if (roomError) return { ok: false, error: roomError.message } as const;

  // Add participants
  const participants = [
    { chat_room_id: chatRoom.id, user_id: user.id },
    { chat_room_id: chatRoom.id, user_id: participantId },
  ];

  const { error: participantsError } = await supabase
    .from("chat_participants")
    .insert(participants);

  if (participantsError) {
    await supabase.from("chat_rooms").delete().eq("id", chatRoom.id);
    return { ok: false, error: participantsError.message } as const;
  }

  revalidatePath("/chat");
  return { ok: true, data: chatRoom } as const;
}
