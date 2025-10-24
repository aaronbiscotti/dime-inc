import { requireOnboardedProfile } from "@/lib/auth/requireUser";
import { getAmbassadorsAction, getClientsAction } from "@/app/(protected)/explore/actions";
import { getClientCampaignsAction } from "@/app/(protected)/campaigns/actions";
import ExploreInterfaceClient from "@/components/explore/ExploreInterfaceClient";

export default async function ExplorePage() {
  const { profile } = await requireOnboardedProfile();

  if (profile.role === "ambassador") {
    // Ambassadors browse clients
    const clientsResult = await getClientsAction({ limit: 10, offset: 0 });
    const clients = clientsResult.ok ? clientsResult.data : [];
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold mb-6">Explore</h1>
          <ExploreInterfaceClient
            userRole="ambassador"
            initialClients={clients}
            initialAmbassadors={[]}
            initialCampaigns={[]}
          />
      </div>
    );
  }

  // Clients browse ambassadors + see active campaigns context
  const [ambassadorsResult, clientCampaigns] = await Promise.all([
    getAmbassadorsAction({ limit: 10, offset: 0 }),
    getClientCampaignsAction(),
  ]);

  const ambassadors = ambassadorsResult.ok ? ambassadorsResult.data : [];
  const campaigns = clientCampaigns.ok
    ? (clientCampaigns.data || []).filter((c: any) => c.status === "active")
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <h1 className="text-2xl font-semibold mb-6">Explore</h1>
        <ExploreInterfaceClient
          userRole="client"
          initialAmbassadors={ambassadors}
          initialCampaigns={campaigns}
        />
    </div>
  );
}
