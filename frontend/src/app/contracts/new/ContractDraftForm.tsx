"use client";
// ContractDraftForm component for drafting a new contract
import React, { useState, useEffect } from "react";
import { Paperclip, FileText, Eye, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { campaignService } from "@/services/campaignService";
import { contractService } from "@/services/contractService";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ContractTextEditor from "./ContractTextEditor";

type CampaignSummary = {
  id: string;
  title?: string;
  description?: string;
  status?: string;
};

type AmbassadorSummary = {
  id: string;
  name?: string;
  avatar_url?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  twitter_handle?: string;
};

export default function ContractDraftForm({
  initialCampaignId = "",
  initialAmbassadorIds = [],
}: {
  initialCampaignId?: string;
  initialAmbassadorIds?: string[];
}) {
  // Form state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [payType, setPayType] = useState<"post" | "cpm" | null>(null);
  const [startDate, setStartDate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const { clientProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [ambassadors, setAmbassadors] = useState<AmbassadorSummary[]>([]);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(false);
  const [selectedAmbassadorIds, setSelectedAmbassadorIds] = useState<string[]>(
    []
  );
  const [showEditor, setShowEditor] = useState(false);
  const [editorText, setEditorText] = useState("");
  const [clientName, setClientName] = useState(
    clientProfile?.company_name || ""
  );
  const router = useRouter();

  // Set initial state from props on mount
  useEffect(() => {
    // If only ambassador is provided, try to auto-select the campaign that ambassador is associated with
    if (
      !initialCampaignId &&
      initialAmbassadorIds &&
      initialAmbassadorIds.length > 0 &&
      campaigns.length > 0
    ) {
      // Find the first campaign that has this ambassador
      const ambassadorId = initialAmbassadorIds[0];
      // For each campaign, fetch ambassadors and check if ambassadorId is present
      (async () => {
        for (const campaign of campaigns) {
          const { data: ambs } = await campaignService.getCampaignAmbassadors(
            campaign.id
          );
          if (ambs && ambs.some((a) => a.id === ambassadorId)) {
            setSelectedCampaignId(campaign.id);
            setSelectedAmbassadorIds([ambassadorId]);
            break;
          }
        }
      })();
    } else {
      if (initialCampaignId) setSelectedCampaignId(initialCampaignId);
      if (initialAmbassadorIds && initialAmbassadorIds.length > 0)
        setSelectedAmbassadorIds(initialAmbassadorIds);
    }
  }, [initialCampaignId, initialAmbassadorIds, campaigns]);

  // Fetch campaigns on mount
  useEffect(() => {
    if (!clientProfile) return;
    setLoadingCampaigns(true);
    campaignService
      .getMyClientCampaigns()
      .then((result) => {
        if (!result.error && result.data) {
          // Only include active campaigns
          const activeCampaigns = (result.data || []).filter(
            (c) => c.status === "active"
          );
          setCampaigns(activeCampaigns);
        }
      })
      .finally(() => setLoadingCampaigns(false));
  }, [clientProfile]);

  // Fetch ambassadors when campaign changes
  useEffect(() => {
    if (!selectedCampaignId) {
      setAmbassadors([]);
      return;
    }
    const selected = campaigns.find((c) => c.id === selectedCampaignId);
    if (selected && selected.description) setDescription(selected.description);
    setLoadingAmbassadors(true);
    // Placeholder: implement this in campaignService if not present
    campaignService
      .getCampaignAmbassadors(selectedCampaignId)
      .then(({ data }) => setAmbassadors(data || []))
      .finally(() => setLoadingAmbassadors(false));
  }, [selectedCampaignId, campaigns]);

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gather all contract data
    const contractData = {
      campaign: campaigns.find((c) => c.id === selectedCampaignId),
      ambassadors: ambassadors.filter((a) =>
        selectedAmbassadorIds.includes(a.id)
      ),
      description,
      file,
      payType,
      startDate,
      agreed,
    };
    // Generate contract text (simple template for now)
    const ambassadorName = contractData.ambassadors[0]?.name || "[Ambassador]";
    const campaignTitle = contractData.campaign?.title || "[Campaign]";
    // Prefer company_name from clientProfile
    const clientNameForContract =
      clientName || clientProfile?.company_name || "[Client]";
    const pay =
      payType === "post"
        ? "$250 per post"
        : payType === "cpm"
        ? "$X CPM"
        : "[Pay]";
    const start = startDate || "[Start Date]";
    const defaultText = `CREATOR COLLABORATION AGREEMENT\n\nThis Creator Agreement (the \"Agreement\") is made and entered into as of the date of execution by both parties (the \"Effective Date\"), by and between ${clientNameForContract} (\"Client\"), and ${ambassadorName} (\"Creator\").\n\n1. Scope of Work\n${clientNameForContract} agrees to create and post content for the campaign: ${campaignTitle}.\n\n2. Compensation\n${clientNameForContract} agrees to pay Creator ${pay}.\n\n3. Content Submission & Ad Authorization\n...\n\n4. Posting Requirements & Deadline\nStart date: ${start}.\n...\n\n[Full contract terms here]\n`;
    setEditorText(defaultText);
    setShowEditor(true);
  };

  const handleBackFromEditor = () => setShowEditor(false);
  const handleSaveFromEditor = async (text: string) => {
    try {
      // Fetch campaign_ambassadors join table rows for the selected campaign
      const caResult = await campaignService.getCampaignAmbassadorRows(
        selectedCampaignId
      ); // This returns [{ id, ambassador_id, ... }]
      console.log("Selected campaign:", selectedCampaignId);
      console.log("Selected ambassadorIds:", selectedAmbassadorIds);
      console.log(
        "campaignService.getCampaignAmbassadorRows result:",
        caResult.data
      );
      // Find the campaign_ambassador row for the selected ambassador
      if (!caResult.data || caResult.error) {
        alert("Failed to fetch campaign ambassadors.");
        return;
      }
      const caRows = caResult.data as Array<{
        id: string;
        ambassador_id: string;
        [key: string]: unknown;
      }>;
      const caRow = caRows.find((row) =>
        selectedAmbassadorIds.includes(row.ambassador_id)
      );
      console.log("Matched caRow:", caRow);
      if (!caRow) {
        alert("No campaign_ambassador found for this campaign and ambassador.");
        return;
      }
      if (!clientProfile?.id) {
        alert("Client profile not found.");
        return;
      }
      await contractService.createContract({
        contract_text: text,
        payment_type: payType === "post" ? "pay_per_post" : "pay_per_cpm",
        start_date: startDate || undefined,
        campaign_ambassador_id: caRow.id, // correct join table FK
        client_id: clientProfile.id, // correct client FK
        // Add more fields as needed
      });
      router.push("/contracts");
      router.refresh();
    } catch (err) {
      alert(
        "Failed to save contract: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  if (showEditor) {
    return (
      <ContractTextEditor
        initialText={editorText}
        onBack={handleBackFromEditor}
        onSave={handleSaveFromEditor}
      />
    );
  }

  return (
    <form
      className="w-full h-full px-0"
      style={{ maxWidth: "100vw" }}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-row gap-10 w-full">
        {/* Main Form Card */}
        <div className="grow flex flex-col gap-8 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-300 p-12 mb-0 w-full">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-lg text-gray-900">
                Contract Details
              </span>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
                placeholder="Enter your (client) name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campaign
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                disabled={loadingCampaigns}
                required
              >
                <option value="" disabled>
                  {loadingCampaigns
                    ? "Loading campaigns..."
                    : "Select a campaign"}
                </option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descriptions
              </label>
              <textarea
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e] min-h-[100px]"
                placeholder="Enter a description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="mb-6 flex items-center gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                />
                <span className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-200 transition">
                  <Paperclip className="w-4 h-4 mr-2" /> Attach file
                </span>
              </label>
              <span className="text-xs text-gray-400">
                Max file size: 25 MB
              </span>
              {file && (
                <span className="text-xs text-green-600 ml-2">{file.name}</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-300 p-12 w-full">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-lg text-gray-900">
                Contract Terms<span className="text-[#f5d82e]">*</span>
              </span>
            </div>
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                className={`flex-1 flex flex-col items-center justify-center border rounded-xl px-6 py-4 transition text-gray-700 ${
                  payType === "post"
                    ? "border-[#f5d82e] bg-[#f5d82e]/10"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => setPayType("post")}
              >
                <FileText className="w-7 h-7 mb-2" />
                Pay per post
              </button>
              <button
                type="button"
                className={`flex-1 flex flex-col items-center justify-center border rounded-xl px-6 py-4 transition text-gray-700 ${
                  payType === "cpm"
                    ? "border-[#f5d82e] bg-[#f5d82e]/10"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => setPayType("cpm")}
              >
                <Eye className="w-7 h-7 mb-2" />
                Pay per CPM
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start date (optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="agree"
                className="mr-2 accent-[#f5d82e]"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <label htmlFor="agree" className="text-sm text-gray-700">
                I agree to the Terms & Conditions
              </label>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                type="button"
                className="px-6 py-2 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-2 rounded-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold shadow-sm border-none transition disabled:opacity-60"
                disabled={!payType || !agreed}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
        {/* Ambassador Card (Right) */}
        <div className="flex-shrink-0 w-[320px]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Select Ambassadors
            </h2>
          </div>
          {loadingAmbassadors ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading ambassadors...
            </div>
          ) : ambassadors.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-gray-300 p-6">
              <span className="text-sm font-medium mb-1">
                No ambassadors found for this campaign.
              </span>
              <span className="text-xs text-gray-400">
                Try selecting a different campaign or invite ambassadors to
                join.
              </span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ambassadors.map((amb, idx) => {
                const isSelected = selectedAmbassadorIds.includes(amb.id);
                return (
                  <div
                    key={amb.id || idx}
                    className={`flex items-center gap-3 border rounded-xl p-4 w-full cursor-pointer transition text-gray-700 ${
                      isSelected
                        ? "border-[#f5d82e] bg-[#f5d82e]/10"
                        : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-[#f5d82e]/60"
                    }`}
                    onClick={() => {
                      setSelectedAmbassadorIds((prev) =>
                        prev.includes(amb.id)
                          ? prev.filter((id) => id !== amb.id)
                          : [...prev, amb.id]
                      );
                    }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${
                        isSelected ? "bg-white" : "bg-gray-200"
                      }`}
                    >
                      {amb.avatar_url ? (
                        <Image
                          src={amb.avatar_url}
                          alt={amb.name || "Ambassador"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-gray-600">
                          {(amb.name || "A").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {amb.name || "Ambassador"}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {amb.instagram_handle && (
                          <div>Instagram {amb.instagram_handle}</div>
                        )}
                        {amb.tiktok_handle && (
                          <div>TikTok {amb.tiktok_handle}</div>
                        )}
                        {amb.twitter_handle && (
                          <div>Twitter {amb.twitter_handle}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full font-semibold text-xs ${
                          isSelected
                            ? "bg-white text-[#f5d82e]"
                            : "bg-[#f5d82e]/20 text-[#f5d82e]"
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Associated
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
