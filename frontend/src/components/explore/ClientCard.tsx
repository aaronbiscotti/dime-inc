"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPinIcon,
  StarIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useChatInitiation } from "@/hooks/useChatInitiation";

interface ClientCardProps {
  client: {
    id: string;
    companyName: string;
    industry: string;
    description: string;
    location: string;
    activeCampaigns: number;
    budgetRange: string;
    rating: number;
    completedPartnerships: number;
  };
}

export function ClientCard({ client }: ClientCardProps) {
  const { profile } = useAuth();
  const { initiateChat, isLoading, canInitiate } = useChatInitiation({
    participantId: client.id,
    participantName: client.companyName,
    participantRole: "client",
  });

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden !py-0">
      <CardContent className="!p-0">
        <div>
          {/* Banner with overlay */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="font-semibold text-lg">{client.companyName}</h3>
              <p className="text-sm opacity-90">{client.industry}</p>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-700 mb-4 line-clamp-2">
              {client.description}
            </p>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPinIcon className="w-4 h-4" />
                <span>{client.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <CurrencyDollarIcon className="w-4 h-4" />
                <span>{client.budgetRange}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <StarIcon className="w-4 h-4" />
                <span>
                  {client.rating} • {client.completedPartnerships} partnerships
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-600">
                {client.activeCampaigns} active campaigns
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Hiring
              </span>
            </div>

            <Button
              onClick={initiateChat}
              disabled={isLoading || !canInitiate}
              className="w-full bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-0 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              {isLoading ? "Applying..." : "Apply"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
