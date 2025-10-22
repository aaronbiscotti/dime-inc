/**
 * Cleanup Service - Handles cleanup operations via direct Supabase calls
 * Now uses RLS policies for security instead of FastAPI backend
 */

import { createClient } from "@/lib/supabase/client"; // Use the client-side client

export class CleanupService {
  private static instance: CleanupService;
  private supabase = createClient(); // Instantiate the client

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  async cleanupOrphanedChats(): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      // Find chat rooms where the user is the only participant
      const { data: orphanedChats, error: findError } = await this.supabase
        .from("chat_rooms")
        .select(`
          id,
          chat_participants(count)
        `)
        .eq("is_group", false);

      if (findError) {
        console.error("Failed to find orphaned chats:", findError);
        return;
      }

      // Delete chat rooms with only one participant
      const chatIdsToDelete = orphanedChats
        ?.filter(chat => chat.chat_participants?.[0]?.count === 1)
        ?.map(chat => chat.id) || [];

      if (chatIdsToDelete.length > 0) {
        const { error: deleteError } = await this.supabase
          .from("chat_rooms")
          .delete()
          .in("id", chatIdsToDelete);

        if (deleteError) {
          console.error("Failed to delete orphaned chats:", deleteError);
        } else {
          console.log(`Cleaned up ${chatIdsToDelete.length} orphaned chats`);
        }
      }
    } catch (error) {
      console.error("Failed to cleanup orphaned chats:", error);
    }
  }

  startPeriodicCleanup(): void {
    // Run cleanup every 30 minutes
    setInterval(() => {
      this.cleanupOrphanedChats();
    }, 30 * 60 * 1000);
  }
}