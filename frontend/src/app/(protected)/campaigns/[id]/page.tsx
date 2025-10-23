import { getServerUser, requireClientRole } from "@/lib/auth/server";
import {
  getCampaignForClient,
  getCampaignSubmissionsForClient,
} from "@/lib/campaigns/server";
import CampaignClient from "@/components/campaigns/CampaignClient";

interface CampaignPageProps {
  params: {
    id: string;
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  // Server-side auth check - redirects if not authenticated or not a client
  const user = await getServerUser();
  const profile = await requireClientRole(user.id);

  // Server-side data fetching with ownership checks
  const campaign = await getCampaignForClient(params.id, user.id);
  const submissions = await getCampaignSubmissionsForClient(params.id, user.id);

  return (
    <CampaignClient campaign={campaign} initialSubmissions={submissions} />
  );
}
