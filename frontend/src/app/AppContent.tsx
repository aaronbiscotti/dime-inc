"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CleanupService } from "@/services/cleanupService";
import { AppSkeleton } from "@/components/skeletons/AppSkeleton";
import { usePathname } from "next/navigation";

export function AppContent({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const pathname = usePathname();

  // Don't show skeleton on login/signup pages
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname === "/";

  // Start periodic orphaned chat cleanup when authenticated
  useEffect(() => {
    if (user) {
      CleanupService.getInstance().startPeriodicCleanup();
    }
  }, [user]);

  if (loading && !isAuthPage) {
    return <AppSkeleton />;
  }

  return <>{children}</>;
}
