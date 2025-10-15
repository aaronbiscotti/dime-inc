"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/Navbar";

export default function ClientDashboard() {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkClientRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login/client");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "client") {
          setIsClient(true);
        } else {
          // Redirect ambassadors to their dashboard
          router.push("/ambassador-dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/login/client");
      } finally {
        setLoading(false);
      }
    };

    checkClientRole();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    );
  }

  if (!isClient) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Client Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome to your client dashboard. More features coming soon!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
