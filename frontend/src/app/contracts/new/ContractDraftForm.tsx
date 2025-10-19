'use client';
// ContractDraftForm component for drafting a new contract
import React, { useState, useEffect } from "react";
import { Paperclip, FileText, Eye, Calendar, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { campaignService } from "@/services/campaignService";
import Image from "next/image";
import styles from "./page.module.css";

export default function ContractDraftForm() {
  // Form state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [payType, setPayType] = useState<"post" | "cpm" | null>(null);
  const [startDate, setStartDate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const { clientProfile } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [loadingAmbassadors, setLoadingAmbassadors] = useState(false);
  const [selectedAmbassadorIds, setSelectedAmbassadorIds] = useState<string[]>([]);

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
    campaignService.getCampaignAmbassadors(selectedCampaignId)
      .then((ambs: any[]) => setAmbassadors(ambs || []))
      .finally(() => setLoadingAmbassadors(false));
  }, [selectedCampaignId, campaigns]);

  // File input handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Form submit handler (stub)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement contract creation logic
  };

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!clientProfile) return;
      setLoadingCampaigns(true);
      const data = await campaignService.getClientCampaigns();
      // Only include active campaigns
      const activeCampaigns = (data || []).filter((c: any) => c.status === 'active');
      setCampaigns(activeCampaigns);
      setLoadingCampaigns(false);
    };
    fetchCampaigns();
  }, [clientProfile]);

  return (
    <form
      className="w-full h-full px-0"
      style={{ maxWidth: '100vw' }}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-row gap-10 w-full">
        {/* Main Form Card */}
        <div className="grow flex flex-col gap-8 min-w-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 mb-0 w-full">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-lg text-gray-900">Contract Details</span>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
                value={selectedCampaignId}
                onChange={e => setSelectedCampaignId(e.target.value)}
                disabled={loadingCampaigns}
                required
              >
                <option value="" disabled>
                  {loadingCampaigns ? 'Loading campaigns...' : 'Select a campaign'}
                </option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descriptions</label>
              <textarea
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e] min-h-[100px]"
                placeholder="Enter a description"
                value={description}
                onChange={e => setDescription(e.target.value)}
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
                <span className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-200 transition">
                  <Paperclip className="w-4 h-4 mr-2" /> Attach file
                </span>
              </label>
              <span className="text-xs text-gray-400">Max file size: 25 MB</span>
              {file && <span className="text-xs text-green-600 ml-2">{file.name}</span>}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-12 w-full">
            <div className="flex items-center gap-2 mb-6">
              <Eye className="w-5 h-5 text-gray-700" />
              <span className="font-semibold text-lg text-gray-900">Contract Terms<span className="text-[#f5d82e]">*</span></span>
            </div>
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                className={`flex-1 flex flex-col items-center justify-center border rounded-xl px-6 py-4 transition text-gray-700 ${payType === "post" ? "border-[#f5d82e] bg-[#f5d82e]/10" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                onClick={() => setPayType("post")}
              >
                <FileText className="w-7 h-7 mb-2" />
                Pay per post
              </button>
              <button
                type="button"
                className={`flex-1 flex flex-col items-center justify-center border rounded-xl px-6 py-4 transition text-gray-700 ${payType === "cpm" ? "border-[#f5d82e] bg-[#f5d82e]/10" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}
                onClick={() => setPayType("cpm")}
              >
                <Eye className="w-7 h-7 mb-2" />
                Pay per CPM
              </button>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date (optional)</label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
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
                onChange={e => setAgreed(e.target.checked)}
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
        <div className="flex-shrink-0 w-[340px]">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Select Ambassadors</h2>
          </div>
          {loadingAmbassadors ? (
            <div className="flex items-center justify-center h-full text-gray-400">Loading ambassadors...</div>
          ) : ambassadors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 rounded-2xl border border-gray-200 p-12">
              <span className="text-base font-medium mb-2">No ambassadors found for this campaign.</span>
              <span className="text-sm text-gray-400">Try selecting a different campaign or invite ambassadors to join.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {ambassadors.map((amb, idx) => {
                const isSelected = selectedAmbassadorIds.includes(amb.id);
                return (
                  <div
                    key={amb.id || idx}
                    className={`flex-1 flex flex-col items-center justify-center border rounded-2xl p-12 w-full cursor-pointer transition text-gray-700 
                      ${isSelected ? 'border-[#f5d82e] bg-[#f5d82e]/10' : 'border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-[#f5d82e]/60'}`}
                    onClick={() => {
                      setSelectedAmbassadorIds(prev =>
                        prev.includes(amb.id)
                          ? prev.filter(id => id !== amb.id)
                          : [...prev, amb.id]
                      );
                    }}
                  >
                    <div className={`w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden mb-3 ${isSelected ? 'bg-white' : 'bg-gray-200'}`}>
                      {amb.avatar_url ? (
                        <Image src={amb.avatar_url} alt={amb.name || "Ambassador"} width={80} height={80} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-600">
                          {(amb.name || "A").charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className={`font-semibold text-lg mb-1`}>{amb.name || "Ambassador"}</div>
                    <div className={`text-sm mb-1 flex flex-col items-center`}> 
                      {amb.instagram_handle && (
                        <span>• Instagram {amb.instagram_handle}</span>
                      )}
                      {amb.tiktok_handle && (
                        <span>• TikTok {amb.tiktok_handle}</span>
                      )}
                      {amb.twitter_handle && (
                        <span>• Twitter {amb.twitter_handle}</span>
                      )}
                    </div>
                    <div className="mt-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full font-semibold text-xs ${isSelected ? 'bg-white text-[#f5d82e]' : 'bg-[#f5d82e]/20 text-[#f5d82e]'}`}>
                        Associated with <CheckCircle className="w-4 h-4 ml-1" />
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
