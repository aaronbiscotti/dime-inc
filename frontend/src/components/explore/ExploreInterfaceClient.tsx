"use client";

import React, { useEffect, useState } from "react";
import { Search, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Modal } from "@/components/ui/modal";
import { getAmbassadorsAction } from "@/app/(protected)/explore/actions";
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
}: ExploreInterfaceClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSort, setActiveSort] = useState<
    "Most relevant" | "Highest engagement" | "Newest joined"
  >("Most relevant");
  const [ambassadors, setAmbassadors] = useState(initialAmbassadors);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<Influencer | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { userRole } = useAuth();
  const router = useRouter();

  const handleSearch = async () => {
    setIsLoading(true);
    try {
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
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run when sort/page changes
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSort, page]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Find the right influencers for your brand
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
          {(["Most relevant", "Highest engagement", "Newest joined"] as const).map(
            (label) => (
              <button
                key={label}
                onClick={() => {
                  setActiveSort(label);
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
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-300 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Influencer Type Filters
            </h3>
            <div className="space-y-2 text-sm">
              {[
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

        {/* Influencer List */}
        <section className="space-y-3">
          {ambassadors.map((influencer) => (
            <div
              key={influencer.id}
              className="bg-white rounded-xl border border-gray-300 p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={influencer.profile_photo_url || "/default-avatar.png"}
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
                    Invite
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={page === 1}
            >
              ‹
            </button>
            {Array.from({ length: 5 }, (_, i) => i + Math.max(1, page - 2)).map(
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
              className="w-7 h-7 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </section>
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
                <p className="text-sm text-gray-600">{selectedInfluencer.bio}</p>
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

