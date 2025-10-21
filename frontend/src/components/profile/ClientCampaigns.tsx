"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CampaignDisplay } from "@/types/database";
import { Plus, Calendar, Users, DollarSign, Clock } from "lucide-react";
import Image from "next/image";

interface ClientCampaignsProps {
  campaigns: CampaignDisplay[];
  loading: boolean;
  onCreateCampaign: () => void;
}

export function ClientCampaigns({
  campaigns,
  loading,
  onCreateCampaign,
}: ClientCampaignsProps) {
  if (loading) {
    return (
      <div className="lg:col-span-2">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Campaigns</h3>
            <Button
              onClick={onCreateCampaign}
              className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Campaigns</h3>
          <Button
            onClick={onCreateCampaign}
            className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Campaigns Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Click the button to create your first campaign and start
                  finding talent.
                </p>
                <Button
                  onClick={onCreateCampaign}
                  className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Filled Cards - Client Campaigns */
          campaigns.map((campaign: CampaignDisplay) => (
            <Card
              key={campaign.id}
              className="group cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-200"
            >
              <CardContent className="p-0">
                <div className="relative">
                  {/* Campaign Cover */}
                  <div className="h-48 bg-gray-200 rounded-t-xl overflow-hidden relative">
                    {campaign.coverImage ? (
                      <Image
                        src={campaign.coverImage}
                        alt={campaign.title}
                        width={300}
                        height={192}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-4xl">📸</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          campaign.status === "active"
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : campaign.status === "draft"
                            ? "bg-gray-100 text-gray-800 border border-gray-300"
                            : campaign.status === "completed"
                            ? "bg-blue-100 text-blue-800 border border-blue-300"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {campaign.status.charAt(0).toUpperCase() +
                          campaign.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 line-clamp-1">
                        {campaign.title}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>{campaign.budgetRange}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{campaign.ambassadorCount} ambassadors</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{campaign.timeline}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
