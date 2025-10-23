"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { campaignService } from "@/services/campaignService";
import { Database } from "@/types/database";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

interface AmbassadorDashboardClientProps {
  ambassadorId: string;
}

export function AmbassadorDashboardClient({
  ambassadorId,
}: AmbassadorDashboardClientProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await campaignService.getCampaignsForAmbassador(
        ambassadorId
      );
      // Extract campaigns from the nested structure
      const campaigns =
        data?.map((item: any) => item.campaigns).filter(Boolean) || [];
      setCampaigns(campaigns);
    } catch (e) {
      console.error("Failed to load ambassador campaigns", e);
    } finally {
      setLoading(false);
    }
  }, [ambassadorId]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
      </div>
    );
  }

  return (
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
              router.push(`/ambassador/dashboard/campaigns/${campaign.id}`)
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
  );
}
