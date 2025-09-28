"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthSkeleton } from "@/components/skeletons/AuthSkeleton";

interface ProfileGuardProps {
  children: React.ReactNode;
}

export function ProfileGuard({ children }: ProfileGuardProps) {
  const { user, profile, ambassadorProfile, clientProfile, loading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (loading || isRedirecting) return;

    // If user is not logged in, redirect to login
    if (!user) {
      setIsRedirecting(true);
      router.push("/login/client");
      return;
    }

    // If user doesn't have a basic profile, redirect to login
    if (!profile) {
      setIsRedirecting(true);
      router.push("/login/client");
      return;
    }

    // Check if user has completed their role-specific profile
    const hasCompleteProfile = profile.role === "ambassador"
      ? !!ambassadorProfile
      : !!clientProfile;

    if (!hasCompleteProfile) {
      const profileSetupPath = profile.role === "client"
        ? "/login/client"
        : "/login/brand-ambassador";

      console.log(`User has incomplete profile. Redirecting to ${profileSetupPath}`);
      setIsRedirecting(true);
      router.push(profileSetupPath);
      return;
    }

    // Reset redirecting flag if we reach here
    setIsRedirecting(false);
  }, [user, profile, ambassadorProfile, clientProfile, loading, router, isRedirecting]);

  // Show loading while checking auth state or redirecting
  if (loading || isRedirecting) {
    return <AuthSkeleton />;
  }

  // Don't render anything if not properly authenticated
  if (!user || !profile) {
    return null;
  }

  // Additional safety checks
  if (!profile.role) {
    return null;
  }

  const hasCompleteProfile = profile.role === "ambassador"
    ? !!ambassadorProfile
    : !!clientProfile;

  if (!hasCompleteProfile) {
    return null;
  }

  // User is fully authenticated and has complete profile
  return <>{children}</>;
}