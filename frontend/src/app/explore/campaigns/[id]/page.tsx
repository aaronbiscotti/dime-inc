"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { campaignService } from "@/services/campaignService";
import { Campaign } from "@/types/database";
import { ArrowLeft, Calendar, DollarSign, Users, Building2, Send } from "lucide-react";

interface CampaignWithClient extends Campaign {
  client_profiles?: {
    company_name: string;
    company_description: string | null;
    logo_url: string | null;
    industry: string | null;
  };
}

export default function AmbassadorCampaignDetails() {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignWithClient | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const campaignId = params.id as string;

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        // Check authentication
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login/brand-ambassador");
          return;
        }

        // Verify ambassador role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "ambassador") {
          router.push("/dashboard");
          return;
        }

        // Load campaign with client details
        const { data: campaignData, error } = await supabase
          .from("campaigns")
          .select(
            `
            *,
            client_profiles (
              company_name,
              company_description,
              logo_url,
              industry
            )
          `
          )
          .eq("id", campaignId)
          .single();

        if (error || !campaignData) {
          console.error("Error loading campaign:", error);
          router.push("/explore");
          return;
        }

        // Only show active campaigns
        if (campaignData.status !== "active") {
          router.push("/explore");
          return;
        }

        setCampaign(campaignData as CampaignWithClient);
      } catch (error) {
        console.error("Error loading campaign:", error);
        router.push("/explore");
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, router, supabase]);

  const handleApply = async () => {
    if (!campaign) return;

    setIsApplying(true);
    try {
      // TODO: Implement application logic
      // This would create a bid or application record
      console.log("Applying to campaign:", campaign.id, "with message:", applicationMessage);
      
      // For now, just show success
      alert("Application submitted successfully!");
      setShowApplyModal(false);
      router.push("/explore");
    } catch (error) {
      console.error("Error applying to campaign:", error);
      alert("Failed to submit application");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-5xl mx-auto p-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/explore")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </button>

          {/* Client Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <div className="flex items-start gap-6 mb-6">
              {/* Client Logo */}
              {campaign.client_profiles?.logo_url ? (
                <img
                  src={campaign.client_profiles.logo_url}
                  alt={campaign.client_profiles.company_name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-gray-400" />
                </div>
              )}

              {/* Client Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {campaign.client_profiles?.company_name || "Anonymous Client"}
                </h2>
                {campaign.client_profiles?.industry && (
                  <p className="text-sm text-gray-600 mb-2">
                    {campaign.client_profiles.industry}
                  </p>
                )}
                {campaign.client_profiles?.company_description && (
                  <p className="text-gray-600">
                    {campaign.client_profiles.company_description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Campaign Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {campaign.title}
                  </h1>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                    Active
                  </span>
                </div>
                <p className="text-gray-600 text-lg">{campaign.description}</p>
              </div>
            </div>

            {/* Apply Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowApplyModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-[#f5d82e] text-black font-medium rounded-lg hover:bg-[#e5c820] transition-colors"
              >
                <Send className="w-4 h-4" />
                Apply to Campaign
              </button>
            </div>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Budget */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#f5d82e] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#f5d82e]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Budget Range</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${campaign.budget_min.toFixed(0)} - ${campaign.budget_max.toFixed(0)}
              </p>
            </div>

            {/* Max Ambassadors */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Positions</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {campaign.max_ambassadors} spot{campaign.max_ambassadors !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Deadline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Deadline</h3>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {campaign.deadline
                  ? new Date(campaign.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "No deadline"}
              </p>
            </div>
          </div>

          {/* Requirements */}
          {campaign.requirements && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Campaign Requirements
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {campaign.requirements}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Apply to {campaign.title}
            </h3>
            <p className="text-gray-600 mb-6">
              Tell the client why you're a great fit for this campaign.
            </p>
            
            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              placeholder="Share your relevant experience, audience demographics, and why you're interested in this campaign..."
              className="w-full h-40 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent resize-none mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                disabled={isApplying}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={isApplying || !applicationMessage.trim()}
                className="flex-1 px-4 py-2 bg-[#f5d82e] text-black rounded-lg font-medium hover:bg-[#e5c820] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isApplying ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
