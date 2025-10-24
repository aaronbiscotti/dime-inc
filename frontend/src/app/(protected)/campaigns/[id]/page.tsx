import { requireOnboardedProfile } from "@/lib/auth/requireUser";
import { getCampaignAction } from "@/app/(protected)/explore/actions";
import { getCampaignSubmissionsAction } from "@/app/(protected)/submissions/actions";
import { CampaignPageClient } from "./CampaignPageClient";

type Props = { params: Promise<{ id: string }> };

export default async function CampaignPage({ params }: Props) {
  await requireOnboardedProfile();
  const { id } = await params;
  const campaignResult = await getCampaignAction(id);
  const submissionsResult = await getCampaignSubmissionsAction(id);

  if (!campaignResult.ok) {
    throw new Error(campaignResult.error);
  }
  if (!submissionsResult.ok) {
    throw new Error(submissionsResult.error);
  }

  const campaign = campaignResult.data;
  const submissions = submissionsResult.data;

  return <CampaignPageClient campaign={campaign} submissions={submissions} />;
}
