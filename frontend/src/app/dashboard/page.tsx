"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileGuard } from "@/components/auth/ProfileGuard";

export default function Dashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  useEffect(() => {
    // Redirect based on role - ProfileGuard ensures profile is complete
    if (profile?.role === "client") {
      router.replace("/client-dashboard");
    } else if (profile?.role === "ambassador") {
      router.replace("/ambassador-dashboard");
    } else {
      // If no profile yet, go to profile page
      router.replace("/profile");
    }
  }, [profile, router]);

  return (
    <ProfileGuard>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </ProfileGuard>
  );
}
