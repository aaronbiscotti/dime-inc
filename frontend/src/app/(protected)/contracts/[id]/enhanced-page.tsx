"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Database } from "@/types/database";
import {
  getContractAction,
  signContractWithValidation,
  generateContractPDF,
  getContractHistory,
} from "@/app/(protected)/contracts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle2,
  Clock,
  FileText,
  User2,
  Send,
  Download,
  History,
  Edit,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

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

export default function EnhancedContractDetailPage() {
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
  const [signingAs, setSigningAs] = useState<"client" | "ambassador" | null>(null);
  const [signatureData, setSignatureData] = useState<string>("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [contractHistory, setContractHistory] = useState<any>(null);

  const fetchContract = async () => {
    if (!contractId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getContractAction(contractId);
      if (result.ok) {
        setContract(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contract");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const handleSignContract = async () => {
    if (!contract || !agreeTerms || !signatureName.trim() || !signingAs) {
      setError("Please agree to the terms and type your name to sign.");
      return;
    }

    // Check if already signed
    if (signingAs === "client" && contract.client_signed_at) {
      setError("This contract has already been signed by the client.");
      return;
    }
    if (signingAs === "ambassador" && contract.ambassador_signed_at) {
      setError("This contract has already been signed by the ambassador.");
      return;
    }

    setIsSigning(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("contractId", contract.id);
      formData.append("signatureType", signingAs);
      formData.append("signatureName", signatureName);
      if (signatureData) {
        formData.append("signatureData", signatureData);
      }

      const result = await signContractWithValidation(null, formData);
      if (result.ok) {
        await fetchContract();
        setSigningAs(null);
        setSignatureName("");
        setAgreeTerms(false);
        setSignatureData("");
        setShowSignaturePad(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign contract. Please try again.");
    } finally {
      setIsSigning(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!contract) return;
    
    setGeneratingPDF(true);
    try {
      const result = await generateContractPDF(contract.id);
      if (result.ok) {
        setPdfUrl(result.data.pdfUrl);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to generate PDF");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleViewHistory = async () => {
    if (!contract) return;
    
    try {
      const result = await getContractHistory(contract.id);
      if (result.ok) {
        setContractHistory(result.data);
        setShowHistory(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to fetch contract history");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="w-5 h-5 text-gray-500" />;
      case "pending_client_signature":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "pending_ambassador_signature":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "active":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "pending_client_signature":
      case "pending_ambassador_signature":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e]"></div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Contract</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Contract Not Found</h2>
          <p className="text-gray-600 mb-4">This contract may have been deleted or you don't have access to it.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const canSignAsClient = clientProfile && !contract.client_signed_at;
  const canSignAsAmbassador = ambassadorProfile && !contract.ambassador_signed_at;
  const isFullySigned = contract.client_signed_at && contract.ambassador_signed_at;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
            <p className="text-gray-600 mt-1">
              {contract.campaign_ambassadors?.campaigns?.title || "Campaign Contract"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleViewHistory}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button
              variant="outline"
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {generatingPDF ? "Generating..." : "Generate PDF"}
            </Button>
            {pdfUrl && (
              <Button
                onClick={() => window.open(pdfUrl, '_blank')}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View PDF
              </Button>
            )}
          </div>
        </div>

        {/* Contract Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getStatusIcon(contract.status)}
              <span className="capitalize">{contract.status.replace(/_/g, ' ')}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                {contract.status.replace(/_/g, ' ')}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Client Signature</h4>
                <div className="flex items-center gap-2">
                  {contract.client_signed_at ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        Signed on {new Date(contract.client_signed_at).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Pending signature</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Creator Signature</h4>
                <div className="flex items-center gap-2">
                  {contract.ambassador_signed_at ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        Signed on {new Date(contract.ambassador_signed_at).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Pending signature</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contract Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {contract.contract_text || "No contract text available"}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        {!isFullySigned && (canSignAsClient || canSignAsAmbassador) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Sign Contract</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {/* Signature Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Signing as:
                  </label>
                  <div className="flex gap-4">
                    {canSignAsClient && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="signingAs"
                          value="client"
                          checked={signingAs === "client"}
                          onChange={(e) => setSigningAs(e.target.value as "client")}
                          className="text-[#f5d82e] focus:ring-[#f5d82e]"
                        />
                        <span>Client ({clientProfile?.company_name})</span>
                      </label>
                    )}
                    {canSignAsAmbassador && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="signingAs"
                          value="ambassador"
                          checked={signingAs === "ambassador"}
                          onChange={(e) => setSigningAs(e.target.value as "ambassador")}
                          className="text-[#f5d82e] focus:ring-[#f5d82e]"
                        />
                        <span>Creator ({ambassadorProfile?.full_name})</span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Signature Name */}
                {signingAs && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name:
                    </label>
                    <Input
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="Enter your full name"
                      className="max-w-md"
                    />
                  </div>
                )}

                {/* Digital Signature Pad */}
                {signingAs && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Digital Signature (Optional):
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSignaturePad(!showSignaturePad)}
                      className="mb-2"
                    >
                      {showSignaturePad ? "Hide Signature Pad" : "Show Signature Pad"}
                    </Button>
                    {showSignaturePad && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                        <div className="text-center text-gray-500 mb-4">
                          Signature pad would be implemented here
                        </div>
                        <div className="bg-gray-100 h-32 rounded flex items-center justify-center">
                          <span className="text-gray-500">Draw your signature here</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Terms Agreement */}
                {signingAs && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="text-[#f5d82e] focus:ring-[#f5d82e]"
                    />
                    <label htmlFor="agreeTerms" className="text-sm text-gray-700">
                      I agree to the terms and conditions of this contract
                    </label>
                  </div>
                )}

                {/* Sign Button */}
                {signingAs && (
                  <Button
                    onClick={handleSignContract}
                    disabled={isSigning || !agreeTerms || !signatureName.trim()}
                    className="bg-[#f5d82e] hover:bg-[#e5c820] text-black"
                  >
                    {isSigning ? "Signing..." : "Sign Contract"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract History Modal */}
        {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Contract History</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowHistory(false)}
                >
                  Close
                </Button>
              </div>
              {contractHistory && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Contract Created</span>
                      <span className="text-sm text-gray-500">
                        {new Date(contractHistory.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Contract was initially created</p>
                  </div>
                  
                  {contractHistory.client_signed_at && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Client Signed</span>
                        <span className="text-sm text-gray-500">
                          {new Date(contractHistory.client_signed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Contract was signed by the client</p>
                    </div>
                  )}
                  
                  {contractHistory.ambassador_signed_at && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Creator Signed</span>
                        <span className="text-sm text-gray-500">
                          {new Date(contractHistory.ambassador_signed_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Contract was signed by the creator</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
