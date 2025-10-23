import { getServerUser, requireClientRole } from "@/lib/auth/server";
import { getClientCampaigns } from "@/lib/campaigns/server";
import CampaignsListClient from "@/components/campaigns/CampaignsListClient";

export default async function CampaignsPage() {
  // Server-side auth check - redirects if not authenticated or not a client
  const user = await getServerUser();
  const profile = await requireClientRole(user.id);

  // Server-side data fetching with ownership checks
  const campaigns = await getClientCampaigns(user.id);

  return <CampaignsListClient campaigns={campaigns} />;
}
