"use client";

import React, { useState } from "react";
import { Search, Heart, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { CampaignCard } from "@/components/explore/CampaignCard";
import { Modal } from "@/components/ui/modal";
import {
  getAmbassadorsAction,
  getCampaignsAction,
} from "@/app/(protected)/explore/actions";
import { createChatRoomAction } from "@/app/(protected)/chat/actions";

interface Influencer {
  id: string;
  user_id: string;
  full_name: string;
  bio?: string | null;
  location?: string | null;
  niche?: string[] | null;
  profile_photo_url?: string | null;
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

interface Campaign {
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
  client_id: string;
  updated_at: string | null;
  client_profiles?: {
    company_name: string;
    logo_url: string | null;
  };
}

interface ExploreInterfaceClientProps {
  initialAmbassadors: Influencer[];
  initialCampaigns: Campaign[];
}

export default function ExploreInterfaceClient({
  initialAmbassadors,
  initialCampaigns,
}: ExploreInterfaceClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Most relevant");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [showNicheDropdown, setShowNicheDropdown] = useState(false);
  const [ambassadors, setAmbassadors] = useState(initialAmbassadors);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const { userRole } = useAuth();
  const router = useRouter();

  const niches = [
    "Fashion",
    "Beauty",
    "Fitness",
    "Food",
    "Travel",
    "Tech",
    "Gaming",
    "Music",
    "Art",
    "Lifestyle",
    "Business",
    "Education",
    "Health",
    "Sports",
  ];

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const [ambassadorsResult, campaignsResult] = await Promise.all([
        getAmbassadorsAction({
          search: searchQuery,
          niches: selectedNiche ? [selectedNiche] : undefined,
        }),
        getCampaignsAction({
          search: searchQuery,
          status: "active",
        }),
      ]);

      if (ambassadorsResult.ok) {
        setAmbassadors(ambassadorsResult.data);
      }
      if (campaignsResult.ok) {
        setCampaigns(campaignsResult.data);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setShowChatModal(true);
  };

  const handleCreateChat = async () => {
    if (!selectedInfluencer) return;

    setIsCreatingChat(true);
    try {
      const formData = new FormData();
      formData.append("isGroup", "false");
      formData.append(
        "participantIds",
        JSON.stringify([selectedInfluencer.user_id])
      );

      const result = await createChatRoomAction(null, formData);

      if (result.ok) {
        setShowChatModal(false);
        setSelectedInfluencer(null);
        router.push(`/chat/${result.data.id}`);
      } else {
        console.error("Failed to create chat:", result.error);
      }
    } catch (error) {
      console.error("Chat creation failed:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleNicheSelect = (niche: string) => {
    setSelectedNiche(selectedNiche === niche ? null : niche);
    setShowNicheDropdown(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search influencers or campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNicheDropdown(!showNicheDropdown)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {selectedNiche || "All Niches"}
            <ChevronDown className="w-4 h-4" />
          </button>

          {showNicheDropdown && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              <button
                onClick={() => handleNicheSelect("")}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                  !selectedNiche ? "bg-blue-50 text-blue-600" : ""
                }`}
              >
                All Niches
              </button>
              {niches.map((niche) => (
                <button
                  key={niche}
                  onClick={() => handleNicheSelect(niche)}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 ${
                    selectedNiche === niche ? "bg-blue-50 text-blue-600" : ""
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambassadors */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Influencers</h2>
          <div className="space-y-3">
            {ambassadors.map((influencer) => (
              <div
                key={influencer.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={influencer.profile_photo_url || "/default-avatar.png"}
                    alt={influencer.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{influencer.full_name}</h3>
                    <p className="text-sm text-gray-600">{influencer.bio}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {influencer.niche?.map((n) => (
                        <span
                          key={n}
                          className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {influencer.instagram_handle && (
                        <span className="text-sm text-gray-500">
                          @{influencer.instagram_handle}
                        </span>
                      )}
                      {influencer.tiktok_handle && (
                        <span className="text-sm text-gray-500">
                          @{influencer.tiktok_handle}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(influencer)}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    <Heart className="w-4 h-4" />
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaigns */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Campaigns</h2>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <Modal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setSelectedInfluencer(null);
        }}
        title="Start a Conversation"
      >
        {selectedInfluencer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  selectedInfluencer.profile_photo_url || "/default-avatar.png"
                }
                alt={selectedInfluencer.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{selectedInfluencer.full_name}</h3>
                <p className="text-sm text-gray-600">
                  {selectedInfluencer.bio}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Start a conversation with {selectedInfluencer.full_name} to
              discuss potential collaborations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChatModal(false);
                  setSelectedInfluencer(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={isCreatingChat}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreatingChat ? "Creating..." : "Start Chat"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
