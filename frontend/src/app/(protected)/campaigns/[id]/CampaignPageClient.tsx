"use client";

import { useState } from "react";
import { ReviewSubmissionForm } from "@/components/submissions/ReviewSubmissionForm";
import { CreateSubmissionForm } from "@/components/submissions/CreateSubmissionForm";
import { CampaignEditModal } from "@/components/campaigns/CampaignEditModal";
import { updateCampaign, updateCampaignStatus } from "@/app/(protected)/campaigns/actions";

interface CampaignPageClientProps {
  campaign: any;
  submissions: any[];
}

export function CampaignPageClient({ campaign, submissions }: CampaignPageClientProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState(campaign);

  const handleEditCampaign = async (updateData: any) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("id", currentCampaign.id);
      formData.append("title", updateData.title);
      formData.append("description", updateData.description);
      formData.append("budget_min", updateData.budget_min.toString());
      formData.append("budget_max", updateData.budget_max.toString());
      formData.append("max_ambassadors", updateData.max_ambassadors.toString());
      if (updateData.deadline) {
        formData.append("deadline", updateData.deadline);
      }
      if (updateData.requirements) {
        formData.append("requirements", updateData.requirements);
      }
      if (updateData.proposal_message) {
        formData.append("proposal_message", updateData.proposal_message);
      }

      const result = await updateCampaign(formData);
      if (result.ok) {
        setCurrentCampaign(result.data);
        setIsEditModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("id", currentCampaign.id);
      formData.append("status", newStatus);

      const result = await updateCampaignStatus(formData);
      if (result.ok) {
        setCurrentCampaign({ ...currentCampaign, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating campaign status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header card */}
        <section className="bg-white rounded-lg border border-gray-300 p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-semibold text-gray-900">{currentCampaign.title}</h1>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  currentCampaign.status === "active"
                    ? "bg-[#f5d82e] text-black"
                    : currentCampaign.status === "draft"
                    ? "bg-gray-100 text-gray-700"
                    : currentCampaign.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {currentCampaign.status?.charAt(0).toUpperCase()}
                  {currentCampaign.status?.slice(1)}
                </span>
              </div>
              <p className="text-gray-600 text-sm">{currentCampaign.description}</p>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isUpdating}
              >
                Edit
              </button>
              
              {/* Status change buttons */}
              {currentCampaign.status === "draft" && (
                <button
                  onClick={() => handleStatusChange("active")}
                  className="px-3 py-1.5 text-sm bg-[#f5d82e] text-black rounded-lg hover:bg-[#e5c820]"
                  disabled={isUpdating}
                >
                  Activate
                </button>
              )}
              
              {currentCampaign.status === "active" && (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatusChange("completed")}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    disabled={isUpdating}
                  >
                    Complete
                  </button>
                  <button
                    onClick={() => handleStatusChange("cancelled")}
                    className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Campaign details grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Budget</div>
              <div className="text-sm font-medium text-gray-900">
                ${currentCampaign.budget_min.toFixed(0)} - ${currentCampaign.budget_max.toFixed(0)}
              </div>
            </div>
            {currentCampaign.deadline && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Deadline</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(currentCampaign.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Max Ambassadors</div>
              <div className="text-sm font-medium text-gray-900">{currentCampaign.max_ambassadors}</div>
            </div>
          </div>
        </section>

        {/* Submissions */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Submissions</h2>
          {submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((s: any) => (
                <div key={s.id} className="bg-white rounded-lg border border-gray-300 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-600">
                          {s.ambassador_profiles.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {s.ambassador_profiles.full_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{s.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                  <ReviewSubmissionForm submissionId={s.id} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-500">No submissions yet</p>
            </div>
          )}
        </section>

        {/* Create submission */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium text-gray-900">Create Submission</h2>
          <div className="bg-white rounded-lg border border-gray-300 p-4">
            <CreateSubmissionForm campaignId={currentCampaign.id} />
          </div>
        </section>
      </main>

      {/* Edit Modal */}
      <CampaignEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        campaign={currentCampaign}
        onSave={handleEditCampaign}
      />
    </>
  );
}
