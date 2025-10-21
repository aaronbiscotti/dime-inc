"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { X, Plus, Calendar, DollarSign, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService } from "@/services/campaignService";

interface CampaignFormProps {
  onClose: () => void;
  onCampaignCreated?: (campaign: Record<string, unknown>) => void;
  onOpenAmbassadorSelection?: (campaign: Record<string, unknown>) => void;
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

export function CampaignForm({ onClose, onCampaignCreated, onOpenAmbassadorSelection }: CampaignFormProps) {
  const { clientProfile } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
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
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldAdd = (field: 'requirements' | 'deliverables') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const handleArrayFieldChange = (
    field: 'requirements' | 'deliverables',
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const handleArrayFieldRemove = (
    field: 'requirements' | 'deliverables',
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleNicheToggle = (niche: string) => {
    setFormData(prev => ({
      ...prev,
      targetNiches: prev.targetNiches.includes(niche)
        ? prev.targetNiches.filter(n => n !== niche)
        : [...prev.targetNiches, niche]
    }));
  };

  const availableNiches = [
    "Fashion", "Beauty", "Fitness", "Food", "Travel", "Tech", "Gaming",
    "Music", "Art", "Lifestyle", "Business", "Education", "Health", "Sports"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientProfile) {
      console.error("No client profile found");
      return;
    }

    setIsCreating(true);
    try {
      // Create campaign using campaign service
      const { data: campaign, error } = await campaignService.createCampaign({
        title: formData.title,
        description: formData.description,
        budget: formData.budget,
        timeline: formData.timeline,
        requirements: formData.requirements.filter(r => r.trim() !== "").join("\n"),
        targetNiches: formData.targetNiches,
        campaignType: formData.campaignType,
        deliverables: formData.deliverables.filter(d => d.trim() !== "")
      });

      if (error) {
        console.error('Error creating campaign:', error);
        return;
      }

      onCampaignCreated?.(campaign);
      onClose();

      // Open ambassador selection
      onOpenAmbassadorSelection?.(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0"
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={onClose}
      />

      {/* Modal with bounce animation */}
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-bounce-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Create New Campaign
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Campaign Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter campaign title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
                    onChange={(e) => handleInputChange('budget', e.target.value)}
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
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    placeholder="e.g., 2-4 weeks"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="campaignType">Campaign Type</Label>
              <Select
                id="campaignType"
                value={formData.campaignType}
                onChange={(e) => handleInputChange('campaignType', e.target.value)}
                required
              >
                <option value="" disabled>Select campaign type</option>
                <option value="product-launch">Product Launch</option>
                <option value="brand-awareness">Brand Awareness</option>
                <option value="event-promotion">Event Promotion</option>
                <option value="content-creation">Content Creation</option>
                <option value="user-generated-content">User Generated Content</option>
                <option value="review-campaign">Review Campaign</option>
              </Select>
            </div>

            {/* Target Niches */}
            <div>
              <Label>Target Niches</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {availableNiches.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => handleNicheToggle(niche)}
                    className={`px-3 py-2 text-sm rounded-full border transition-colors ${
                      formData.targetNiches.includes(niche)
                        ? 'bg-[#f5d82e] border-[#f5d82e] text-gray-900'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-[#f5d82e]'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <Label>Requirements</Label>
              <div className="space-y-2 mt-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={requirement}
                      onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                      placeholder="Enter requirement"
                    />
                    {formData.requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleArrayFieldRemove('requirements', index)}
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
                  onClick={() => handleArrayFieldAdd('requirements')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Requirement
                </Button>
              </div>
            </div>

            {/* Deliverables */}
            <div>
              <Label>Deliverables</Label>
              <div className="space-y-2 mt-2">
                {formData.deliverables.map((deliverable, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={deliverable}
                      onChange={(e) => handleArrayFieldChange('deliverables', index, e.target.value)}
                      placeholder="Enter deliverable"
                    />
                    {formData.deliverables.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleArrayFieldRemove('deliverables', index)}
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
                  onClick={() => handleArrayFieldAdd('deliverables')}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Deliverable
                </Button>
              </div>
            </div>

            {/* Submit Buttons */}
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
                {isCreating ? 'Creating...' : 'Create & Find Ambassadors'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}