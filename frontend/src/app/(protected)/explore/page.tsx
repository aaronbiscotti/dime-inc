import { requireOnboardedProfile } from "@/lib/auth/requireUser";
import {
  getAmbassadorsAction,
  getCampaignsAction,
} from "@/app/(protected)/explore/actions";
import ExploreInterfaceClient from "@/components/explore/ExploreInterfaceClient";

export default async function ExplorePage() {
  await requireOnboardedProfile();

  // Load initial data on the server
  const [ambassadorsResult, campaignsResult] = await Promise.all([
    getAmbassadorsAction({}),
    getCampaignsAction({ status: "active" }),
  ]);

  const ambassadors = ambassadorsResult.ok ? ambassadorsResult.data : [];
  const campaigns = campaignsResult.ok ? campaignsResult.data : [];

  return (
    <div className="pt-4">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">Explore</h1>
        <ExploreInterfaceClient
          initialAmbassadors={ambassadors}
          initialCampaigns={campaigns}
        />
      </div>
    </div>
  );
}
