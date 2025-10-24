import { getServerUser, requireClientRole } from "@/lib/auth/server";
import { getClientCampaignsAction } from "@/app/(protected)/campaigns/actions";
import CampaignsListClient from "@/components/campaigns/CampaignsListClient";

export default async function CampaignsPage() {
  // Server-side auth check - redirects if not authenticated or not a client
  const user = await getServerUser();
  // Server-side data fetching with ownership checks
  const result = await getClientCampaignsAction();
  const campaigns = result.ok ? result.data : [];

  return <CampaignsListClient campaigns={campaigns} />;
}
