"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Calendar, DollarSign, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  createCampaignAction,
  updateCampaignStatus,
} from "@/app/(protected)/campaigns/actions";
import { useRouter } from "next/navigation";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaign: Record<string, unknown>) => void;
}

interface CampaignFormData {
  title: string;
  description: string;
  budget_min: string; // strings make typing easier (no leading 0)
  budget_max: string;
  deadline: string;
  requirements: string;
  proposal_message: string;
  max_ambassadors: string;
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onCampaignCreated,
}: CreateCampaignModalProps) {
  const { clientProfile } = useAuth();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(
    null
  );
  const [step, setStep] = useState(1); // 1 for form, 2 for activation prompt

  const [formData, setFormData] = useState<CampaignFormData>({
    title: "",
    description: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    requirements: "",
    proposal_message: "",
    max_ambassadors: "",
  });

  const handleInputChange = (
    field: keyof CampaignFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientProfile) {
      console.error("No client profile found");
      return;
    }

    setIsCreating(true);
    try {
      const formDataForAction = new FormData();
      formDataForAction.append("title", formData.title);
      formDataForAction.append("description", formData.description);
      formDataForAction.append(
        "budget_min",
        (parseFloat(formData.budget_min || "0") || 0).toString()
      );
      formDataForAction.append(
        "budget_max",
        (parseFloat(formData.budget_max || "0") || 0).toString()
      );
      formDataForAction.append("deadline", formData.deadline);
      formDataForAction.append("requirements", formData.requirements);
      formDataForAction.append("proposal_message", formData.proposal_message);
      formDataForAction.append(
        "max_ambassadors",
        (parseInt(formData.max_ambassadors || "1") || 1).toString()
      );

      const result = await createCampaignAction(null, formDataForAction);

      if (!result.ok) {
        console.error("Error creating campaign:", result.error);
        return;
      }

      setCreatedCampaignId(result.data.id as string);
      onCampaignCreated?.(result.data);
      setStep(2); // Move to activation step
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleActivate = async () => {
    if (!createdCampaignId) return;
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("id", createdCampaignId);
      formData.append("status", "active");

      await updateCampaignStatus(formData);
      router.push(`/campaigns/${createdCampaignId}`);
    } catch (error) {
      console.error("Error activating campaign", error);
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  const handleKeepAsDraft = () => {
    if (!createdCampaignId) return;
    router.push(`/campaigns/${createdCampaignId}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 1 ? "Create New Campaign" : "Campaign Created!"}
      maxWidth="2xl"
      scrollable={true}
      maxHeight="85vh"
    >
      {step === 1 ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Campaign Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter campaign title"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your campaign goals and vision"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget_min">Minimum Budget ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="budget_min"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget_min}
                  onChange={(e) => handleInputChange("budget_min", e.target.value)}
                  placeholder="1000"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="budget_max">Maximum Budget ($)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="budget_max"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget_max}
                  onChange={(e) => handleInputChange("budget_max", e.target.value)}
                  placeholder="5000"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* Deadline and Max Ambassadors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadline">Campaign Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    handleInputChange("deadline", e.target.value)
                  }
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="max_ambassadors">Maximum Ambassadors</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="max_ambassadors"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.max_ambassadors}
                  onChange={(e) => handleInputChange("max_ambassadors", e.target.value)}
                  placeholder="5"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) =>
                handleInputChange("requirements", e.target.value)
              }
              placeholder="List the specific requirements for this campaign..."
              rows={4}
              required
            />
          </div>

          {/* Proposal Message */}
          <div>
            <Label htmlFor="proposal_message">Proposal Message</Label>
            <Textarea
              id="proposal_message"
              value={formData.proposal_message}
              onChange={(e) =>
                handleInputChange("proposal_message", e.target.value)
              }
              placeholder="Write a message to ambassadors about this campaign opportunity..."
              rows={3}
              className="focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-0 rounded-full font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              {isCreating ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-xl font-medium mb-4">Your campaign is ready!</h2>
          <p className="text-gray-600 mb-8">
            Activate your campaign now to make it visible to ambassadors, or you
            can do it later.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleKeepAsDraft} variant="outline" size="lg" className="rounded-full font-medium">
              Keep as Draft
            </Button>
            <Button
              onClick={handleActivate}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white rounded-full font-medium"
            >
              Activate Campaign
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
