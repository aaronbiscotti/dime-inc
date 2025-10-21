"use client";

import { useState } from "react";
import { campaignService, CreateCampaignData } from "@/services/campaignService";
import { Campaign } from "@/types/database";

interface CampaignFormProps {
  onSuccess?: (campaign: Campaign) => void;
  onCancel?: () => void;
}

export function CreateCampaignForm({ onSuccess, onCancel }: CampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  
  const [formData, setFormData] = useState<CreateCampaignData>({
    title: "",
    description: "",
    budget_min: 0,
    budget_max: 0,
    deadline: null,
    requirements: "",
    max_ambassadors: 1,
  });

  // Track raw input strings for budget fields to preserve decimal input like "500."
  const [budgetMinInput, setBudgetMinInput] = useState("");
  const [budgetMaxInput, setBudgetMaxInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert CreateCampaignData to CampaignData format
      const campaignData = {
        title: formData.title,
        description: formData.description,
        budget: `$${formData.budget_min} - $${formData.budget_max}`,
        timeline: formData.deadline || "No deadline",
        requirements: formData.requirements,
      };
      
      const { data: campaign, error: createError } = await campaignService.createCampaign(campaignData);
      if (createError || !campaign) {
        setError(createError?.message || "Failed to create campaign");
      } else {
        setCreatedCampaign(campaign);
        setShowSuccessModal(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    if (createdCampaign && onSuccess) {
      onSuccess(createdCampaign);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Campaign Title *
        </label>
        <input
          type="text"
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
          placeholder="e.g., Summer Product Launch"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          id="description"
          required
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
          placeholder="Describe your campaign goals and what you're looking for..."
        />
      </div>

      {/* Budget */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-1">
            Min Budget ($) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              id="budget_min"
              required
              value={budgetMinInput}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, "");
                // Prevent multiple decimal points
                const parts = value.split('.');
                const cleanValue = parts.length > 2 
                  ? parts[0] + '.' + parts.slice(1).join('') 
                  : value;
                
                setBudgetMinInput(cleanValue);
                setFormData({ ...formData, budget_min: parseFloat(cleanValue) || 0 });
              }}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
              placeholder="500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-1">
            Max Budget ($) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              id="budget_max"
              required
              value={budgetMaxInput}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9.]/g, "");
                // Prevent multiple decimal points
                const parts = value.split('.');
                const cleanValue = parts.length > 2 
                  ? parts[0] + '.' + parts.slice(1).join('') 
                  : value;
                
                setBudgetMaxInput(cleanValue);
                setFormData({ ...formData, budget_max: parseFloat(cleanValue) || 0 });
              }}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
              placeholder="2000"
            />
          </div>
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
          Deadline (Optional)
        </label>
        <input
          type="date"
          id="deadline"
          value={formData.deadline || ""}
          onChange={(e) => setFormData({ ...formData, deadline: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
        />
      </div>

      {/* Requirements */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
          Requirements (Optional)
        </label>
        <textarea
          id="requirements"
          rows={3}
          value={formData.requirements || ""}
          onChange={(e) => setFormData({ ...formData, requirements: e.target.value || null })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
          placeholder="List any specific requirements for ambassadors..."
        />
      </div>

      {/* Max Ambassadors */}
      <div>
        <label htmlFor="max_ambassadors" className="block text-sm font-medium text-gray-700 mb-1">
          Max Number of Ambassadors
        </label>
        <input
          type="number"
          id="max_ambassadors"
          min="1"
          value={formData.max_ambassadors}
          onChange={(e) => setFormData({ ...formData, max_ambassadors: parseInt(e.target.value) || 1 })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-[#f5d82e] text-black font-medium rounded-lg hover:bg-[#e5c820] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Campaign"}
        </button>
      </div>
    </form>

      {/* Success Modal */}
      {showSuccessModal && createdCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          />
          
          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Campaign Created!
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Your campaign &quot;<span className="font-semibold">{createdCampaign.title}</span>&quot; has been successfully created.
            </p>

            {/* Campaign Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-gray-900 capitalize">{createdCampaign.status}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Budget Range:</span>
                <span className="font-medium text-gray-900">
                  ${createdCampaign.budget_min.toFixed(2)} - ${createdCampaign.budget_max.toFixed(2)}
                </span>
              </div>
              {createdCampaign.deadline && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deadline:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(createdCampaign.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleCloseSuccessModal}
              className="w-full px-4 py-3 bg-[#f5d82e] text-black font-semibold rounded-lg hover:bg-[#e5c820] transition-colors"
            >
              View Campaign
            </button>
          </div>
        </div>
      )}
    </>
  );
}
