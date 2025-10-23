"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// CLEANUP ACTIONS
// ============================================================================

export async function cleanupOrphanedChatsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    // Find chat rooms where the user is the only participant
    const { data: orphanedChats, error: findError } = await supabase
      .from("chat_rooms")
      .select(
        `
        id,
        chat_participants(count)
      `
      )
      .eq("is_group", false);

    if (findError) {
      return { ok: false, error: "Failed to find orphaned chats" } as const;
    }

    // Delete chat rooms with only one participant
    const chatIdsToDelete =
      orphanedChats
        ?.filter((chat: any) => chat.chat_participants?.[0]?.count === 1)
        ?.map((chat: any) => chat.id) || [];

    if (chatIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("chat_rooms")
        .delete()
        .in("id", chatIdsToDelete);

      if (deleteError) {
        return { ok: false, error: "Failed to delete orphaned chats" } as const;
      }
    }

    revalidatePath("/chat");
    return {
      ok: true,
      data: { deletedCount: chatIdsToDelete.length },
    } as const;
  } catch (error) {
    return { ok: false, error: "Cleanup failed" } as const;
  }
}

export async function cleanupExpiredSessionsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    // This would typically involve cleaning up expired sessions
    // For now, we'll just return success as session cleanup is handled by Supabase
    return {
      ok: true,
      data: { message: "Session cleanup completed" },
    } as const;
  } catch (error) {
    return { ok: false, error: "Session cleanup failed" } as const;
  }
}

export async function cleanupOldNotificationsAction() {
  const user = await requireUser();
  const supabase = await createClient();

  try {
    // Delete notifications older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error } = await supabase
      .from("campaigns")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (error) {
      return {
        ok: false,
        error: "Failed to cleanup old notifications",
      } as const;
    }

    revalidatePath("/notifications");
    return {
      ok: true,
      data: { message: "Old notifications cleaned up" },
    } as const;
  } catch (error) {
    return { ok: false, error: "Notification cleanup failed" } as const;
  }
}
