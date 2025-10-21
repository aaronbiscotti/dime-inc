"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Plus, Calendar, DollarSign, Users, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService } from "@/services/campaignService";
import { useRouter } from "next/navigation";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated?: (campaign: Record<string, unknown>) => void;
}

interface CampaignFormData {
  title: string;
  description: string;
  budget: string;
  timeline: string;
  requirements: string[];
  targetNiches: string[];
  campaignType: string;
  deliverables: string[];
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
    budget: "",
    timeline: "",
    requirements: [""],
    targetNiches: [],
    campaignType: "",
    deliverables: [""],
  });

  const handleInputChange = (field: keyof CampaignFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldAdd = (field: "requirements" | "deliverables") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const handleArrayFieldChange = (
    field: "requirements" | "deliverables",
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const handleArrayFieldRemove = (
    field: "requirements" | "deliverables",
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleNicheToggle = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      targetNiches: prev.targetNiches.includes(niche)
        ? prev.targetNiches.filter((n) => n !== niche)
        : [...prev.targetNiches, niche],
    }));
  };

  const availableNiches = [
    "Fashion",
    "Beauty",
    "Fitness",
    "Food",
    "Travel",
    "Tech",
    "Gaming",
    "Music",
    "Art",
    "Lifestyle",
    "Business",
    "Education",
    "Health",
    "Sports",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientProfile) {
      console.error("No client profile found");
      return;
    }

    setIsCreating(true);
    try {
      const { data: campaign, error } = await campaignService.createCampaign({
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        timeline: formData.timeline,
        requirements: formData.requirements
          .filter((r) => r.trim() !== "")
          .join("\n"),
        targetNiches: formData.targetNiches,
        campaignType: formData.campaignType,
        deliverables: formData.deliverables.filter((d) => d.trim() !== ""),
      });

      if (error || !campaign) {
        console.error("Error creating campaign:", error);
        return;
      }

      setCreatedCampaignId(campaign.id as string);
      onCampaignCreated?.(campaign);
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
      await campaignService.updateCampaignStatus(createdCampaignId, "active");
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

          {/* Campaign Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Budget Range</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="budget"
                  value={formData.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  placeholder="e.g., $1,000 - $5,000"
                  className="pl-9"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="timeline">Timeline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="timeline"
                  value={formData.timeline}
                  onChange={(e) =>
                    handleInputChange("timeline", e.target.value)
                  }
                  placeholder="e.g., 2-4 weeks"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          {/* Requirements & Deliverables */}
          <div>
            <Label>Requirements</Label>
            <div className="space-y-2 mt-2">
              {formData.requirements.map((requirement, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={requirement}
                    onChange={(e) =>
                      handleArrayFieldChange(
                        "requirements",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Enter requirement"
                  />
                  {formData.requirements.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleArrayFieldRemove("requirements", index)
                      }
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleArrayFieldAdd("requirements")}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Requirement
              </Button>
            </div>
          </div>

          {/* Target Niches */}
          <div>
            <Label>Target Niches</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableNiches.map((niche) => (
                <Button
                  key={niche}
                  type="button"
                  variant={
                    formData.targetNiches.includes(niche)
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => handleNicheToggle(niche)}
                  className={
                    formData.targetNiches.includes(niche)
                      ? "bg-gray-800 text-white"
                      : ""
                  }
                >
                  {niche}
                </Button>
              ))}
            </div>
          </div>

          {/* Campaign Type & Deliverables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Input
                id="campaignType"
                value={formData.campaignType}
                onChange={(e) =>
                  handleInputChange("campaignType", e.target.value)
                }
                placeholder="e.g., Instagram Reel"
                required
              />
            </div>
            <div>
              <Label>Deliverables</Label>
              <div className="space-y-2 mt-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={deliverable}
                      onChange={(e) =>
                        handleArrayFieldChange(
                          "deliverables",
                          index,
                          e.target.value
                        )
                      }
                      placeholder="Enter deliverable"
                    />
                    {formData.deliverables.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleArrayFieldRemove("deliverables", index)
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleArrayFieldAdd("deliverables")}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Deliverable
                </Button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 border-0"
            >
              <Users className="w-4 h-4 mr-2" />
              {isCreating ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">Your campaign is ready!</h2>
          <p className="text-gray-600 mb-8">
            Activate your campaign now to make it visible to ambassadors, or you
            can do it later.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={handleKeepAsDraft} variant="outline" size="lg">
              Keep as Draft
            </Button>
            <Button
              onClick={handleActivate}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Activate Campaign
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
