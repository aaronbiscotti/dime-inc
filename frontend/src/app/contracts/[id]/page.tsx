"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/config/api";
import { Button } from "@/components/ui/button";

type ContractView = {
  client_id?: string | null;
  created_at?: string | null;
  contract_text?: string | null;
  campaign_ambassadors?: {
    ambassador_profiles?: { id?: string; full_name?: string } | null;
    campaigns?: { title?: string } | null;
  } | null;
};

export default function ContractDetailPage() {
  const { user, clientProfile, ambassadorProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id as string;
  const [contract, setContract] = useState<ContractView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch contract by ID using backend API
        const response = await fetch(`${API_URL}/api/contracts/${contractId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch contract");
        }

        const result = await response.json();
        setContract(result.data as ContractView);
      } catch {
        setError("Failed to load contract");
      }
      setLoading(false);
    };
    fetchContract();
  }, [contractId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-500">
          Loading contract...
        </main>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-6 text-center text-red-500">
          {error || "Contract not found."}
        </main>
      </div>
    );
  }

  // Only allow viewing if user is signed in and is the client or ambassador for this contract
  const isClient = clientProfile && contract.client_id === clientProfile.id;
  const isAmbassador =
    ambassadorProfile &&
    contract.campaign_ambassadors?.ambassador_profiles?.id ===
      ambassadorProfile.id;
  if (!user || (!isClient && !isAmbassador)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-6 text-center text-red-500">
          You do not have permission to view this contract.
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Contract Document
          </h1>
          <Button variant="outline" onClick={() => router.push("/contracts")}>
            Back to Contracts
          </Button>
        </div>
        <div className="bg-white rounded-xl border border-gray-300 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">
                Campaign
              </div>
              <div>
                {contract.campaign_ambassadors?.campaigns?.title || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">
                Ambassador
              </div>
              <div>
                {contract.campaign_ambassadors?.ambassador_profiles
                  ?.full_name || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">
                Created
              </div>
              <div>
                {contract.created_at
                  ? new Date(contract.created_at).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-300 p-8 whitespace-pre-wrap font-mono text-sm leading-relaxed min-h-[400px]">
          {contract.contract_text}
        </div>
      </main>
    </div>
  );
}
