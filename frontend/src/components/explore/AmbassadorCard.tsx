"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPinIcon,
  UsersIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useChatInitiation } from "@/hooks/useChatInitiation";

interface AmbassadorCardProps {
  ambassador: {
    id: string;
    name: string;
    username: string;
    bio: string;
    location: string;
    followers: string;
    niche: string[];
    rating: number;
    completedCampaigns: number;
    avgEngagement: string;
  };
}

export function AmbassadorCard({ ambassador }: AmbassadorCardProps) {
  const { profile } = useAuth();
  const { initiateChat, isLoading, canInitiate } = useChatInitiation({
    participantId: ambassador.id,
    participantName: ambassador.name,
    participantRole: "ambassador",
  });

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardContent>
        <div>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xl font-semibold mx-auto mb-3">
              {ambassador.name.charAt(0)}
            </div>
            <h3 className="font-semibold text-gray-900">{ambassador.name}</h3>
            <p className="text-sm text-gray-600">{ambassador.username.startsWith('@') ? ambassador.username : `@${ambassador.username}`}</p>
          </div>

          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
            {ambassador.bio}
          </p>

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPinIcon className="w-4 h-4" />
              <span>{ambassador.location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <UsersIcon className="w-4 h-4" />
              <span>{ambassador.followers} followers</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <StarIcon className="w-4 h-4" />
              <span>
                {ambassador.rating} • {ambassador.completedCampaigns} campaigns
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {ambassador.niche.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <Button
            onClick={initiateChat}
            disabled={isLoading || !canInitiate}
            className="w-full bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-0 disabled:bg-gray-300 disabled:text-gray-500"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            {isLoading ? "Connecting..." : "Contact"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
