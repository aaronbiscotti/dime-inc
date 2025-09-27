"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthSkeleton } from "@/components/skeletons/AuthSkeleton";

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user, profile, ambassadorProfile, clientProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If user is not logged in, redirect to login
      if (!user) {
        router.push("/login/client");
        return;
      }

      // If user doesn't have a basic profile, redirect to login
      if (!profile) {
        router.push("/login/client");
        return;
      }

      // Check if user has completed their role-specific profile
      // Only access profile.role if profile is not null
      const hasCompleteProfile =
        (profile.role === "ambassador" && ambassadorProfile) ||
        (profile.role === "client" && clientProfile);

      // If user doesn't have a complete profile, redirect to profile setup
      if (!hasCompleteProfile) {
        const profileSetupPath = profile.role === "client"
          ? "/login/client"
          : "/login/brand-ambassador";

        console.log(`User has incomplete profile. Redirecting to ${profileSetupPath}`);
        router.push(profileSetupPath);
        return;
      }
    }
  }, [user, profile, ambassadorProfile, clientProfile, loading, router]);

  // Show loading while checking auth state
  if (loading) {
    return <AuthSkeleton />;
  }

  // Don't render children if user is not properly authenticated/profiled
  if (!user || !profile) {
    return <AuthSkeleton />;
  }

  // Additional safety: ensure profile has a role before checking complete profile
  if (!profile.role) {
    return <AuthSkeleton />;
  }

  const hasCompleteProfile =
    (profile.role === "ambassador" && ambassadorProfile) ||
    (profile.role === "client" && clientProfile);

  if (!hasCompleteProfile) {
    return <AuthSkeleton />;
  }

  // User is fully authenticated and has complete profile
  return <>{children}</>;
}