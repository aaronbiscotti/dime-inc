"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
// Removed service import - using server actions instead
import { AppSkeleton } from "@/components/skeletons/AppSkeleton";
import { usePathname } from "next/navigation";

export function AppContent({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const pathname = usePathname();

  // Don't show skeleton on signin/signup pages
  const isAuthPage =
    pathname?.startsWith("/signin") ||
    pathname?.startsWith("/signup") ||
    pathname === "/";

  // Cleanup service removed - using server actions instead

  if (loading && !isAuthPage) {
    return <AppSkeleton />;
  }

  return <>{children}</>;
}
