"use client";

import React, { useEffect, useState } from "react";
import { Search, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Modal } from "@/components/ui/modal";
import { getAmbassadorsAction, getClientsAction } from "@/app/(protected)/explore/actions";
import { inviteAmbassadorToCampaignAction } from "@/app/(protected)/campaigns/actions";
import { ClientCard } from "@/components/explore/ClientCard";

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
  userRole?: "client" | "ambassador";
  initialAmbassadors: Influencer[];
  initialCampaigns: Campaign[];
  initialClients?: any[];
}

export default function ExploreInterfaceClient({
  userRole = "client",
  initialAmbassadors,
  initialCampaigns,
  initialClients = [],
}: ExploreInterfaceClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState<
    "Most relevant" | "Highest engagement" | "Newest joined"
  >("Most relevant");
  const [ambassadors, setAmbassadors] = useState(initialAmbassadors);
  const [clients, setClients] = useState(initialClients);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [lastPageCount, setLastPageCount] = useState(
    (userRole === "ambassador" ? initialClients.length : initialAmbassadors.length) || 0
  );

  const { userRole: ctxRole } = useAuth();
  const router = useRouter();

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      if (userRole === "ambassador") {
        // Search for clients
        const orderBy = activeSort === "Newest joined" ? "created_at" : "company_name";
        const clientsResult = await getClientsAction({
          search: searchQuery,
          orderBy,
          orderDir: "desc",
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });

        if (clientsResult.ok) {
          setClients(clientsResult.data);
          setLastPageCount(clientsResult.data.length || 0);
        }
      } else {
        // Search for ambassadors
        const orderBy =
          activeSort === "Highest engagement"
            ? ("engagement_rate" as const)
            : ("created_at" as const);

        const ambassadorsResult = await getAmbassadorsAction({
          search: searchQuery,
          orderBy,
          orderDir: "desc",
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });

        if (ambassadorsResult.ok) {
          setAmbassadors(ambassadorsResult.data);
          setLastPageCount(ambassadorsResult.data.length || 0);
        }
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch when the user actively changes controls (not initial mount)
    if (page !== 1 || activeSort !== "Most relevant" || searchQuery) {
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSort, page, searchQuery]);

  // Fallback: Load data if initial data is empty
  useEffect(() => {
    if (userRole === "client" && ambassadors.length === 0 && initialAmbassadors.length === 0) {
      handleSearch();
    }
    if (userRole === "ambassador" && clients.length === 0 && initialClients.length === 0) {
      handleSearch();
    }
  }, [userRole, ambassadors.length, clients.length, initialAmbassadors.length, initialClients.length]);

  const handleStartChat = async (influencer: Influencer) => {
    setSelectedInfluencer(influencer);
    setShowChatModal(true);
  };

  const handleCreateChat = async () => {
    if (!selectedInfluencer || !invitationMessage.trim() || !selectedCampaignId) return;

    setIsCreatingChat(true);
    try {
      const formData = new FormData();
      formData.append("campaignId", selectedCampaignId);
      formData.append("ambassadorProfileId", selectedInfluencer.id);
      formData.append("message", invitationMessage.trim());

      const result = await inviteAmbassadorToCampaignAction(null, formData);

      if (result.ok) {
        setShowChatModal(false);
        setSelectedInfluencer(null);
        setInvitationMessage("");
        setSelectedCampaignId("");
        // Navigate to unified chats page with query param
        router.push(`/chats?chat=${result.data.chatId}`);
      } else {
        console.error("Failed to create chat:", result.error);
      }
    } catch (error) {
      console.error("Chat creation failed:", error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-medium text-gray-900">
          {userRole === "ambassador" 
            ? "Find brands to collaborate with" 
            : "Find the right influencers for your brand"
          }
        </h1>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search keywords..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  handleSearch();
                }
              }}
            />
          </div>
          <button
            onClick={() => {
              setPage(1);
              handleSearch();
            }}
            className="px-5 py-2 rounded-full bg-[#f5d82e] text-black font-medium hover:bg-[#e5c820]"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        <div className="flex gap-2">
          {(userRole === "ambassador" 
            ? ["Most relevant", "Company name", "Newest joined"] as const
            : ["Most relevant", "Highest engagement", "Newest joined"] as const
          ).map((label) => (
            <button
              key={label}
              onClick={() => {
                setActiveSort(label as any);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm border ${
                activeSort === label
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-300 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              {userRole === "ambassador" ? "Brand Filters" : "Influencer Type Filters"}
            </h3>
            <div className="space-y-2 text-sm">
              {userRole === "ambassador" ? [
                "Technology",
                "Fashion",
                "Food & Beverage",
                "Health & Wellness",
                "Entertainment",
                "Sports",
              ].map((label) => (
                <label key={label} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" disabled />
                  <span className="text-gray-700">{label}</span>
                </label>
              )) : [
                "UGC (New Account Farmers)",
                "Influencers in network",
                "Influencer search",
                "Followers",
              ].map((label) => (
                <label key={label} className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" disabled />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Results List */}
        <section className="space-y-3">
          {userRole === "ambassador"
            ? // Show clients
              (clients || []).map((c) => {
                const client = {
                  id: c.user_id || c.id,
                  companyName: c.company_name || "Client",
                  industry: c.industry || "General",
                  description: c.company_description || "No description available",
                  location: c.website || "Location not specified",
                  activeCampaigns: 0, // TODO: Calculate from campaigns table
                  budgetRange: "Contact for details",
                  rating: 5,
                  completedPartnerships: 0, // TODO: Calculate from completed campaigns
                };
                return <ClientCard key={`${c.id}`} client={client} />;
              })
            : // Show ambassadors for clients
              ambassadors.map((influencer) => (
                <div
                  key={influencer.id}
                className="bg-white rounded-xl border border-gray-300 p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={influencer.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(influencer.full_name)}&background=f5d82e&color=000000&size=48`}
                        alt={influencer.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {influencer.full_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {[
                            influencer.twitter_handle && `@${influencer.twitter_handle} · Twitter`,
                            influencer.instagram_handle && `@${influencer.instagram_handle} · Instagram`,
                            influencer.tiktok_handle && `@${influencer.tiktok_handle} · TikTok`,
                          ]
                            .filter(Boolean)
                            .join("  ·  ")}
                        </div>
                        {influencer.niche && influencer.niche.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {influencer.niche.slice(0, 4).map((n) => (
                              <span
                                key={n}
                                className="px-2 py-0.5 bg-gray-100 text-[11px] rounded-full text-gray-700"
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        aria-label="favorite"
                        className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
                        disabled
                      >
                        <Heart className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartChat(influencer)}
                        className="px-5 py-2 rounded-full bg-[#f5d82e] text-black font-medium hover:bg-[#e5c820]"
                      >
                        Invite to Campaign
                      </button>
                    </div>
                  </div>
                </div>
              ))}

          {/* Pagination - only show if there are more than 10 items */}
          {lastPageCount >= pageSize && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={page === 1}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, Math.ceil(lastPageCount / pageSize)) }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 text-sm rounded-full border ${
                      p === page
                        ? "bg-[#f5d82e] border-[#f5d82e] text-black"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => p + 1)}
                className="w-7 h-7 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={lastPageCount < pageSize}
              >
                ›
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Invitation Modal */}
      <Modal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false);
          setSelectedInfluencer(null);
          setInvitationMessage("");
          setSelectedCampaignId("");
        }}
        title="Invite to Campaign"
      >
        {selectedInfluencer && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  selectedInfluencer.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInfluencer.full_name)}&background=f5d82e&color=000000&size=48`
                }
                alt={selectedInfluencer.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-medium">{selectedInfluencer.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedInfluencer.bio}</p>
                {selectedInfluencer.niche && selectedInfluencer.niche.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedInfluencer.niche.join(", ")}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Campaign
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
              >
                <option value="">Choose a campaign...</option>
                {initialCampaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={invitationMessage}
                onChange={(e) => setInvitationMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
                rows={4}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChatModal(false);
                  setSelectedInfluencer(null);
                  setInvitationMessage("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateChat}
                disabled={isCreatingChat || !invitationMessage.trim() || !selectedCampaignId}
                className="flex-1 px-4 py-2 bg-[#f5d82e] text-black rounded-lg hover:bg-[#e5c820] disabled:opacity-50 disabled:bg-gray-300"
              >
                {isCreatingChat ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
