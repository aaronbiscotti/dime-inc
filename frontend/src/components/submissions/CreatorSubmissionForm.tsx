"use client";

import { useState } from "react";
import {
  submissionService,
  CreateSubmissionData,
} from "@/services/submissionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface CreatorSubmissionFormProps {
  campaignAmbassadorId: string;
  onSubmissionCreated: () => void;
}

export function CreatorSubmissionForm({
  campaignAmbassadorId,
  onSubmissionCreated,
}: CreatorSubmissionFormProps) {
  const [contentUrl, setContentUrl] = useState("");
  const [adCode, setAdCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentUrl.trim()) {
      setError("Content URL is required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const submissionData: CreateSubmissionData = {
        campaign_ambassador_id: campaignAmbassadorId,
        content_url: contentUrl,
        ad_code: adCode || undefined,
      };
      await submissionService.createSubmission(submissionData);
      setContentUrl("");
      setAdCode("");
      onSubmissionCreated(); // Refresh the list of submissions
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Submit Your Content
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <div>
          <Label htmlFor="contentUrl">Content URL *</Label>
          <Input
            id="contentUrl"
            value={contentUrl}
            onChange={(e) => setContentUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/..."
            required
          />
        </div>
        <div>
          <Label htmlFor="adCode">Ad Code (if applicable)</Label>
          <Input
            id="adCode"
            value={adCode}
            onChange={(e) => setAdCode(e.target.value)}
            placeholder="Enter any required ad code"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#f5d82e] hover:bg-[#e5c820] text-black"
          >
            {loading ? "Submitting..." : "Submit for Review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
