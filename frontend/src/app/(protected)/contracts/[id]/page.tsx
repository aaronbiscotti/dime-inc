"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { Database } from "@/types/database";
import {
  getContractAction,
  signContractAction,
} from "@/app/(protected)/contracts/actions";

type Contract = Database["public"]["Tables"]["contracts"]["Row"] & {
  campaign_ambassadors?: {
    ambassador_profiles?: {
      id: string;
      full_name: string;
    };
    campaigns?: {
      title: string;
    };
  };
};
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
  const [signingAs, setSigningAs] = useState<"client" | "ambassador" | null>(
    null
  );

  const fetchContract = async () => {
    if (!contractId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getContractAction(contractId);
      if (result.ok) {
        setContract(result.data);
        if (ambassadorProfile) {
          setSignatureName(ambassadorProfile.full_name);
        }
      } else {
        setError(result.error);
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
    // Clear any previous errors
    setError(null);

    // Basic validation
    if (!contract || !agreeTerms || !signatureName.trim() || !signingAs) {
      setError("Please agree to the terms and type your name to sign.");
      return;
    }

    // Validate signature name based on who is signing
    if (signingAs === "client" && clientProfile) {
      if (
        signatureName.trim().toLowerCase() !==
        clientProfile.company_name.toLowerCase()
      ) {
        setError(
          "Please type your company name exactly as it appears in your profile."
        );
        return;
      }
    } else if (signingAs === "ambassador" && ambassadorProfile) {
      if (
        signatureName.trim().toLowerCase() !==
        ambassadorProfile.full_name.toLowerCase()
      ) {
        setError(
          "Please type your full name exactly as it appears in your profile."
        );
        return;
      }
    }

    // Additional validation - check if already signed
    if (signingAs === "client" && contract.client_signed_at) {
      setError("This contract has already been signed by the client.");
      return;
    }
    if (signingAs === "ambassador" && contract.ambassador_signed_at) {
      setError("This contract has already been signed by the ambassador.");
      return;
    }

    setIsSigning(true);
    try {
      const formData = new FormData();
      formData.append("contractId", contract.id);
      formData.append("signatureType", signingAs);

      const result = await signContractAction(null, formData);
      if (result.ok) {
        await fetchContract(); // Re-fetch to show updated status
        setSigningAs(null);
        setSignatureName("");
        setAgreeTerms(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign contract. Please try again."
      );
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
    contract.campaign_ambassador_id &&
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
        {!signingAs && (
          <div
            className={`rounded-xl border p-8 mt-6 ${
              contract.status === "active"
                ? "bg-green-50 border-green-200"
                : contract.status === "draft"
                ? "bg-gray-50 border-gray-200"
                : "bg-yellow-50 border-yellow-200"
            }`}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  contract.status === "active"
                    ? "bg-green-100"
                    : contract.status === "draft"
                    ? "bg-gray-100"
                    : "bg-yellow-100"
                }`}
              >
                {contract.status === "active" ? (
                  <span className="text-green-600 text-lg">✓</span>
                ) : contract.status === "draft" ? (
                  <span className="text-gray-600 text-lg">📄</span>
                ) : (
                  <span className="text-yellow-600 text-lg">⏳</span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {contract.status === "active"
                  ? "Contract Active"
                  : contract.status === "draft"
                  ? "Contract Draft"
                  : "Awaiting Signatures"}
              </h2>
            </div>

            {contract.status === "active" && (
              <div className="bg-white rounded-lg border border-green-200 p-4 mb-6">
                <p className="text-green-700 font-medium">
                  🎉 This contract is now active! Both parties have signed and
                  the agreement is in effect.
                </p>
              </div>
            )}

            {contract.status === "draft" && (
              <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
                <p className="text-gray-700 font-medium">
                  📝 This contract is in draft status. Once both parties sign,
                  it will become active.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Sign Button */}
              <div
                className={`p-6 rounded-xl border-2 transition-all ${
                  contract.client_signed_at
                    ? "border-green-200 bg-green-50"
                    : isClientOwner && contract.status !== "active"
                    ? "border-blue-200 bg-blue-50 hover:border-blue-300 cursor-pointer"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white border-2 border-current">
                    {contract.client_signed_at ? (
                      <span className="text-green-600 text-2xl">✓</span>
                    ) : (
                      <span className="text-blue-600 text-2xl">C</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Client Signature
                  </h3>
                  {contract.client_signed_at ? (
                    <p className="text-green-600 text-sm">
                      Signed on{" "}
                      {new Date(contract.client_signed_at).toLocaleDateString()}
                    </p>
                  ) : isClientOwner && contract.status !== "active" ? (
                    <Button
                      onClick={() => setSigningAs("client")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Sign as Client
                    </Button>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {contract.status === "active"
                        ? "Contract completed"
                        : "Waiting for client signature"}
                    </p>
                  )}
                </div>
              </div>

              {/* Ambassador Sign Button */}
              <div
                className={`p-6 rounded-xl border-2 transition-all ${
                  contract.ambassador_signed_at
                    ? "border-green-200 bg-green-50"
                    : isAmbassadorSignee && contract.status !== "active"
                    ? "border-purple-200 bg-purple-50 hover:border-purple-300 cursor-pointer"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white border-2 border-current">
                    {contract.ambassador_signed_at ? (
                      <span className="text-green-600 text-2xl">✓</span>
                    ) : (
                      <span className="text-purple-600 text-2xl">A</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    Ambassador Signature
                  </h3>
                  {contract.ambassador_signed_at ? (
                    <p className="text-green-600 text-sm">
                      Signed on{" "}
                      {new Date(
                        contract.ambassador_signed_at
                      ).toLocaleDateString()}
                    </p>
                  ) : isAmbassadorSignee && contract.status !== "active" ? (
                    <Button
                      onClick={() => setSigningAs("ambassador")}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Sign as Ambassador
                    </Button>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      {contract.status === "active"
                        ? "Contract completed"
                        : "Waiting for ambassador signature"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Signature Form */}
        {signingAs && (
          <div className="bg-white rounded-xl border-2 border-dashed border-yellow-400 p-8 mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Sign as {signingAs === "client" ? "Client" : "Ambassador"}
            </h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type your{" "}
                  {signingAs === "client" ? "company name" : "full name"} to
                  sign:{" "}
                  <span className="font-bold text-blue-600">
                    {signingAs === "client"
                      ? clientProfile?.company_name
                      : ambassadorProfile?.full_name}
                  </span>
                </label>
                <Input
                  type="text"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder={`Type your ${
                    signingAs === "client" ? "company name" : "full name"
                  } exactly as shown`}
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
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setSigningAs(null);
                    setSignatureName("");
                    setAgreeTerms(false);
                    setError(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSignContract}
                  disabled={
                    isSigning || !agreeTerms || !signatureName.trim() || !!error
                  }
                  className={`flex-1 ${
                    signingAs === "client"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  } text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSigning ? "Submitting Signature..." : "Sign Contract"}
                </Button>
              </div>
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
