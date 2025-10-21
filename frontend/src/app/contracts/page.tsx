"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { contractService, Contract } from "@/services/contractService";
import { useEffect, useState } from "react";

export default function ContractsPage() {
  const { clientProfile } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!clientProfile) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch all contracts for this client by client_id FK
        const data = await contractService.getContractsForClient(
          clientProfile.id
        );
        setContracts(data || []);
      } catch {
        setError("Failed to load contracts");
      }
      setLoading(false);
    };
    fetchContracts();
  }, [clientProfile]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <Button
            className="bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full px-6"
            onClick={() => router.push("/contracts/new")}
          >
            Draft Contract
          </Button>
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
              You have not created any contracts. Click &quot;Draft
              Contract&quot; to get started.
            </div>
            <Button
              className="bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full px-6"
              onClick={() => router.push("/contracts/new")}
            >
              Draft Contract
            </Button>
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
                    Ambassador
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
                      {c.terms_accepted ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                          Draft
                        </span>
                      )}
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
  );
}
