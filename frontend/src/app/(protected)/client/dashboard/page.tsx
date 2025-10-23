import { getClientWithProfile } from "@/lib/auth/server";
import { getClientCampaignsAction } from "@/app/(protected)/campaigns/actions";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClientDashboardClient from "@/components/dashboard/ClientDashboardClient";

export default async function ClientDashboardPage() {
  const { clientProfile } = await getClientWithProfile();

  if (!clientProfile) {
    return <div>Profile not found</div>;
  }

  // Fetch client's campaigns
  const campaignsResult = await getClientCampaignsAction();
  const campaigns = campaignsResult.ok ? campaignsResult.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-4">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Your Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientDashboardClient
                  userId={clientProfile.id}
                  role="client"
                  campaigns={campaigns}
                />
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
                      Client
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Company</span>
                    <span className="text-sm font-semibold">
                      {clientProfile.company_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Joined</span>
                    <span className="text-sm">
                      {clientProfile.created_at
                        ? new Date(
                            clientProfile.created_at
                          ).toLocaleDateString()
                        : "Recently"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
