"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService } from "@/services/campaignService";
import { submissionService, Submission } from "@/services/submissionService";
import { Campaign, CampaignAmbassador } from "@/types/database";
import { Navbar } from "@/components/layout/Navbar";
import { CreatorSubmissionForm } from "@/components/submissions/CreatorSubmissionForm";
import { SubmissionsList } from "@/components/submissions/SubmissionsList";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";

export default function AmbassadorCampaignDetailsPage() {
  const { user, ambassadorProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [campaignAmbassador, setCampaignAmbassador] =
    useState<CampaignAmbassador | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!campaignId || !ambassadorProfile) return;
    setLoading(true);
    try {
      const campaignRes = await campaignService.getCampaign(campaignId);
      if (campaignRes.data) setCampaign(campaignRes.data);

      // This is a simplified way to get the campaign_ambassador record.
      // A more robust API would be `getCampaignAmbassador(campaignId, ambassadorId)`
      const caRes = await campaignService.getCampaignAmbassadorRows(campaignId);
      const myCampaignAsg = caRes.data?.find(
        (ca: any) => ca.ambassador_id === ambassadorProfile.id
      );
      if (myCampaignAsg) {
        setCampaignAmbassador(myCampaignAsg);
        const submissionsRes =
          await submissionService.getMySubmissionsForCampaign(myCampaignAsg.id);
        setSubmissions(submissionsRes || []);
      }
    } catch (error) {
      console.error("Failed to load campaign data", error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, ambassadorProfile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!campaign || !campaignAmbassador) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        Campaign not found or you are not a part of it.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        <div className="bg-white rounded-xl border border-gray-300 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
          <p className="text-gray-600 mt-2">{campaign.description}</p>
          <div className="flex gap-6 text-sm text-gray-600 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <DollarSign size={16} /> Budget: ${campaign.budget_min} - $
              {campaign.budget_max}
            </div>
            {campaign.deadline && (
              <div className="flex items-center gap-2">
                <Calendar size={16} /> Deadline:{" "}
                {new Date(campaign.deadline).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <CreatorSubmissionForm
            campaignAmbassadorId={campaignAmbassador.id}
            onSubmissionCreated={fetchData}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Your Submissions
            </h3>
            <SubmissionsList submissions={submissions} isClientView={false} />
          </div>
        </div>
      </main>
    </div>
  );
}
