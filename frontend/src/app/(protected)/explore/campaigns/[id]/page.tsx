"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { getCampaignAction } from "@/app/(protected)/explore/actions";
import { Database } from "@/types/database";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Send,
} from "lucide-react";

interface CampaignWithClient {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline: string | null;
  requirements: string | null;
  proposal_message: string | null;
  max_ambassadors: number | null;
  status: "active" | "draft" | "completed" | "cancelled";
  created_at: string | null;
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const campaignId = params.id as string;

  useEffect(() => {
    const loadCampaign = async () => {
      // Wait for auth to load
      if (authLoading) return;

      try {
        // Check authentication
        if (!user) {
          router.push("/signin?role=ambassador");
          return;
        }

        // Verify ambassador role
        if (profile?.role !== "ambassador") {
          router.push("/dashboard");
          return;
        }

        // Load campaign with client details using server function
        const result = await getCampaignAction(campaignId);
        const campaignData = result.ok ? result.data : null;

        if (!campaignData) {
          console.error("Campaign not found");
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
  }, [campaignId, router, user, profile, authLoading]);

  const handleApply = async () => {
    if (!campaign) return;

    setIsApplying(true);
    try {
      console.log(
        "Applying to campaign:",
        campaign.id,
        "with message:",
        applicationMessage
      );

      // For now, just show success
      setShowApplyModal(false);
      setShowSuccessModal(true);

      // Navigate after a delay
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push("/explore");
      }, 2000);
    } catch (error) {
      console.error("Error applying to campaign:", error);
      setShowApplyModal(false);
      setShowErrorModal(true);
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b border-[#f5d82e]"></div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.push("/explore")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </button>

        {/* Client Header */}
        <div className="bg-white rounded-xl border border-gray-300 p-8 mb-6">
          <div className="flex items-start gap-6 mb-6">
            {/* Client Logo */}
            {campaign.client_profiles?.logo_url ? (
              <Image
                src={campaign.client_profiles.logo_url}
                alt={campaign.client_profiles.company_name}
                width={80}
                height={80}
                className="rounded-xl object-cover"
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
        <div className="bg-white rounded-xl border border-gray-300 p-8 mb-6">
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
          <div className="pt-6 border-t border-gray-300">
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
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#f5d82e] bg-opacity-20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#f5d82e]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Budget Range
              </h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${campaign.budget_min.toFixed(0)} - $
              {campaign.budget_max.toFixed(0)}
            </p>
          </div>

          {/* Max Ambassadors */}
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Positions</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {campaign.max_ambassadors} spot
              {campaign.max_ambassadors !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Deadline */}
          <div className="bg-white rounded-xl border border-gray-300 p-6">
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
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Campaign Requirements
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {campaign.requirements}
            </p>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              background: "rgba(107, 114, 128, 0.5)",
            }}
            onClick={() => setShowApplyModal(false)}
          />

          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-lg w-full">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Apply to {campaign.title}
            </h3>
            <p className="text-gray-600 mb-6">
              Tell the client why you&apos;re a great fit for this campaign.
            </p>

            <textarea
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              placeholder="Share your relevant experience, audience demographics, and why you're interested in this campaign..."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent resize-none mb-6"
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              background: "rgba(107, 114, 128, 0.5)",
            }}
          />

          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Application Submitted!
            </h3>
            <p className="text-gray-600">
              Your application has been sent to the client. They&apos;ll review
              it and get back to you soon.
            </p>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              background: "rgba(107, 114, 128, 0.5)",
            }}
            onClick={() => setShowErrorModal(false)}
          />

          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Application Failed
            </h3>
            <p className="text-gray-600 mb-6">
              There was an error submitting your application. Please try again.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-2 bg-[#f5d82e] text-black rounded-lg font-medium hover:bg-[#e5c820] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
