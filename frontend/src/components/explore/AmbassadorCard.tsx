"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPinIcon,
  UsersIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/services/chatService";

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
  const [isContacting, setIsContacting] = useState(false);
  const { profile, clientProfile } = useAuth();
  const router = useRouter();

  const handleContact = async () => {
    if (!profile || !clientProfile || profile.role !== 'client') {
      console.error('Only clients can contact ambassadors');
      return;
    }

    setIsContacting(true);
    try {
      // Check if chat already exists
      const { data: existingChat } = await chatService.checkExistingChat(
        clientProfile.user_id,
        ambassador.id // This is now the user_id from ExploreGrid
      );

      if (existingChat && typeof existingChat === 'object' && 'id' in existingChat) {
        // Redirect to existing chat
        const chat = existingChat as { id: string };
        router.push(`/chats?chat=${chat.id}`);
        return;
      }

      // Create new chat
      const { data: newChat, error } = await chatService.createChat({
        participant_id: ambassador.id,
        participant_name: ambassador.name,
        participant_role: 'ambassador'
      });

      if (error || !newChat) {
        console.error('Error creating chat:', error);
        return;
      }

      // Redirect to new chat
      router.push(`/chats?chat=${newChat.id}`);
    } catch (error) {
      console.error('Error handling contact:', error);
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      <CardContent>
        <div>
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xl font-semibold mx-auto mb-3">
              {ambassador.name.charAt(0)}
            </div>
            <h3 className="font-semibold text-gray-900">{ambassador.name}</h3>
            <p className="text-sm text-gray-600">@{ambassador.username}</p>
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
            onClick={handleContact}
            disabled={isContacting || profile?.role !== 'client'}
            className="w-full bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-0 disabled:bg-gray-300 disabled:text-gray-500"
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
            {isContacting ? 'Connecting...' : 'Contact'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
