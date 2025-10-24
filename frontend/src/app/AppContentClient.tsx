"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { cleanupOrphanedChatsAction } from "@/app/(protected)/cleanup/actions";
import { AppSkeleton } from "@/components/skeletons/AppSkeleton";
import { usePathname } from "next/navigation";

export function AppContentClient({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const pathname = usePathname();

  // Don't show skeleton on signin/signup pages
  const isAuthPage =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname === "/";

  // Start periodic cleanup when authenticated
  useEffect(() => {
    if (user) {
      // Run cleanup immediately
      cleanupOrphanedChatsAction().catch(console.error);

      // Set up periodic cleanup every 5 minutes
      const interval = setInterval(() => {
        cleanupOrphanedChatsAction().catch(console.error);
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading && !isAuthPage) {
    return <AppSkeleton />;
  }

  return <>{children}</>;
}
