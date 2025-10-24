import { getServerUser, requireRole } from "@/lib/auth/server";
import {
  getClientWithProfile,
  getAmbassadorWithProfile,
} from "@/lib/auth/server";
// Note: Portfolio and campaign data will be fetched client-side
import { ProfileSidebarClient } from "@/components/profile/ProfileSidebarClient";
import { ProfileClient } from "@/components/profile/ProfileClient";

export default async function Profile() {
  // Server-side auth check
  const user = await getServerUser();
  const profile = await requireRole("client", user.id).catch(async () => {
    // If not client, try ambassador
    return await requireRole("ambassador", user.id);
  });

  let ambassadorProfile = null;
  let clientProfile = null;
  let portfolioItems: any[] = [];
  let campaigns: any[] = [];

  // Fetch role-specific data
  if (profile.role === "ambassador") {
    const { ambassadorProfile: ambassador } = await getAmbassadorWithProfile(
      user.id
    );
    ambassadorProfile = ambassador;
    // Portfolio items will be fetched client-side
  } else if (profile.role === "client") {
    const { clientProfile: client } = await getClientWithProfile(user.id);
    clientProfile = client;
    // Campaigns will be fetched client-side
  }

  return (
    <div className="pt-4">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <ProfileSidebarClient
              profile={profile}
              ambassadorProfile={ambassadorProfile}
              clientProfile={clientProfile}
            />
          </div>

          <div className="md:col-span-2">
            <ProfileClient
              profile={profile}
              ambassadorProfile={ambassadorProfile}
              clientProfile={clientProfile}
              portfolioItems={portfolioItems}
              campaigns={campaigns}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
