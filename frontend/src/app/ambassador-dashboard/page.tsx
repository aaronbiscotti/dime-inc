"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";

export default function AmbassadorDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If no user, redirect to login
    if (!user) {
      router.push("/login/brand-ambassador");
      return;
    }

    // If not an ambassador, redirect to client dashboard
    if (profile?.role !== "ambassador") {
      router.push("/client-dashboard");
      return;
    }

    // User is authenticated and is an ambassador
    setLoading(false);
  }, [user, profile, authLoading, router]);

  if (loading || authLoading) {
    return null;
  }

  if (!user || profile?.role !== "ambassador") {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ambassador Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome to your ambassador dashboard. More features coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
