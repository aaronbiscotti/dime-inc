"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) return;

    // If no user, redirect to login
    if (!user) {
      router.replace("/signin");
      return;
    }

    // Redirect based on role
    if (profile?.role === "client") {
      router.replace("/client-dashboard");
    } else if (profile?.role === "ambassador") {
      router.replace("/ambassador-dashboard");
    } else {
      // If no profile yet, go to profile page
      router.replace("/profile");
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
