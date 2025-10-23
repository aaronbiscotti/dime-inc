import { getServerUser, requireClientRole } from "@/lib/auth/server";
import {
  getCampaignForClient,
  getCampaignSubmissionsForClient,
} from "@/lib/campaigns/server";
import CampaignClient from "@/components/campaigns/CampaignClient";

interface CampaignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  try {
    // Server-side auth check - redirects if not authenticated or not a client
    const user = await getServerUser();
    const profile = await requireClientRole(user.id);

    // Await params before using its properties (Next.js 15+ requirement)
    const { id } = await params;

    console.log("[CampaignPage] Loading campaign:", id, "for user:", user.id);

    // Server-side data fetching with ownership checks
    const campaign = await getCampaignForClient(id, user.id);
    const submissions = await getCampaignSubmissionsForClient(id, user.id);

    console.log("[CampaignPage] Campaign loaded:", campaign?.title);

    return (
      <CampaignClient campaign={campaign} initialSubmissions={submissions} />
    );
  } catch (error) {
    console.error("[CampaignPage] Error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Campaign</h1>
          <p className="text-gray-600">There was an error loading this campaign.</p>
          <p className="text-sm text-gray-500 mt-2">Check the console for details.</p>
        </div>
      </div>
    );
  }
}
