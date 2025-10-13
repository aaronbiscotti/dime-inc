"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/Navbar";

export default function Campaigns() {
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
              Campaign Management
            </h1>
            <p className="text-gray-600 mb-8">
              Create, manage, and track your influencer marketing campaigns.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {/* Active Campaigns */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Active Campaigns
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  View and manage your currently running campaigns
                </p>
                <div className="text-2xl font-bold text-[#f5d82e]">0</div>
              </div>

              {/* Draft Campaigns */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Draft Campaigns
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Campaigns in progress and ready to launch
                </p>
                <div className="text-2xl font-bold text-gray-500">0</div>
              </div>

              {/* Completed Campaigns */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Completed Campaigns
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  View results from your finished campaigns
                </p>
                <div className="text-2xl font-bold text-green-600">0</div>
              </div>
            </div>

            <div className="mt-12">
              <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Ready to start your first campaign?
                </h2>
                <p className="text-gray-600 mb-6">
                  Campaign creation tools and management features are coming soon. 
                  You'll be able to create campaigns, set budgets, select ambassadors, 
                  and track performance all from this page.
                </p>
                <button 
                  className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 font-medium px-6 py-2 rounded-lg transition-colors"
                  disabled
                >
                  Create Campaign (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
