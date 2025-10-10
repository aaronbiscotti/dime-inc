"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileGuard } from "@/components/auth/ProfileGuard";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { AmbassadorSelection } from "@/components/campaigns/AmbassadorSelection";
import { ProfileEditModal } from "@/components/profile/ProfileEditModal";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { AmbassadorPortfolio } from "@/components/profile/AmbassadorPortfolio";
import { ClientCampaigns } from "@/components/profile/ClientCampaigns";
import { AddContentModal } from "@/components/portfolio/AddContentModal";
import { PortfolioItem, Campaign } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { campaignService } from "@/services/campaignService";
import { instagramService, InstagramMedia } from "@/services/instagramService";

export default function Profile() {
  const { profile, ambassadorProfile, clientProfile } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{
    id: string;
    campaign_title: string;
    campaign_description: string | null;
    budget: number | null;
    timeline: string | null;
    requirements: string | null;
  } | null>(null);
  const [showAmbassadorSelection, setShowAmbassadorSelection] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);

  // Fetch real data from database
  useEffect(() => {
    const fetchData = async () => {
      if (!profile || (!ambassadorProfile && !clientProfile)) return;

      try {
        if (profile.role === "ambassador" && ambassadorProfile) {
          // Fetch portfolio items for ambassador
          const { data: portfolios, error } = await supabase
            .from("portfolios")
            .select("*")
            .eq("ambassador_id", ambassadorProfile.id)
            .order("created_at", { ascending: false });

          if (!error && portfolios) {
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
              views: (portfolio.results as any)?.views?.toString() || undefined,
              likes: (portfolio.results as any)?.likes?.toString() || undefined,
              engagement: (portfolio.results as any)?.engagement?.toString() || undefined,
            }));
            setPortfolioItems(items);
          }
        } else if (profile.role === "client" && clientProfile) {
          // Fetch campaigns for client using campaign service
          const { data: campaignBids, error } = await campaignService.getCampaignsForClient(clientProfile.id);

          if (!error && campaignBids) {
            // Convert database bids to Campaign format
            const clientCampaigns: Campaign[] = campaignBids.map((bid) => ({
              id: bid.id,
              title: bid.campaign_title,
              status: bid.status === "accepted" ? "completed" : "active",
              budgetRange: bid.budget ? `$${bid.budget}` : "TBD",
              ambassadorCount: 0, // Open campaigns don't have ambassadors yet
              timeline: bid.timeline || "TBD",
              coverImage: undefined,
            }));
            setCampaigns(clientCampaigns);
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
      // Save each selected media item to portfolio
      for (const media of mediaItems) {
        // Fetch insights for the media
        const insightsResponse = await fetch(`/api/instagram/insights/${media.id}`);
        const { data: insights } = await insightsResponse.json();

        // Create portfolio item
        await supabase.from("portfolios").insert({
          ambassador_id: ambassadorProfile.id,
          title: media.caption || `Instagram Reel - ${new Date(media.timestamp).toLocaleDateString()}`,
          description: media.caption || null,
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
      const { data: portfolios } = await supabase
        .from("portfolios")
        .select("*")
        .eq("ambassador_id", ambassadorProfile.id)
        .order("created_at", { ascending: false });

      if (portfolios) {
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
          views: (portfolio.results as any)?.views?.toString() || undefined,
          likes: (portfolio.results as any)?.likes?.toString() || undefined,
          engagement: (portfolio.results as any)?.engagement?.toString() || undefined,
        }));
        setPortfolioItems(items);
      }
    } catch (error) {
      console.error("Error saving content:", error);
    }
  };

  return (
    <ProfileGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        {/* Only render profile content if profile exists */}
        {profile && (
          <div className="max-w-7xl mx-auto p-6">
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
                  onCreateCampaign={() => setShowCampaignForm(true)}
                />
              )}
            </div>
          </div>
        )}

        {/* Profile Edit Modal */}
        {showProfileEditModal && (
          <ProfileEditModal
            isOpen={showProfileEditModal}
            onClose={() => setShowProfileEditModal(false)}
            onSave={(data) => {
              console.log('Profile updated successfully:', data);
            }}
          />
        )}

        {/* Campaign Form Modal */}
        {showCampaignForm && (
          <CampaignForm
            onClose={() => setShowCampaignForm(false)}
            onCampaignCreated={(newCampaign) => {
              setCampaigns(prev => [newCampaign, ...prev]);
            }}
            onOpenAmbassadorSelection={(campaign) => {
              setSelectedCampaign(campaign);
              setShowAmbassadorSelection(true);
            }}
          />
        )}

        {/* Ambassador Selection Modal */}
        {showAmbassadorSelection && selectedCampaign && (
          <AmbassadorSelection
            campaign={selectedCampaign}
            onClose={() => {
              setShowAmbassadorSelection(false);
              setSelectedCampaign(null);
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
      </div>
    </ProfileGuard>
  );
}
