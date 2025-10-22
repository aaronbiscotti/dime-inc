"use client";

import { Database } from "@/types/database";

type Campaign = Database['public']['Tables']['campaigns']['Row'];
import { Calendar, DollarSign, Users, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CampaignCardProps {
  campaign: Campaign;
  clientName?: string;
  clientLogo?: string;
}

export function CampaignCard({
  campaign,
  clientName,
  clientLogo,
}: CampaignCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/explore/campaigns/${campaign.id}`)}
      className="bg-white rounded-xl border border-gray-300 p-6 hover:shadow-lg hover:border-[#f5d82e] transition-all cursor-pointer"
    >
      {/* Client Info */}
      <div className="flex items-center gap-3 mb-4">
        {clientLogo ? (
          <Image
            src={clientLogo}
            alt={clientName || "Client"}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <Building2 className="w-5 h-5 text-gray-500" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-900">
            {clientName || "Anonymous Client"}
          </p>
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            Active
          </span>
        </div>
      </div>

      {/* Campaign Title & Description */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
        {campaign.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {campaign.description}
      </p>

      {/* Campaign Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <DollarSign className="w-4 h-4 text-[#f5d82e]" />
          <span className="font-medium">
            ${campaign.budget_min.toFixed(0)} - $
            {campaign.budget_max.toFixed(0)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-blue-500" />
          <span>
            Up to {campaign.max_ambassadors} ambassador
            {campaign.max_ambassadors !== 1 ? "s" : ""}
          </span>
        </div>

        {campaign.deadline && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span>
              Due{" "}
              {new Date(campaign.deadline).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/explore/campaigns/${campaign.id}`);
        }}
        className="w-full mt-4 px-4 py-2 bg-[#f5d82e] text-black font-medium rounded-lg hover:bg-[#e5c820] transition-colors"
      >
        View Details
      </button>
    </div>
  );
}
