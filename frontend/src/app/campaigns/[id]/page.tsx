"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { campaignService } from "@/services/campaignService";
import { Campaign, CampaignStatus } from "@/types/database";
import { ArrowLeft, Calendar, DollarSign, Users, Trash2, CheckCircle, XCircle } from "lucide-react";

export default function CampaignDetails() {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const campaignId = params.id as string;

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push("/login/client");
          return;
        }

        // Verify client role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "client") {
          router.push("/dashboard");
          return;
        }

        // Load campaign
        const campaignData = await campaignService.getCampaignById(campaignId);
        if (!campaignData) {
          router.push("/campaigns");
          return;
        }
        setCampaign(campaignData);
      } catch (error) {
        console.error("Error loading campaign:", error);
        router.push("/campaigns");
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, router, supabase]);

  const handleToggleStatus = async () => {
    if (!campaign) return;
    
    setIsUpdating(true);
    try {
      const newStatus: CampaignStatus = campaign.status === "active" ? "draft" : "active";
      await campaignService.updateCampaignStatus(campaign.id, newStatus);
      setCampaign({ ...campaign, status: newStatus });
    } catch (error) {
      console.error("Error updating campaign status:", error);
      alert("Failed to update campaign status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;
    
    setIsUpdating(true);
    try {
      await campaignService.deleteCampaign(campaign.id);
      router.push("/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      alert("Failed to delete campaign");
      setIsUpdating(false);
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
            onClick={() => router.push("/campaigns")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>

          {/* Campaign Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {campaign.title}
                  </h1>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      campaign.status === "draft"
                        ? "bg-gray-100 text-gray-700"
                        : campaign.status === "active"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-600 text-lg">{campaign.description}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={handleToggleStatus}
                disabled={isUpdating}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  campaign.status === "active"
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-[#f5d82e] text-black hover:bg-[#e5c820]"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {campaign.status === "active" ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Deactivate Campaign
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Activate Campaign
                  </>
                )}
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete Campaign
              </button>
            </div>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Budget */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#f5d82e] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#f5d82e]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Budget Range</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${campaign.budget_min.toFixed(2)} - ${campaign.budget_max.toFixed(2)}
              </p>
            </div>

            {/* Max Ambassadors */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Max Ambassadors</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900">{campaign.max_ambassadors}</p>
            </div>
          </div>

          {/* Deadline & Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Deadline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Deadline</h3>
                </div>
                <p className="text-gray-600">
                  {campaign.deadline
                    ? new Date(campaign.deadline).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "No deadline set"}
                </p>
              </div>

              {/* Created Date */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Created</h3>
                </div>
                <p className="text-gray-600">
                  {new Date(campaign.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {campaign.requirements && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{campaign.requirements}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Campaign?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{campaign.title}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
