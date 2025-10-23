// src/components/campaigns/CampaignViewClient.tsx
"use client";
import { reviewSubmissionAction } from "@/app/(protected)/campaigns/actions";

export default function CampaignViewClient({
  campaign,
  initialSubmissions = [],
}: {
  campaign: any;
  initialSubmissions?: any[];
}) {
  const handleFormSubmit = async (formData: FormData) => {
    const result = await reviewSubmissionAction(null, formData);
    if (!result.ok) {
      console.error("Error reviewing submission:", result.error);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{campaign.title}</h1>
      <p className="opacity-80">Status: {campaign.status}</p>

      {/* Example moderation form using a Server Action */}
      <form action={handleFormSubmit} className="space-x-2">
        <input type="hidden" name="submission_id" value={campaign.id} />
        <button
          name="status"
          value="approved"
          className="border rounded px-3 py-1"
        >
          Approve
        </button>
        <button
          name="status"
          value="requires_changes"
          className="border rounded px-3 py-1"
        >
          Request Changes
        </button>
      </form>
    </div>
  );
}
