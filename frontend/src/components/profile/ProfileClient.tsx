"use client";

import { useState, useEffect } from "react";
import { AmbassadorPortfolio } from "./AmbassadorPortfolio";
import { ClientCampaigns } from "./ClientCampaigns";
import { ProfileEditModal } from "./ProfileEditModal";
import { AddContentModal } from "../portfolio/AddContentModal";
import { CreateCampaignModal } from "../campaigns/CreateCampaignModal";
import { getClientCampaignsAction } from "@/app/(protected)/campaigns/actions";

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

interface ProfileClientProps {
  profile: any;
  ambassadorProfile: any;
  clientProfile: any;
  portfolioItems: PortfolioItem[];
  campaigns: CampaignDisplay[];
}

export function ProfileClient({
  profile,
  ambassadorProfile,
  clientProfile,
  portfolioItems,
  campaigns: initialCampaigns,
}: ProfileClientProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignDisplay[]>(initialCampaigns);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Fetch campaigns for client profiles
  useEffect(() => {
    if (profile.role === "client" && clientProfile) {
      setCampaignsLoading(true);
      getClientCampaignsAction()
        .then((result) => {
          if (result.ok) {
            // Transform the raw campaign data to match the CampaignDisplay interface
            const transformedCampaigns: CampaignDisplay[] = result.data.map((campaign: any) => ({
              id: campaign.id,
              title: campaign.title,
              status: campaign.status,
              budgetRange: `$${campaign.budget_min} - $${campaign.budget_max}`,
              ambassadorCount: campaign.max_ambassadors || 1,
              timeline: campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : 'No deadline',
              coverImage: undefined, // You can add cover image logic here if needed
            }));
            setCampaigns(transformedCampaigns);
          }
        })
        .catch((error) => {
          console.error('Error fetching campaigns:', error);
        })
        .finally(() => {
          setCampaignsLoading(false);
        });
    }
  }, [profile.role, clientProfile]);

  return (
    <>
      <div className="md:col-span-2">
        {profile.role === "ambassador" && ambassadorProfile ? (
          <AmbassadorPortfolio
            portfolioItems={portfolioItems}
            loading={false}
            onAddContent={() => setShowAddContentModal(true)}
          />
        ) : profile.role === "client" && clientProfile ? (
          <ClientCampaigns
            campaigns={campaigns}
            loading={campaignsLoading}
            onCreateCampaign={() => setShowCreateCampaignModal(true)}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profile Content
            </h2>
            <p className="text-gray-600">
              No profile content available. Please complete your profile setup.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditModal && (
        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            window.location.reload();
          }}
        />
      )}

      {showAddContentModal && ambassadorProfile && (
        <AddContentModal
          isOpen={showAddContentModal}
          onClose={() => setShowAddContentModal(false)}
          onContentSelected={() => {
            setShowAddContentModal(false);
            window.location.reload();
          }}
        />
      )}

      {showCreateCampaignModal && clientProfile && (
        <CreateCampaignModal
          isOpen={showCreateCampaignModal}
          onClose={() => setShowCreateCampaignModal(false)}
          onCampaignCreated={() => {
            setShowCreateCampaignModal(false);
            // Refresh campaigns instead of full page reload
            if (profile.role === "client" && clientProfile) {
              setCampaignsLoading(true);
              getClientCampaignsAction()
                .then((result) => {
                  if (result.ok) {
                    const transformedCampaigns: CampaignDisplay[] = result.data.map((campaign: any) => ({
                      id: campaign.id,
                      title: campaign.title,
                      status: campaign.status,
                      budgetRange: `$${campaign.budget_min} - $${campaign.budget_max}`,
                      ambassadorCount: campaign.max_ambassadors || 1,
                      timeline: campaign.deadline ? new Date(campaign.deadline).toLocaleDateString() : 'No deadline',
                      coverImage: undefined,
                    }));
                    setCampaigns(transformedCampaigns);
                  }
                })
                .catch((error) => {
                  console.error('Error refreshing campaigns:', error);
                })
                .finally(() => {
                  setCampaignsLoading(false);
                });
            }
          }}
        />
      )}
    </>
  );
}
