"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { CreateCampaignForm } from "@/components/campaigns/CreateCampaignForm";
import { campaignService } from "@/services/campaignService";
import { Campaign } from "@/types/database";
import { ChevronRight } from "lucide-react";

export default function Campaigns() {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
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
          loadCampaigns();
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

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const data = await campaignService.getClientCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleCampaignCreated = (campaign: Campaign) => {
    setCampaigns([campaign, ...campaigns]);
    setShowForm(false);
  };

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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Campaigns
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage your campaigns
              </p>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-[#f5d82e] text-black font-medium rounded-lg hover:bg-[#e5c820]"
              >
                + New Campaign
              </button>
            )}
          </div>

          {/* Create Campaign Form */}
          {showForm && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Create New Campaign
              </h2>
              <CreateCampaignForm
                onSuccess={handleCampaignCreated}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {/* Campaigns List */}
          <div className="space-y-4">
            {loadingCampaigns ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e] mx-auto"></div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <p className="text-gray-600">
                  No campaigns yet. Create your first campaign to get started!
                </p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-[#f5d82e]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {campaign.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            campaign.status === "draft"
                              ? "bg-gray-100 text-gray-700"
                              : campaign.status === "active"
                              ? "bg-green-100 text-green-700"
                              : campaign.status === "completed"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>
                      <div className="flex gap-6 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Budget:</span> $
                          {campaign.budget_min.toFixed(2)} - $
                          {campaign.budget_max.toFixed(2)}
                        </div>
                        {campaign.deadline && (
                          <div>
                            <span className="font-medium">Deadline:</span>{" "}
                            {new Date(campaign.deadline).toLocaleDateString()}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Max Ambassadors:</span>{" "}
                          {campaign.max_ambassadors}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
