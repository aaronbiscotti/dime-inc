"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { Campaign } from "@/types/database";

interface CampaignEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSave: (updatedCampaign: Partial<Campaign>) => Promise<void>;
}

export function CampaignEditModal({
  isOpen,
  onClose,
  campaign,
  onSave,
}: CampaignEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize form state with current campaign data
  const [formData, setFormData] = useState({
    title: campaign.title,
    description: campaign.description,
    budget_min: campaign.budget_min,
    budget_max: campaign.budget_max,
    max_ambassadors: campaign.max_ambassadors,
    deadline: campaign.deadline ? campaign.deadline.split('T')[0] : '',
    requirements: campaign.requirements || '',
  });

  // Reset form when campaign changes
  useEffect(() => {
    setFormData({
      title: campaign.title,
      description: campaign.description,
      budget_min: campaign.budget_min,
      budget_max: campaign.budget_max,
      max_ambassadors: campaign.max_ambassadors,
      deadline: campaign.deadline ? campaign.deadline.split('T')[0] : '',
      requirements: campaign.requirements || '',
    });
  }, [campaign]);

  const handleInputChange = (field: string, value: string | number) => {
    // Clear error and success states when user starts editing
    if (error) setError(null);
    if (success) setSuccess(false);

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate budget
      if (formData.budget_min < 0 || formData.budget_max < 0) {
        setError("Budget values must be positive");
        setLoading(false);
        return;
      }

      if (formData.budget_min > formData.budget_max) {
        setError("Minimum budget cannot be greater than maximum budget");
        setLoading(false);
        return;
      }

      // Validate max ambassadors
      if (formData.max_ambassadors < 1) {
        setError("Maximum ambassadors must be at least 1");
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData: Partial<Campaign> = {
        title: formData.title,
        description: formData.description,
        budget_min: Number(formData.budget_min),
        budget_max: Number(formData.budget_max),
        max_ambassadors: Number(formData.max_ambassadors),
        deadline: formData.deadline || null,
        requirements: formData.requirements || null,
      };

      await onSave(updateData);
      setSuccess(true);

      // Close modal after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error updating campaign:", err);
      setError(err.message || "Failed to update campaign");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Campaign</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              Campaign updated successfully!
            </div>
          )}

          {/* Campaign Title */}
          <div>
            <Label htmlFor="title">Campaign Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter campaign title"
              className="mt-1"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your campaign"
              rows={4}
              className="mt-1"
              required
            />
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min">Minimum Budget ($) *</Label>
              <Input
                id="budget_min"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_min}
                onChange={(e) =>
                  handleInputChange("budget_min", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="budget_max">Maximum Budget ($) *</Label>
              <Input
                id="budget_max"
                type="number"
                min="0"
                step="0.01"
                value={formData.budget_max}
                onChange={(e) =>
                  handleInputChange("budget_max", parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="mt-1"
                required
              />
            </div>
          </div>

          {/* Max Ambassadors */}
          <div>
            <Label htmlFor="max_ambassadors">Maximum Ambassadors *</Label>
            <Input
              id="max_ambassadors"
              type="number"
              min="1"
              value={formData.max_ambassadors}
              onChange={(e) =>
                handleInputChange("max_ambassadors", parseInt(e.target.value) || 1)
              }
              placeholder="1"
              className="mt-1"
              required
            />
          </div>

          {/* Deadline */}
          <div>
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleInputChange("deadline", e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Requirements */}
          <div>
            <Label htmlFor="requirements">Requirements (Optional)</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) => handleInputChange("requirements", e.target.value)}
              placeholder="Add any specific requirements for ambassadors"
              rows={4}
              className="mt-1"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <Button
            onClick={handleClose}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.title || !formData.description}
            className="bg-[#f5d82e] hover:bg-[#e5c820] text-black"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
