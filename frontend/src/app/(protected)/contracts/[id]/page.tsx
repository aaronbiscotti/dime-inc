"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Database } from "@/types/database";
import {
  getContractAction,
  signContractAction,
  sendContractToAmbassadorAction,
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
import {
  CheckCircle2,
  Clock,
  FileText,
  User2,
  Send,
} from "lucide-react";

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
  const [isSending, setIsSending] = useState(false);

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

    // No validation needed - just require a name to be entered

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

  const handleSendToAmbassador = async () => {
    if (!contract) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("contractId", contract.id);
      
      const result = await sendContractToAmbassadorAction(null, formData);
      if (result.ok) {
        await fetchContract(); // Re-fetch to show updated status
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send contract. Please try again."
      );
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-6 text-center text-gray-500">
        Loading contract...
      </main>
    );
  }

  if (!contract) {
    return (
      <main className="max-w-7xl mx-auto px-6 py-6 text-center text-red-500">
        Contract not found.
      </main>
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
      <main className="max-w-7xl mx-auto px-6 py-6 text-center text-red-500">
        You do not have permission to view this contract.
      </main>
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
    <main className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-gray-900">Contract</h1>
        <Button
          variant="outline"
          className="rounded-full font-medium"
          onClick={() => router.push("/contracts")}
        >
          Back to Contracts
        </Button>
      </div>

      {/* Meta bar */}
      <div className="bg-white rounded-xl border border-gray-300 p-4 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-gray-700">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-gray-500" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Campaign</div>
              <div className="text-sm font-medium truncate">
                {contract.campaign_ambassadors?.campaigns?.title || "-"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <User2 className="w-4 h-4 text-gray-500" />
            <div className="min-w-0">
              <div className="text-xs text-gray-500">Ambassador</div>
              <div className="text-sm font-medium truncate">
                {contract.campaign_ambassadors?.ambassador_profiles?.full_name || "-"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Created</div>
              <div className="text-sm font-medium">
                {contract.created_at
                  ? new Date(contract.created_at).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm font-medium">{getStatusChip(contract.status)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="bg-white rounded-xl border border-gray-300 p-5 whitespace-pre-wrap font-serif text-base leading-relaxed min-h-[320px]">
        {contract.contract_text}
      </div>

      {/* --- Signing Section --- */}
      {!signingAs && (
        <div
          className={`rounded-xl border p-6 mt-5 ${
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
                <CheckCircle2 className="text-green-600 w-5 h-5" />
              ) : contract.status === "draft" ? (
                <FileText className="text-gray-600 w-5 h-5" />
              ) : (
                <Clock className="text-yellow-600 w-5 h-5" />
              )}
            </div>
            <h2 className="text-lg font-medium text-gray-900">
              {contract.status === "active"
                ? "Contract Active"
                : contract.status === "draft"
                ? "Contract Draft"
                : "Awaiting Signatures"}
            </h2>
          </div>

          {contract.status === "active" && (
            <div className="bg-white rounded-lg border border-green-200 p-4 mb-6">
              <p className="text-green-700">
                This contract is now active. Both parties have signed and the agreement is in effect.
              </p>
            </div>
          )}

          {contract.status === "draft" && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <p className="text-gray-700 mb-4">
                This contract is in draft status. Once both parties sign, it will become active.
              </p>
              {isClientOwner && (
                <Button
                  onClick={handleSendToAmbassador}
                  disabled={isSending}
                  className="bg-[#f5d82e] hover:bg-[#ffe066] text-black font-medium rounded-full px-6"
                >
                  <span className="inline-flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {isSending ? "Sending..." : "Send to Ambassador"}
                  </span>
                </Button>
              )}
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
                    <CheckCircle2 className="text-green-600 w-8 h-8" />
                  ) : (
                    <User2 className="text-blue-600 w-8 h-8" />
                  )}
                </div>
                <h3 className="font-medium text-base mb-2">Client Signature</h3>
                {contract.client_signed_at ? (
                  <p className="text-green-600 text-sm">
                    Signed on{" "}
                    {new Date(contract.client_signed_at).toLocaleDateString()}
                  </p>
                ) : isClientOwner && contract.status !== "active" ? (
                  <Button
                    onClick={() => setSigningAs("client")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium"
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
                    <CheckCircle2 className="text-green-600 w-8 h-8" />
                  ) : (
                    <User2 className="text-purple-600 w-8 h-8" />
                  )}
                </div>
                <h3 className="font-medium text-base mb-2">
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
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium"
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
        <div className="bg-white rounded-xl border-2 border-dashed border-yellow-400 p-6 mt-5">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Sign as {signingAs === "client" ? "Client" : "Ambassador"}
          </h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type your name to sign as {signingAs === "client" ? "Client Representative" : "Ambassador"}:
              </label>
              <Input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder={`Enter your name as ${signingAs === "client" ? "Client Representative" : "Ambassador"}`}
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
                  I agree to the terms and conditions outlined in this contract.
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
                className="flex-1 rounded-full font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSignContract}
                disabled={
                  isSigning || !agreeTerms || !signatureName.trim() || !!error
                }
                className={`flex-1 rounded-full font-medium ${
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
      <div className="bg-white rounded-xl border border-gray-300 p-5 mt-5">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Signatures</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium">Client Signature</h3>
            {contract.client_signed_at ? (
              <p className="text-green-600 mt-2 inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Signed on {new Date(contract.client_signed_at).toLocaleString()}
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Not signed yet</p>
            )}
          </div>
          <div>
            <h3 className="font-medium">Ambassador Signature</h3>
            {contract.ambassador_signed_at ? (
              <p className="text-green-600 mt-2 inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Signed on {new Date(contract.ambassador_signed_at).toLocaleString()}
              </p>
            ) : (
              <p className="text-gray-500 mt-2">Not signed yet</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
