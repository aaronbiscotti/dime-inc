import { getAmbassadorWithProfile } from "@/lib/auth/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmbassadorDashboardClient } from "./AmbassadorDashboardClient";

export default async function AmbassadorDashboard() {
  const { ambassadorProfile } = await getAmbassadorWithProfile();

  if (!ambassadorProfile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                My Active Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AmbassadorDashboardClient ambassadorId={ambassadorProfile.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <span className="text-sm font-semibold capitalize">
                    Ambassador
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-semibold">
                    {ambassadorProfile.full_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Joined</span>
                  <span className="text-sm">
                    {ambassadorProfile.created_at
                      ? new Date(
                          ambassadorProfile.created_at
                        ).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
