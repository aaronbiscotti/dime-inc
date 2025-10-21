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
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contract');
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
        <main className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow border mt-10 text-center text-gray-500">
          Loading contract...
        </main>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow border mt-10 text-center text-red-500">
          {error || "Contract not found."}
        </main>
      </div>
    );
  }

  // Only allow viewing if user is signed in and is the client or ambassador for this contract
  const isClient = clientProfile && contract.client_id === clientProfile.id;
  const isAmbassador = ambassadorProfile && contract.campaign_ambassadors?.ambassador_profiles?.id === ambassadorProfile.id;
  if (!user || (!isClient && !isAmbassador)) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow border mt-10 text-center text-red-500">
          You do not have permission to view this contract.
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow border mt-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Contract Document</h1>
          <Button variant="outline" onClick={() => router.push("/contracts")}>Back to Contracts</Button>
        </div>
        <div className="mb-4 text-gray-700">
          <div className="mb-1 font-semibold">Campaign:</div>
          <div className="mb-2">{contract.campaign_ambassadors?.campaigns?.title || "-"}</div>
          <div className="mb-1 font-semibold">Ambassador:</div>
          <div className="mb-2">{contract.campaign_ambassadors?.ambassador_profiles?.full_name || "-"}</div>
          <div className="mb-1 font-semibold">Created:</div>
          <div className="mb-2">{contract.created_at ? new Date(contract.created_at).toLocaleDateString() : "-"}</div>
        </div>
        <div className="border rounded-xl bg-gray-50 p-8 whitespace-pre-wrap font-mono text-base leading-relaxed shadow-inner min-h-[400px]">
          {contract.contract_text}
        </div>
      </main>
    </div>
  );
}
