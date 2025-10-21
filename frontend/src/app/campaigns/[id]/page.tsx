"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { campaignService } from "@/services/campaignService";
import { Campaign, CampaignStatus } from "@/types/database";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Trash2,
  CheckCircle,
  XCircle,
  Edit,
  X,
  Check,
} from "lucide-react";

export default function CampaignDetails() {
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCampaign, setEditedCampaign] = useState<Campaign | null>(null);
  const router = useRouter();
  const params = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const campaignId = params.id as string;

  useEffect(() => {
    const loadCampaign = async () => {
      // Wait for auth to finish loading
      if (authLoading) return;

      try {
        // Check authentication
        if (!user) {
          router.push("/login/client");
          return;
        }

        // Verify client role
        if (profile?.role !== "client") {
          router.push("/dashboard");
          return;
        }

        // Load campaign
        const result = await campaignService.getCampaign(campaignId);
        if (result.error || !result.data) {
          console.error("Error loading campaign:", result.error);
          router.push("/campaigns");
          return;
        }
        setCampaign(result.data);
        setEditedCampaign(result.data);
      } catch (error) {
        console.error("Error loading campaign:", error);
        router.push("/campaigns");
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [campaignId, router, user, profile, authLoading]);

  const handleToggleStatus = async () => {
    if (!campaign) return;

    setIsUpdating(true);
    try {
      const newStatus: CampaignStatus =
        campaign.status === "active" ? "draft" : "active";
      await campaignService.updateCampaignStatus(campaign.id, newStatus);
      setCampaign({ ...campaign, status: newStatus });
    } catch (error) {
      console.error("Error updating campaign status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!campaign) return;

    setIsUpdating(true);
    try {
      await campaignService.deleteCampaign(campaign.id);
      router.push("/campaigns");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      setIsUpdating(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - revert changes
      setEditedCampaign(campaign);
    }
    setIsEditMode(!isEditMode);
  };

  const handleFieldChange = (
    field: keyof Campaign,
    value: string | number | boolean | null
  ) => {
    if (!editedCampaign) return;
    setEditedCampaign({
      ...editedCampaign,
      [field]: value,
    });
  };

  const handleSaveChanges = async () => {
    if (!editedCampaign || !campaign) return;

    setIsUpdating(true);
    try {
      // Prepare update data with only editable fields
      const updateData: Partial<Campaign> = {
        title: editedCampaign.title,
        description: editedCampaign.description,
        budget_min: editedCampaign.budget_min,
        budget_max: editedCampaign.budget_max,
        max_ambassadors: editedCampaign.max_ambassadors,
        deadline: editedCampaign.deadline,
        requirements: editedCampaign.requirements,
        proposal_message: editedCampaign.proposal_message,
      };

      const { data: updated } = await campaignService.updateCampaign(
        campaign.id,
        updateData
      );
      if (updated) {
        setCampaign(updated);
        setEditedCampaign(updated);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b border-[#f5d82e]"></div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Back Button */}
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </button>

          {/* Edit Mode Banner */}
          {isEditMode && (
            <div className="bg-[#f5d82e] bg-opacity-20 border-l-4 border-[#f5d82e] p-4 mb-6 rounded-r-lg flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                ✏️ Edit mode active - Make your changes below
              </p>
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="flex items-center gap-2 px-6 py-2 bg-[#f5d82e] hover:bg-[#e5c820] text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Campaign Header */}
          <div className="bg-white rounded-xl border border-gray-300 p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedCampaign?.title || ""}
                      onChange={(e) =>
                        handleFieldChange("title", e.target.value)
                      }
                      className="text-3xl font-bold text-gray-900 border-b border-[#f5d82e] focus:outline-none bg-transparent"
                      autoFocus
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-gray-900">
                      {campaign.title}
                    </h1>
                  )}
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      campaign.status === "draft"
                        ? "bg-gray-100 text-gray-700"
                        : campaign.status === "active"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {campaign.status.charAt(0).toUpperCase() +
                      campaign.status.slice(1)}
                  </span>
                </div>
                {isEditMode ? (
                  <textarea
                    value={editedCampaign?.description || ""}
                    onChange={(e) =>
                      handleFieldChange("description", e.target.value)
                    }
                    className="w-full text-gray-600 text-lg border-b border-[#f5d82e] focus:outline-none bg-transparent resize-none"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-600 text-lg">
                    {campaign.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-6 border-t border-gray-300">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-2 bg-[#f5d82e] hover:bg-[#e5c820] text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {isUpdating ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Campaign
                  </button>

                  <button
                    onClick={handleToggleStatus}
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                      campaign.status === "active"
                        ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        : "bg-[#f5d82e] text-black hover:bg-[#e5c820]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {campaign.status === "active" ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        Deactivate Campaign
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Activate Campaign
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isUpdating}
                    className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Campaign
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Budget */}
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#f5d82e] bg-opacity-20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-[#f5d82e]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Budget Range
                </h3>
              </div>
              {isEditMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedCampaign?.budget_min || 0}
                    onChange={(e) =>
                      handleFieldChange(
                        "budget_min",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-32 text-2xl font-bold text-gray-900 border-b border-[#f5d82e] focus:outline-none bg-transparent"
                  />
                  <span className="text-2xl font-bold text-gray-900">-</span>
                  <span className="text-2xl font-bold text-gray-900">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedCampaign?.budget_max || 0}
                    onChange={(e) =>
                      handleFieldChange(
                        "budget_max",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-32 text-2xl font-bold text-gray-900 border-b border-[#f5d82e] focus:outline-none bg-transparent"
                  />
                </div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  ${campaign.budget_min.toFixed(2)} - $
                  {campaign.budget_max.toFixed(2)}
                </p>
              )}
            </div>

            {/* Max Ambassadors */}
            <div className="bg-white rounded-xl border border-gray-300 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Max Ambassadors
                </h3>
              </div>
              {isEditMode ? (
                <input
                  type="number"
                  min="1"
                  value={editedCampaign?.max_ambassadors || 1}
                  onChange={(e) =>
                    handleFieldChange(
                      "max_ambassadors",
                      parseInt(e.target.value)
                    )
                  }
                  className="w-24 text-2xl font-bold text-gray-900 border-b border-[#f5d82e] focus:outline-none bg-transparent"
                />
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {campaign.max_ambassadors}
                </p>
              )}
            </div>
          </div>

          {/* Deadline & Requirements */}
          <div className="bg-white rounded-xl border border-gray-300 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Deadline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Deadline
                  </h3>
                </div>
                {isEditMode ? (
                  <input
                    type="date"
                    value={
                      editedCampaign?.deadline
                        ? editedCampaign.deadline.split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleFieldChange("deadline", e.target.value || null)
                    }
                    className="text-gray-600 border-b border-[#f5d82e] focus:outline-none bg-transparent"
                  />
                ) : (
                  <p className="text-gray-600">
                    {campaign.deadline
                      ? new Date(campaign.deadline).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "No deadline set"}
                  </p>
                )}
              </div>

              {/* Created Date */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Created
                  </h3>
                </div>
                <p className="text-gray-600">
                  {campaign.created_at
                    ? new Date(campaign.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )
                    : "Unknown"}
                </p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl border border-gray-300 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Requirements
            </h3>
            {isEditMode ? (
              <textarea
                value={editedCampaign?.requirements || ""}
                onChange={(e) =>
                  handleFieldChange("requirements", e.target.value || null)
                }
                placeholder="Add campaign requirements..."
                className="w-full text-gray-600 border border-[#f5d82e] focus:outline-none bg-transparent resize-none p-2 rounded-lg"
                rows={6}
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {campaign.requirements || "No requirements specified"}
              </p>
            )}
          </div>

          {/* Campaign Proposal Message */}
          <div className="bg-white rounded-xl border border-gray-300 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Campaign Proposal Message
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              This message will be shown to ambassadors when they view the
              campaign details.
            </p>
            {isEditMode ? (
              <textarea
                value={editedCampaign?.proposal_message || ""}
                onChange={(e) =>
                  handleFieldChange("proposal_message", e.target.value || null)
                }
                placeholder="Add a message for ambassadors interested in this campaign..."
                className="w-full text-gray-600 border border-[#f5d82e] focus:outline-none bg-transparent resize-none p-2 rounded-lg"
                rows={6}
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {campaign.proposal_message || "No message specified"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              background: "rgba(107, 114, 128, 0.5)",
            }}
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Delete Campaign?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{campaign.title}&quot;? This
              action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isUpdating ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
