"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { contractService, Contract } from "@/services/contractService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContractDetailPage() {
  const { user, clientProfile, ambassadorProfile } = useAuth();
  const router = useRouter();
  const params = useParams();
  const contractId = params?.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureName, setSignatureName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const fetchContract = async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await contractService.getContract(contractId);
      setContract(result);
      if (ambassadorProfile) {
        setSignatureName(ambassadorProfile.full_name);
      }
    } catch {
      setError("Failed to load contract");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const handleSignContract = async () => {
    if (
      !contract ||
      !ambassadorProfile ||
      !agreeTerms ||
      !signatureName.trim() ||
      signatureName.trim().toLowerCase() !==
        ambassadorProfile.full_name.toLowerCase()
    ) {
      setError(
        "Please agree to the terms and type your full name exactly as it appears in your profile to sign."
      );
      return;
    }
    setIsSigning(true);
    setError(null);
    try {
      await contractService.signContract(contract.id);
      await fetchContract(); // Re-fetch to show updated status
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign contract.");
    } finally {
      setIsSigning(false);
    }
  };

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

  const isClientOwner =
    clientProfile && contract.client_id === clientProfile.id;
  const isAmbassadorSignee =
    ambassadorProfile &&
    contract.campaign_ambassadors?.ambassador_profiles?.id ===
      ambassadorProfile.id;
  const canView = isClientOwner || isAmbassadorSignee;

  if (!user || !canView) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-6 text-center text-red-500">
          You do not have permission to view this contract.
        </main>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-700">
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
            <div>
              <div className="text-sm font-semibold text-gray-500 mb-1">
                Status
              </div>
              <div>{getStatusChip(contract.status)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-300 p-8 whitespace-pre-wrap font-serif text-base leading-relaxed min-h-[400px]">
          {contract.contract_text}
        </div>

        {/* --- Signing Section --- */}
        {isAmbassadorSignee &&
          contract.status === "pending_ambassador_signature" && (
            <div className="bg-white rounded-xl border-2 border-dashed border-yellow-400 p-8 mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Sign this Contract
              </h2>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="signatureName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Type your full name to sign:{" "}
                    <span className="font-bold">
                      {ambassadorProfile.full_name}
                    </span>
                  </label>
                  <Input
                    id="signatureName"
                    type="text"
                    value={signatureName}
                    onChange={(e: {
                      target: { value: SetStateAction<string> };
                    }) => setSignatureName(e.target.value)}
                    placeholder="Type your full name exactly as shown"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreeTerms"
                      name="agreeTerms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="focus:ring-yellow-500 h-4 w-4 text-yellow-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="agreeTerms"
                      className="font-medium text-gray-700"
                    >
                      I agree to the terms and conditions outlined in this
                      contract.
                    </label>
                  </div>
                </div>
                <Button
                  onClick={handleSignContract}
                  disabled={isSigning || !agreeTerms || !signatureName}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  {isSigning
                    ? "Submitting Signature..."
                    : "Sign and Activate Contract"}
                </Button>
              </div>
            </div>
          )}

        {/* --- Signature Display --- */}
        <div className="bg-white rounded-xl border border-gray-300 p-8 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Signatures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold">Client Signature</h3>
              {contract.client_signed_at ? (
                <p className="text-green-600 mt-2">
                  ✓ Signed on{" "}
                  {new Date(contract.client_signed_at).toLocaleString()}
                </p>
              ) : (
                <p className="text-gray-500 mt-2">Not signed yet</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold">Ambassador Signature</h3>
              {contract.ambassador_signed_at ? (
                <p className="text-green-600 mt-2">
                  ✓ Signed on{" "}
                  {new Date(contract.ambassador_signed_at).toLocaleString()}
                </p>
              ) : (
                <p className="text-gray-500 mt-2">Not signed yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
      </div>
    
  );
}
