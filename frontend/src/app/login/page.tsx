"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthFlow } from "@/components/auth/AuthFlow";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If user is already authenticated, redirect to dashboard
    if (user && profile) {
      router.replace("/dashboard");
      return;
    }
  }, [user, profile, loading, router]);

  return <AuthFlow redirectTo="/dashboard" />;
}
