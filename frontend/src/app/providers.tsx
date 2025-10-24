"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/toast";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type AmbassadorProfile = Database["public"]["Tables"]["ambassador_profiles"]["Row"];
type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];

export function Providers({
  children,
  initialUser = null,
  initialProfile = null,
  initialAmbassadorProfile = null,
  initialClientProfile = null,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
  initialProfile?: Profile | null;
  initialAmbassadorProfile?: AmbassadorProfile | null;
  initialClientProfile?: ClientProfile | null;
}) {
  // Suppress browser extension errors in development
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      // Ignore browser extension errors
      if (
        typeof args[0] === "string" &&
        args[0].includes("message channel closed")
      ) {
        return;
      }
      originalError(...args);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (
        event.reason?.message?.includes("message channel closed") ||
        event.reason?.message?.includes("Extension context invalidated")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return (
    <ToastProvider>
      <AuthProvider
        initialUser={initialUser}
        initialProfile={initialProfile}
        initialAmbassadorProfile={initialAmbassadorProfile}
        initialClientProfile={initialClientProfile}
      >
        {children}
      </AuthProvider>
    </ToastProvider>
  );
}
