"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { campaignService } from "@/services/campaignService";
import { Campaign } from "@/types/database";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AmbassadorDashboard() {
  const { user, profile, ambassadorProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const router = useRouter();

  const loadCampaigns = useCallback(async () => {
    if (!ambassadorProfile) return;
    try {
      const { data } = await campaignService.getCampaignsForAmbassador(
        ambassadorProfile.id
      );
      setCampaigns(data || []);
    } catch (e) {
      console.error("Failed to load ambassador campaigns", e);
    }
  }, [ambassadorProfile]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login/brand-ambassador");
      return;
    }
    if (profile?.role !== "ambassador") {
      router.push("/client-dashboard");
      return;
    }
    loadCampaigns();
    setLoading(false);
  }, [user, profile, ambassadorProfile, authLoading, router, loadCampaigns]);

  if (loading || authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          My Active Campaigns
        </h1>
        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600">
                You are not part of any active campaigns yet.
              </p>
              <Button
                onClick={() => router.push("/explore")}
                className="mt-4 bg-[#f5d82e] hover:bg-[#e5c820] text-black"
              >
                Explore Campaigns
              </Button>
            </div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() =>
                  router.push(`/ambassador-dashboard/campaigns/${campaign.id}`)
                }
                className="bg-white rounded-xl border border-gray-300 p-6 hover:shadow-md transition-all cursor-pointer hover:border-[#f5d82e] flex justify-between items-center"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {campaign.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {campaign.description}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
