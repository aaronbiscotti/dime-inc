"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ContractDraftForm from "./ContractDraftForm";
import { useSearchParams } from "next/navigation";

// TODO: Implement modern contract drafting UI as per design.

export default function NewContractPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get("campaign") || "";
  const ambassadorId = searchParams.get("ambassador") || "";
  return (
    <main className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/contracts"
          className="flex items-center text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span className="text-sm font-medium">Back to Contracts</span>
        </Link>
      </div>
      <ContractDraftForm
        initialCampaignId={campaignId}
        initialAmbassadorIds={ambassadorId ? [ambassadorId] : []}
      />
    </main>
  );
}
