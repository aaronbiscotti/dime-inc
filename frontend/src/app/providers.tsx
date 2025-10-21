'use client'

import { useEffect } from "react";
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
  // Suppress browser extension errors in development
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // Ignore browser extension errors
      if (
        typeof args[0] === 'string' &&
        args[0].includes('message channel closed')
      ) {
        return;
      }
      originalError(...args);
    };

    // Also suppress unhandled promise rejections from extensions
    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes('message channel closed') ||
        event.reason?.message?.includes('Extension context invalidated')
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
        <DebugPanel />
      </AuthProvider>
    </ToastProvider>
  );
}
