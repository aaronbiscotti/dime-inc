"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { contractService, Contract } from "@/services/contractService";
import { useEffect, useState } from "react";
import { ProfileGuard } from "@/components/auth/ProfileGuard";

export default function ContractsPage() {
  const { user, clientProfile, ambassadorProfile } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        let data: Contract[] = [];
        if (clientProfile) {
          // FIX: Use clientProfile.id, not user_id
          data = await contractService.getContractsForClient(
            clientProfile.id
          );
        } else if (ambassadorProfile) {
          // FIX: Use ambassadorProfile.id, not user_id
          data = await contractService.getContractsForAmbassador(
            ambassadorProfile.id
          );
        }

        // Enrich data with names for display
        const enrichedData = data.map((c) => ({
          ...c,
          campaign_name: c.campaign_ambassadors?.campaigns?.title || "N/A",
          ambassador_name:
            c.campaign_ambassadors?.ambassador_profiles?.full_name || "N/A",
        }));

        setContracts(enrichedData || []);
      } catch {
        setError("Failed to load contracts");
      }
      setLoading(false);
    };
    fetchContracts();
  }, [user, clientProfile, ambassadorProfile]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
            Active
          </span>
        );
      case "pending_ambassador_signature":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
            Pending Signature
          </span>
        );
      case "draft":
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            Draft
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <ProfileGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          {clientProfile && (
            <Button
              className="bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full px-6"
              onClick={() => router.push("/contracts/new")}
            >
              Draft Contract
            </Button>
          )}
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-12">
            Loading contracts...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : contracts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-lg font-semibold mb-1">No contracts yet</div>
            <div className="text-sm text-gray-500 mb-4">
              You have not created or received any contracts.
            </div>
            {clientProfile && (
              <Button
                className="bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full px-6"
                onClick={() => router.push("/contracts/new")}
              >
                Draft Contract
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {clientProfile ? "Ambassador" : "Client"}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.campaign_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.ambassador_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusChip(c.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/contracts/${c.id}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      </div>
    </ProfileGuard>
  );
}
