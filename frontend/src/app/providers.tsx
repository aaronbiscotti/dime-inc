'use client'

import { AuthProvider } from "@/contexts/AuthContext";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { ToastProvider } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { AppSkeleton } from "@/components/skeletons/AppSkeleton";
import { usePathname } from "next/navigation";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const pathname = usePathname();

  // Don't show skeleton on login/signup pages - let them render immediately
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (loading && !isAuthPage) {
    return <AppSkeleton />;
  }

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
        <DebugPanel />
      </AuthProvider>
    </ToastProvider>
  );
}
