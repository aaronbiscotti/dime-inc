import { API_URL } from "@/config/api";

const API_BASE_URL = API_URL;

export class CleanupService {
  private static instance: CleanupService;

  static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  async cleanupOrphanedChats(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/chats/cleanup-orphaned`, {
        method: "POST",
        credentials: "include",
      });
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
