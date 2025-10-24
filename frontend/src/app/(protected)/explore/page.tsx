import { requireOnboardedProfile } from "@/lib/auth/requireUser";
import {
  getAmbassadorsAction,
  getCampaignsAction,
  getClientsAction,
} from "@/app/(protected)/explore/actions";
import ExploreInterfaceClient from "@/components/explore/ExploreInterfaceClient";

export default async function ExplorePage() {
  const { profile } = await requireOnboardedProfile();

  if (profile.role === "ambassador") {
    // Ambassadors browse clients
    const clientsResult = await getClientsAction({ limit: 10, offset: 0 });
    const clients = clientsResult.ok ? clientsResult.data : [];
    return (
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl font-semibold mb-6">Explore</h1>
          <ExploreInterfaceClient
            userRole="ambassador"
            initialClients={clients}
            initialAmbassadors={[]}
            initialCampaigns={[]}
          />
        </div>
      </div>
    );
  }

  // Clients browse ambassadors + see active campaigns context
  const [ambassadorsResult, campaignsResult] = await Promise.all([
    getAmbassadorsAction({ limit: 10, offset: 0 }),
    getCampaignsAction({ status: "active" }),
  ]);

  const ambassadors = ambassadorsResult.ok ? ambassadorsResult.data : [];
  const campaigns = campaignsResult.ok ? campaignsResult.data : [];

  return (
    <div className="pt-4">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">Explore</h1>
        <ExploreInterfaceClient
          userRole="client"
          initialAmbassadors={ambassadors}
          initialCampaigns={campaigns}
        />
      </div>
    </div>
  );
}
