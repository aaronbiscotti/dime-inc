"use client";

import React, { useState, useEffect } from "react";
import { Search, Heart, ChevronDown } from "lucide-react";
import { Tables } from "@/types/database";
import { exploreService } from "@/services/exploreService";
import { chatService } from "@/services/chatService";
import { campaignService } from "@/services/campaignService";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignCard } from "@/components/explore/CampaignCard";
import { Modal } from "@/components/ui/modal";

// Type alias for campaigns
type Campaign = Tables<"campaigns">;

// Interface can be added back if userRole is needed for role-based filtering later

interface Influencer {
  id: string;
  userId: string; // Added to track the user_id for chat creation
  name: string;
  handle: string | null;
  platforms: string[];
  followers: string | null;
  engagement: string | null;
  categories: string[];
  avatar: string | null;
  associatedWith?: string | null;
  // Additional fields for enhanced display
  bio?: string | null;
  location?: string | null;
  instagramHandle?: string | null;
  tiktokHandle?: string | null;
  twitterHandle?: string | null;
}

interface CampaignWithClient extends Tables<"campaigns"> {
  client_profiles?: {
    company_name: string;
    logo_url: string | null;
  };
}

export function ExploreInterface() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Most relevant");
  const [filtersOpen, setFiltersOpen] = useState(true); // Start open by default
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set()); // Track favorited ambassadors
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedAmbassador, setSelectedAmbassador] = useState<{
    id: string;
    userId: string;
    name: string;
  } | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { user, profile, clientProfile } = useAuth();

  const filters = [
    "Most relevant",
    "Highest engagement",
    "Newest joined",
    "All Categories",
  ];
  const isAmbassador = profile?.role === "ambassador";

  // Fetch ambassadors from API (for clients)
  useEffect(() => {
    const fetchAmbassadors = async () => {
      if (isAmbassador) return; // Skip if user is an ambassador

      try {
        setLoading(true);

        const ambassadorProfiles = await exploreService.getAmbassadors();

        console.log(
          "Loaded",
          ambassadorProfiles?.length || 0,
          "ambassador profiles"
        );

        if (ambassadorProfiles && ambassadorProfiles.length > 0) {
          console.log("Raw ambassador profiles data:", ambassadorProfiles[0]); // Debug log
          const mappedInfluencers: Influencer[] = ambassadorProfiles.map(
            (profile, index) => {
              const prof = profile as Record<string, unknown>;
              console.log(`Profile ${index}:`, prof); // Debug log for each profile

              // Create platforms array from available handles
              const platforms: string[] = [];
              if (prof.instagram_handle) platforms.push("Instagram");
              if (prof.tiktok_handle) platforms.push("TikTok");
              if (prof.twitter_handle) platforms.push("Twitter");

              // Use niche as categories, fallback to empty array
              const categories = (prof.niche as string[]) || [];

              // Format handle, avoiding double @ if it already exists
              const formatHandle = (handle: string | null) => {
                if (!handle) return null;
                return handle.startsWith("@") ? handle : `@${handle}`;
              };

              return {
                id: (prof.profileId as string) || (prof.id as string) || `ambassador-${index}`, // Ensure unique ID
                userId: (prof.profiles as any)?.id || prof.id as string, // Use profiles.id for chat functionality
                name: (prof.name as string) || (prof.full_name as string) || "Unknown Ambassador",
                handle: formatHandle(prof.instagram_handle as string | null),
                platforms,
                followers: null, // We don't have follower data in the current schema
                engagement: null, // We don't have engagement data in the current schema
                categories,
                avatar: prof.profile_photo_url as string,
                associatedWith: null, // We don't have association data in the current schema
                // Additional fields
                bio: prof.bio as string | null,
                location: prof.location as string | null,
                instagramHandle: prof.instagram_handle as string | null,
                tiktokHandle: prof.tiktok_handle as string | null,
                twitterHandle: prof.twitter_handle as string | null,
              };
              
              console.log(`Mapped influencer ${index}:`, {
                name: prof.full_name,
                instagramHandle: prof.instagram_handle,
                tiktokHandle: prof.tiktok_handle,
                twitterHandle: prof.twitter_handle,
                bio: prof.bio,
                location: prof.location
              }); // Debug log for mapped data
            }
          );

          setInfluencers(mappedInfluencers);
          console.log(
            `Loaded ${mappedInfluencers.length} ambassadors for display`
          );
        } else {
          // Create mock data for testing if no ambassadors exist
          const mockInfluencers: Influencer[] = [
            {
              id: "mock-1",
              userId: user?.id || "test-user-id", // Use current user for testing
              name: "Test Ambassador",
              handle: "@testambassador",
              platforms: ["Instagram", "TikTok"],
              followers: "10K",
              engagement: "5.2%",
              categories: ["Lifestyle", "Fashion"],
              avatar: null,
              associatedWith: null,
            },
          ];
          setInfluencers(mockInfluencers);
          console.log(
            "Using mock data: no ambassador profiles found in database"
          );
        }
      } catch (error) {
        console.error("Error fetching ambassadors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAmbassadors();
  }, [isAmbassador, user]);

  // Fetch active campaigns (for ambassadors)
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!isAmbassador) return; // Skip if user is not an ambassador

      try {
        setLoading(true);

        const { data: activeCampaigns, error } =
          await campaignService.getAllOpenCampaigns();

        console.log("Loaded", activeCampaigns?.length || 0, "active campaigns");

        if (error) {
          console.error("Error fetching campaigns:", error);
          return;
        }

        if (activeCampaigns) {
          setCampaigns(activeCampaigns as CampaignWithClient[]);
          console.log(
            `Loaded ${activeCampaigns.length} active campaigns for display`
          );
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [isAmbassador]);

  const handleToggleFavorite = (ambassadorId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(ambassadorId)) {
        newFavorites.delete(ambassadorId);
      } else {
        newFavorites.add(ambassadorId);
      }
      return newFavorites;
    });
  };

  const handleInvite = async (
    ambassadorUserId: string,
    ambassadorName: string,
    ambassadorProfileId: string
  ) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    // Set the selected ambassador and open the modal
    setSelectedAmbassador({
      id: ambassadorProfileId,
      userId: ambassadorUserId,
      name: ambassadorName,
    });

    // Fetch active campaigns for the dropdown
    try {
      if (!clientProfile?.id) {
        console.error("No client profile available");
        setActiveCampaigns([]);
        return;
      }
      const result = await campaignService.getMyClientCampaigns();
      if (result.error || !result.data) {
        console.error("Error fetching campaigns:", result.error);
        setActiveCampaigns([]);
        return;
      }
      const active = result.data.filter((c) => c.status === "active");
      setActiveCampaigns(active);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setActiveCampaigns([]);
    }

    // Reset form state
    setSelectedCampaignId("");
    setInviteMessage("");
    setShowInviteModal(true);
  };

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId);

    // Find the selected campaign and load its proposal message
    const campaign = activeCampaigns.find((c) => c.id === campaignId);
    if (campaign && campaign.proposal_message) {
      setInviteMessage(campaign.proposal_message);
    } else {
      setInviteMessage("");
    }
  };

  const handleSendInvite = async () => {
    if (!user || !selectedAmbassador) {
      console.error("User not authenticated or no ambassador selected");
      return;
    }

    console.log("Starting enhanced invite process:", {
      currentUser: user.id,
      ambassadorId: selectedAmbassador.id,
      ambassadorUserId: selectedAmbassador.userId,
      ambassadorName: selectedAmbassador.name,
      selectedCampaignId,
    });

    setInvitingId(selectedAmbassador.userId);

    try {
      // Use the new enhanced invite workflow
      const result = await chatService.createEnhancedInvite({
        ambassador_id: selectedAmbassador.id,
        ambassador_user_id: selectedAmbassador.userId,
        campaign_id: selectedCampaignId!,
        invite_message: inviteMessage?.trim(),
      });

      if (result.error) {
        console.error("Enhanced invite failed:", result.error);
        
        // Handle specific error cases
        if (result.error.message?.includes("already been added")) {
          alert("This ambassador has already been added to this campaign. Please select a different ambassador or campaign.");
        } else {
          alert(`Failed to send invite: ${result.error.message}`);
        }
        return;
      }

      console.log("Enhanced invite completed successfully:", result.data);

      // Close modal and redirect to the specific chat
      setShowInviteModal(false);
      if (result.data?.chatRoom?.id) {
        router.push(`/chats?chat=${result.data.chatRoom.id}`);
      }
    } catch (error) {
      console.error("Unexpected error during invite:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setInvitingId(null);
    }
  };

  // Filter and search logic
  const filteredInfluencers = influencers.filter((influencer) => {
    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.categories.some((category) =>
        category.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (influencer.handle &&
        influencer.handle.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchesCategory =
      activeFilter === "All Categories" ||
      activeFilter === "Most relevant" ||
      influencer.categories.some(
        (category) => category.toLowerCase() === activeFilter.toLowerCase()
      );

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          {isAmbassador
            ? "Discover Active Campaigns"
            : "Find the right influencers for your brand"}
        </h1>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={
              isAmbassador ? "Search campaigns..." : "Search keywords..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
          />
        </div>

        {/* Filter Buttons - Only show for clients */}
        {!isAmbassador && (
          <div className="flex justify-center gap-3 mb-8 flex-wrap">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-[#f5d82e] text-black shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters - Only show for clients */}
        {!isAmbassador && (
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-300 p-5">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-4"
              >
                Influencer Type Filters
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    filtersOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {filtersOpen && (
                <div className="space-y-2.5">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      UGC (New Account Farmers)
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Influencers in network
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Influencer search
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">
                      Followers
                    </span>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={isAmbassador ? "w-full" : "flex-1"}>
          {loading ? (
            isAmbassador ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-300 p-6"
                  >
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg border border-gray-300 p-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : isAmbassador ? (
            // Campaign Grid for Ambassadors
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600">
                    No active campaigns available at the moment.
                  </p>
                </div>
              ) : (
                campaigns
                  .filter(
                    (campaign) =>
                      searchQuery === "" ||
                      campaign.title
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      campaign.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                  )
                  .map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      clientName={campaign.client_profiles?.company_name}
                      clientLogo={
                        campaign.client_profiles?.logo_url || undefined
                      }
                    />
                  ))
              )}
            </div>
          ) : (
            // Ambassador List for Clients
            <div className="space-y-4">
              {filteredInfluencers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">
                    {searchQuery || activeFilter !== "All Categories"
                      ? "No ambassadors found matching your criteria."
                      : "No ambassadors found."}
                  </p>
                </div>
              ) : (
                filteredInfluencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    className="bg-white rounded-xl border border-gray-300 p-6 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Avatar */}
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {influencer.avatar ? (
                            <img
                              src={influencer.avatar}
                              alt={influencer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-medium text-lg">
                              {influencer.name
                                ?.split(" ")
                                ?.reduce((initials: string, name: string) => initials + (name[0] || ""), "") || "?"}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="mb-3">
                            <h3 className="font-semibold text-gray-900 text-lg mb-1">
                              {influencer.name || "Unknown Ambassador"}
                            </h3>
                            
                            {/* Bio */}
                            {influencer.bio && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {influencer.bio}
                              </p>
                            )}

                            {/* Location */}
                            {influencer.location && (
                              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                <span>{influencer.location}</span>
                              </div>
                            )}

                            {/* Social Media Handles */}
                            <div className="flex items-center gap-3 text-sm mb-2">
                              {influencer.instagramHandle && (
                                <a
                                  href={`https://instagram.com/${influencer.instagramHandle.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                  </svg>
                                  <span className="font-medium">{influencer.instagramHandle}</span>
                                </a>
                              )}
                              {influencer.tiktokHandle && (
                                <a
                                  href={`https://tiktok.com/@${influencer.tiktokHandle.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-gray-600 hover:text-black transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                                  </svg>
                                  <span className="font-medium">{influencer.tiktokHandle}</span>
                                </a>
                              )}
                              {influencer.twitterHandle && (
                                <a
                                  href={`https://twitter.com/${influencer.twitterHandle.replace('@', '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                  </svg>
                                  <span className="font-medium">{influencer.twitterHandle}</span>
                                </a>
                              )}
                            </div>

                            {/* Categories/Niche */}
                            {influencer.categories.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {influencer.categories.slice(0, 3).map((category, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-[#f5d82e] bg-opacity-20 text-[#f5d82e] text-xs font-medium rounded-full"
                                  >
                                    {category}
                                  </span>
                                ))}
                                {influencer.categories.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                    +{influencer.categories.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 ml-4">
                        <button
                          onClick={() => handleToggleFavorite(influencer.id)}
                          className="p-2.5 rounded-lg border border-gray-300 hover:border-gray-300 transition-colors"
                        >
                          <Heart
                            className={`w-5 h-5 transition-colors ${
                              favorites.has(influencer.id)
                                ? "fill-red-500 text-red-500"
                                : "text-gray-400 hover:text-red-500"
                            }`}
                          />
                        </button>
                        <button
                          onClick={() =>
                            handleInvite(
                              influencer.userId,
                              influencer.name,
                              influencer.id
                            )
                          }
                          disabled={invitingId === influencer.userId}
                          className="bg-[#f5d82e] hover:bg-[#e5c820] text-black font-medium px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                          {invitingId === influencer.userId
                            ? "Inviting..."
                            : "Invite"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invite to Campaign Modal */}
      <Modal
        isOpen={showInviteModal && !!selectedAmbassador}
        onClose={() => setShowInviteModal(false)}
        title="Invite to Campaign"
        maxWidth="md"
      >
        {/* Ambassador Info */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {selectedAmbassador?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {selectedAmbassador?.name}
              </p>
              <p className="text-sm text-gray-500">Brand Ambassador</p>
            </div>
          </div>
        </div>

        {/* Campaign Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a campaign
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => handleCampaignSelect(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
            disabled={activeCampaigns.length === 0}
          >
            <option value="">
              {activeCampaigns.length === 0
                ? "No active campaigns available"
                : "Select a job"}
            </option>
            {activeCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.title}
              </option>
            ))}
          </select>
          {activeCampaigns.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              You need to create and activate a campaign first.
            </p>
          )}
        </div>

        {/* Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={inviteMessage}
            onChange={(e) => setInviteMessage(e.target.value)}
            placeholder="Write your message..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent resize-none"
            rows={4}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowInviteModal(false)}
            disabled={invitingId !== null}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendInvite}
            disabled={invitingId !== null || !inviteMessage.trim()}
            className="flex-1 px-4 py-2.5 bg-[#f5d82e] hover:bg-[#e5c820] text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {invitingId !== null ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
        maxWidth="sm"
      >
        <div className="text-center">
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
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="px-6 py-2 bg-[#f5d82e] text-black rounded-lg font-medium hover:bg-[#e5c820] transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
