"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";
import { Database } from "@/types/database";
import { ChevronRight } from "lucide-react";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

interface CampaignsListClientProps {
  campaigns: Campaign[];
}

export default function CampaignsListClient({
  campaigns,
}: CampaignsListClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>(campaigns);
  const router = useRouter();

  const handleCampaignCreated = async (
    newCampaign: Record<string, unknown>
  ) => {
    // Add the new campaign to the list
    setCampaignsList((prev) => [newCampaign as Campaign, ...prev]);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Campaigns</h1>
            <p className="text-gray-600 mt-1 text-sm">
              Create and manage your campaigns
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#f5d82e] text-black font-medium rounded-lg hover:bg-[#e5c820]"
          >
            + New Campaign
          </button>
        </div>

        {/* Create Campaign Modal */}
        <CreateCampaignModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onCampaignCreated={handleCampaignCreated}
        />

        {/* Campaigns List */}
        <div className="space-y-3">
          {campaignsList.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-300 p-8 text-center">
              <p className="text-gray-600 text-sm">
                No campaigns yet. Create your first campaign to get started!
              </p>
            </div>
          ) : (
            campaignsList.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => router.push(`/campaigns/${campaign.id}`)}
                className="bg-white rounded-xl border border-gray-300 p-4 transition-colors cursor-pointer hover:bg-gray-50 hover:border-gray-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
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
                        {campaign.status.charAt(0).toUpperCase() +
                          campaign.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2 text-sm">
                      {campaign.description}
                    </p>
                    <div className="flex gap-6 text-xs text-gray-600">
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
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
