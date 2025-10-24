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
  const initialMessage = String(formData.get("initialMessage") ?? "").trim();

  if (!participantIds.length) {
    return {
      ok: false,
      error: "At least one participant is required",
    } as const;
  }

  // If creating a 1:1 chat via this generic action, try to reuse existing
  if (!isGroup && participantIds.length === 1) {
    const otherId = String(participantIds[0]);

    // Find any existing 1:1 chats the current user is in
    const { data: existingForUser, error: existingErr } = await supabase
      .from("chat_rooms")
      .select(
        `id, is_group, chat_participants!inner(user_id)`
      )
      .eq("is_group", false)
      .eq("chat_participants.user_id", user.id);

    if (!existingErr && existingForUser && existingForUser.length > 0) {
      const candidateIds = existingForUser.map((c) => c.id);

      // Check if the other participant is also in any of these rooms
      const { data: overlap } = await supabase
        .from("chat_participants")
        .select("chat_room_id")
        .eq("user_id", otherId)
        .in("chat_room_id", candidateIds);

      if (overlap && overlap.length > 0) {
        const chatId = overlap[0].chat_room_id as unknown as string;

        // Optionally send initial message
        if (initialMessage) {
          await supabase.from("messages").insert({
            chat_room_id: chatId,
            sender_id: user.id,
            content: initialMessage,
          });
          await supabase
            .from("chat_rooms")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", chatId);
        }

        revalidatePath("/chat");
        return { ok: true, data: { id: chatId } } as const;
      }
    }
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

  // Send initial message if provided
  if (initialMessage) {
    await supabase
      .from("messages")
      .insert({
        chat_room_id: chatRoom.id,
        sender_id: user.id,
        content: initialMessage,
      });
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

  let query = supabase
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

  // Reduce payload: only the latest message per room
  query = query
    .order("created_at", { foreignTable: "messages", ascending: false })
    .limit(1, { foreignTable: "messages" });

  const { data: chatRooms, error } = await query;

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
  const initialMessage = String(formData.get("initialMessage") ?? "").trim();

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

  // Optional introductory message for groups too
  if (initialMessage) {
    await supabase
      .from("messages")
      .insert({
        chat_room_id: chatRoom.id,
        sender_id: user.id,
        content: initialMessage,
      });
  }

  revalidatePath("/chat");
  return { ok: true, data: chatRoom } as const;
}

export async function createChatAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const participantId = String(formData.get("participantId") ?? "");
  const initialMessage = String(formData.get("initialMessage") ?? "").trim();

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
    const chatId = otherParticipant[0].chat_room_id as unknown as string;

    // If caller supplied an intro message, send it into the existing chat
    if (initialMessage) {
      await supabase.from("messages").insert({
        chat_room_id: chatId,
        sender_id: user.id,
        content: initialMessage,
      });
      await supabase
        .from("chat_rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", chatId);
    }

    return { ok: true, data: { id: chatId } } as const;
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

  // Intro message for newly created 1:1 chat
  if (initialMessage) {
    await supabase.from("messages").insert({
      chat_room_id: chatRoom.id,
      sender_id: user.id,
      content: initialMessage,
    });
  }

  revalidatePath("/chat");
  return { ok: true, data: chatRoom } as const;
}

// ============================================================================
// CHAT METADATA ACTIONS
// ============================================================================

export async function renameChatAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const chatRoomId = String(formData.get("chatRoomId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);

  if (!chatRoomId || !name) {
    return { ok: false, error: "Chat room ID and name are required" } as const;
  }

  // Ensure the user is a participant
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
    .from("chat_rooms")
    .update({ name })
    .eq("id", chatRoomId);

  if (error) return { ok: false, error: error.message } as const;

  revalidatePath(`/chat/${chatRoomId}`);
  return { ok: true } as const;
}

// Mark a chat as read by setting last_read_message_id to the latest message
export async function markChatReadAction(_: any, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const chatRoomId = String(formData.get("chatRoomId") ?? "").trim();
  if (!chatRoomId) {
    return { ok: false, error: "chatRoomId is required" } as const;
  }

  // Verify user is a participant
  const { data: participant, error: partErr } = await supabase
    .from("chat_participants")
    .select("id")
    .eq("chat_room_id", chatRoomId)
    .eq("user_id", user.id)
    .single();
  if (partErr || !participant) {
    return { ok: false, error: "Access denied" } as const;
  }

  // Find latest message id in this room
  const { data: latestMsg, error: latestErr } = await supabase
    .from("messages")
    .select("id")
    .eq("chat_room_id", chatRoomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // If no messages, nothing to do
  if (latestErr || !latestMsg) return { ok: true } as const;

  // Upsert into enhanced participants table if present, else update existing row
  const { error: updErr } = await supabase
    .from("chat_room_participants_enhanced")
    .upsert(
      {
        chat_room_id: chatRoomId,
        user_id: user.id,
        role: "member",
        last_read_message_id: latestMsg.id,
      },
      { onConflict: "chat_room_id,user_id" }
    );

  if (updErr) return { ok: false, error: updErr.message } as const;
  return { ok: true } as const;
}

// Returns per-room unread counts for the current user using a DB view
export async function getUnreadCountsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  // For now, return empty array - this would need proper unread tracking implementation
  return { ok: true, data: [] } as const;
}

// Returns total unread count for the current user (navbar ping)
export async function getUnreadTotalAction() {
  const user = await requireUser();
  const supabase = await createClient();

  // For now, return 0 - this would need proper unread tracking implementation
  return { ok: true, data: { total: 0 } } as const;
}

export async function deleteChatRoomAction(chatRoomId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    // First, check if the user has permission to delete this chat room
    const { data: chatRoom, error: chatError } = await supabase
      .from("chat_rooms")
      .select("id, created_by")
      .eq("id", chatRoomId)
      .single();

    if (chatError || !chatRoom) {
      return { ok: false, error: "Chat room not found" } as const;
    }

    // Check if user is the creator or has permission
    if (chatRoom.created_by !== user.id) {
      return { ok: false, error: "You don't have permission to delete this chat" } as const;
    }

    // Use the database function that handles foreign key constraints properly
    const { data, error } = await supabase.rpc("delete_chat_room", {
      chat_room_id: chatRoomId,
      requesting_user_id: user.id,
    });

    if (error) {
      return { ok: false, error: error.message } as const;
    }

    return { ok: true, data } as const;
  } catch (error) {
    console.error("Error deleting chat room:", error);
    return { ok: false, error: "Failed to delete chat room" } as const;
  }
}
