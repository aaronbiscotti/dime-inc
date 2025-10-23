import { getServerUser, requireClientRole } from "@/lib/auth/server";
import { getCampaignsAction } from "@/app/(protected)/explore/actions";
import CampaignsListClient from "@/components/campaigns/CampaignsListClient";

export default async function CampaignsPage() {
  // Server-side auth check - redirects if not authenticated or not a client
  const user = await getServerUser();
  // Server-side data fetching with ownership checks
  const result = await getCampaignsAction();
  const campaigns = result.ok ? result.data : [];

  return <CampaignsListClient campaigns={campaigns} />;
}
