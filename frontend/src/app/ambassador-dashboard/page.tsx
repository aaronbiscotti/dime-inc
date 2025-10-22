"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { campaignService } from "@/services/campaignService";
import { Database } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Campaign = Database['public']['Tables']['campaigns']['Row'];
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AmbassadorDashboard() {
  const { user, profile, ambassadorProfile, loading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const router = useRouter();

  const loadCampaigns = useCallback(async () => {
    if (!ambassadorProfile) return;
    try {
      const { data } = await campaignService.getCampaignsForAmbassador(
        ambassadorProfile.id
      );
      // Extract campaigns from the nested structure
      const campaigns = data?.map((item: any) => item.campaigns).filter(Boolean) || [];
      setCampaigns(campaigns);
    } catch (e) {
      console.error("Failed to load ambassador campaigns", e);
    }
  }, [ambassadorProfile]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-4">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Main content skeleton */}
              <div className="md:col-span-2">
                <div className="bg-white rounded-xl border border-gray-300 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-64"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Profile status skeleton */}
              <div className="bg-white rounded-xl border border-gray-300 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-8"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  My Active Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-semibold capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Onboarding</span>
                    <span className="text-sm font-semibold">
                      {profile.onboarding_completed ? (
                        <span className="text-green-600">Completed</span>
                      ) : (
                        <span className="text-yellow-600">Pending</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Joined</span>
                    <span className="text-sm">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
