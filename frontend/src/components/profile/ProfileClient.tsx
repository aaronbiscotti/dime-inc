"use client";

import { useState } from "react";
import { AmbassadorPortfolio } from "./AmbassadorPortfolio";
import { ClientCampaigns } from "./ClientCampaigns";
import { ProfileEditModal } from "./ProfileEditModal";
import { AddContentModal } from "../portfolio/AddContentModal";
import { CreateCampaignModal } from "../campaigns/CreateCampaignModal";

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
  campaigns,
}: ProfileClientProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContentModal, setShowAddContentModal] = useState(false);
  const [showCreateCampaignModal, setShowCreateCampaignModal] = useState(false);

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
            loading={false}
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
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
