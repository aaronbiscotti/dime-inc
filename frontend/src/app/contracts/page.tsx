"use client";

import { Navbar } from "@/components/layout/Navbar";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/services/chatService";
import { useEffect, useState } from "react";

export default function ContractsPage() {
  const { clientProfile } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!clientProfile) return;
      setLoading(true);
      setError(null);
      // Fetch all contracts for this client
      const { data, error } = await chatService.getContractsForClient(clientProfile.id);
      if (error) setError("Failed to load contracts");
      setContracts(data || []);
      setLoading(false);
    };
    fetchContracts();
  }, [clientProfile]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow border mt-10">
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
          <div className="text-center text-gray-500 py-12">Loading contracts...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : contracts.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-2xl mb-2">📄</div>
            <div className="text-lg font-semibold mb-1">No contracts yet</div>
            <div className="text-sm text-gray-500 mb-4">You have not created any contracts. Click "Draft Contract" to get started.</div>
            <Button
              className="bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full px-6"
              onClick={() => router.push("/contracts/new")}
            >
              Draft Contract
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ambassador</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.campaign_name}</td>
                    <td className="px-4 py-2">{c.ambassador_name}</td>
                    <td className="px-4 py-2">
                      {c.terms_accepted ? (
                        <span className="text-green-700 font-semibold">Active</span>
                      ) : (
                        <span className="text-yellow-700 font-semibold">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/contracts/${c.id}`)}>
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
