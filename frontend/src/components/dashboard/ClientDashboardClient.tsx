"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaignAction } from "@/app/(protected)/campaigns/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, DollarSign, Users, Clock } from "lucide-react";

type Props = {
  userId: string;
  role: string;
  campaigns: Array<{
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
    updated_at: string | null;
  }>;
};

export default function ClientDashboardClient({
  userId,
  role,
  campaigns,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreateCampaign = () => {
    router.push("/campaigns/new");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-medium text-gray-900">Campaigns</h3>
        <Button
          onClick={handleCreateCampaign}
          className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 rounded-full font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <div className="bg-white rounded-xl border border-dashed border-gray-300">
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-[#f5d82e] bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-2">
                  No Campaigns Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Click the button to create your first campaign and start
                  finding talent.
                </p>
                <Button
                  onClick={handleCreateCampaign}
                  className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 rounded-full font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Campaign Cards */
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
            >
              {/* Campaign Cover */}
              <div className="h-32 bg-gray-100 rounded-t-xl overflow-hidden relative">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-2xl">📸</span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      campaign.status === "active"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : campaign.status === "draft"
                        ? "bg-gray-50 text-gray-700 border border-gray-200"
                        : campaign.status === "completed"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Campaign Info */}
              <div className="p-4 space-y-3">
                <h4 className="text-gray-900 line-clamp-1 text-sm font-medium">
                  {campaign.title}
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <DollarSign className="w-3 h-3" />
                    <span>
                      ${campaign.budget_min} - ${campaign.budget_max}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>
                      {campaign.created_at
                        ? new Date(campaign.created_at).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
