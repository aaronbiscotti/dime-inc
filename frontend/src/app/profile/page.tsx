"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { AmbassadorPortfolio } from "@/components/profile/AmbassadorPortfolio";
import { ClientCampaigns } from "@/components/profile/ClientCampaigns";
import { AddContentModal } from "@/components/portfolio/AddContentModal";
import { campaignService } from "@/services/campaignService";
import { portfolioService } from "@/services/portfolioService";
import { InstagramMedia } from "@/services/instagramService";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";

// Display types for UI
interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  platform: "instagram" | "tiktok";
  postUrl: string;
  thumbnailUrl?: string;
  date: string;
  views?: string;
  likes?: string;
  engagement?: string;
}

interface CampaignDisplay {
  id: string;
  title: string;
  status: "draft" | "active" | "completed" | "cancelled";
  budgetRange: string;
  ambassadorCount: number;
  timeline: string;
  coverImage?: string;
}

export default function Profile() {
  const router = useRouter();
  const { profile, ambassadorProfile, clientProfile } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      if (!profile || (!ambassadorProfile && !clientProfile)) return;

      try {
        if (profile.role === "ambassador" && ambassadorProfile) {
          // Fetch portfolio items for ambassador using API
          try {
            const portfolios = await portfolioService.getAmbassadorPortfolio(
              ambassadorProfile.id
            );

            // Convert database portfolios to PortfolioItem format
            const items: PortfolioItem[] = portfolios.map((portfolio) => ({
              id: portfolio.id,
              title: portfolio.title,
              description: portfolio.description || undefined,
              platform: portfolio.instagram_url
                ? "instagram"
                : portfolio.tiktok_url
                ? "tiktok"
                : ("instagram" as const),
              postUrl: portfolio.instagram_url || portfolio.tiktok_url || "#",
              thumbnailUrl:
                (portfolio.media_urls as string[])?.[0] || undefined,
              date: new Date(
                portfolio.campaign_date || portfolio.created_at || new Date()
              ).toLocaleDateString(),
              views:
                (
                  portfolio.results as Record<string, unknown>
                )?.views?.toString() || undefined,
              likes:
                (
                  portfolio.results as Record<string, unknown>
                )?.likes?.toString() || undefined,
              engagement:
                (
                  portfolio.results as Record<string, unknown>
                )?.engagement?.toString() || undefined,
            }));
            setPortfolioItems(items);
          } catch (error) {
            console.error("Error fetching portfolio:", error);
          }
        } else if (profile.role === "client" && clientProfile) {
          // Fetch campaigns for client using campaign service
          try {
            const result = await campaignService.getMyClientCampaigns();

            if (result.error || !result.data) {
              console.error("Error fetching campaigns:", result.error);
              return;
            }

            // Convert database campaigns to UI Campaign format
            const clientCampaigns: CampaignDisplay[] = await Promise.all(
              result.data.map(async (campaign) => {
                // Fetch ambassador count for each campaign
                let ambassadorCount = 0;
                try {
                  const ambassadorsResult = await campaignService.getCampaignAmbassadors(campaign.id);
                  ambassadorCount = ambassadorsResult.data?.length || 0;
                } catch (error) {
                  console.warn(`Could not fetch ambassadors for campaign ${campaign.id}:`, error);
                }

                return {
                  id: campaign.id,
                  title: campaign.title,
                  status: campaign.status as
                    | "draft"
                    | "active"
                    | "completed"
                    | "cancelled",
                  budgetRange: `$${campaign.budget_min.toFixed(
                    2
                  )} - $${campaign.budget_max.toFixed(2)}`,
                  ambassadorCount,
                  timeline: campaign.deadline
                    ? new Date(campaign.deadline).toLocaleDateString()
                    : "TBD",
                  coverImage: undefined,
                };
              })
            );
            setCampaigns(clientCampaigns);
          } catch (error) {
            console.error("Error fetching campaigns:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profile, ambassadorProfile, clientProfile]);

  // Handle content addition from Instagram
  const handleContentSelected = async (mediaItems: InstagramMedia[]) => {
    if (!ambassadorProfile) return;

    try {
      // Save each selected media item to portfolio using API
      for (const media of mediaItems) {
        // Fetch insights for the media
        const insightsResponse = await fetch(
          `/api/instagram/insights/${media.id}`
        );
        const { data: insights } = await insightsResponse.json();

        // Create portfolio item via API
        await portfolioService.createPortfolio({
          title:
            media.caption ||
            `Instagram Reel - ${new Date(
              media.timestamp
            ).toLocaleDateString()}`,
          description: media.caption || undefined,
          instagram_url: media.permalink,
          media_urls: [media.media_url],
          campaign_date: media.timestamp,
          results: {
            views: insights?.plays || 0,
            likes: insights?.likes || 0,
            engagement: insights?.total_interactions || 0,
          },
        });
      }

      // Refresh portfolio items
      const portfolios = await portfolioService.getAmbassadorPortfolio(
        ambassadorProfile.id
      );

      const items: PortfolioItem[] = portfolios.map((portfolio) => ({
        id: portfolio.id,
        title: portfolio.title,
        description: portfolio.description || undefined,
        platform: portfolio.instagram_url ? "instagram" : "tiktok",
        postUrl: portfolio.instagram_url || portfolio.tiktok_url || "#",
        thumbnailUrl: (portfolio.media_urls as string[])?.[0] || undefined,
        date: new Date(
          portfolio.campaign_date || portfolio.created_at || new Date()
        ).toLocaleDateString(),
        views:
          (portfolio.results as Record<string, unknown>)?.views?.toString() ||
          undefined,
        likes:
          (portfolio.results as Record<string, unknown>)?.likes?.toString() ||
          undefined,
        engagement:
          (
            portfolio.results as Record<string, unknown>
          )?.engagement?.toString() || undefined,
      }));
      setPortfolioItems(items);
    } catch (error) {
      console.error("Error saving content:", error);
    }
  };

  const handleCampaignCreated = async (campaign: Record<string, unknown>) => {
    // Refresh campaigns list after creation
    if (clientProfile) {
      try {
        const result = await campaignService.getMyClientCampaigns();
        if (result.data) {
          const clientCampaigns: CampaignDisplay[] = result.data.map((c) => ({
            id: c.id,
            title: c.title,
            status: c.status as "draft" | "active" | "completed" | "cancelled",
            budgetRange: `$${c.budget_min.toFixed(2)} - $${c.budget_max.toFixed(
              2
            )}`,
            ambassadorCount: 0,
            timeline: c.deadline
              ? new Date(c.deadline).toLocaleDateString()
              : "TBD",
            coverImage: undefined,
          }));
          setCampaigns(clientCampaigns);
        }
      } catch (error) {
        console.error("Error refreshing campaigns:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-300 overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-200"></div>
                <div className="px-6 -mt-12 relative z-10">
                  <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white"></div>
                </div>
                <div className="px-6 pb-6 mt-4 space-y-4">
                  <div className="h-7 bg-gray-200 rounded w-40 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side Skeleton */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-300 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Info */}
          <ProfileSidebar
            profile={profile}
            ambassadorProfile={ambassadorProfile}
            clientProfile={clientProfile}
            campaignCount={campaigns.length}
            onEditProfile={() => setShowProfileEditModal(true)}
          />

          {/* Right Side - Portfolio/Campaign Grid */}
          {profile.role === "ambassador" ? (
            <AmbassadorPortfolio
              portfolioItems={portfolioItems}
              loading={loading}
              onAddContent={() => setShowAddContentModal(true)}
            />
          ) : (
            <ClientCampaigns
              campaigns={campaigns}
              loading={loading}
              onCreateCampaign={() => setShowCreateCampaignModal(true)}
            />
          )}
        </div>
      </div>

        {/* Profile Edit Modal */}
        {showProfileEditModal && (
          <ProfileEditModal
            isOpen={showProfileEditModal}
            onClose={() => setShowProfileEditModal(false)}
            onSave={(data) => {
              console.log("Profile updated successfully:", data);
            }}
          />
        )}

        {/* Add Content Modal */}
        {showAddContentModal && (
          <AddContentModal
            isOpen={showAddContentModal}
            onClose={() => setShowAddContentModal(false)}
            onContentSelected={handleContentSelected}
          />
        )}

        {/* Create Campaign Modal */}
        <CreateCampaignModal
          isOpen={showCreateCampaignModal}
          onClose={() => setShowCreateCampaignModal(false)}
          onCampaignCreated={handleCampaignCreated}
        />
      </div>
  );
}
