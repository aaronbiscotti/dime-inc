"use client";
import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";

type EditorSummary = {
  clientName: string;
  campaignTitle?: string;
  ambassadors: Array<{ id: string; name?: string; avatar_url?: string | null }>;
  payType: "post" | "cpm" | null;
  startDate?: string;
};

export default function ContractTextEditor({
  initialText,
  onBack,
  onSave,
  summary,
}: {
  initialText: string;
  onBack: () => void;
  onSave: (text: string) => void;
  summary: EditorSummary;
}) {
  const [text, setText] = useState(initialText);

  // Auto-append signature section if not already present
  useEffect(() => {
    if (text && !text.includes("SIGNATURES:")) {
      const signatureSection = `

SIGNATURES:

By signing below, both parties agree to the terms and conditions outlined in this contract.

Client Signature:
_________________________    _________________________
Signature                    Date

Ambassador Signature:
_________________________    _________________________
Signature                    Date
`;
      setText(text + signatureSection);
    }
  }, [text]);

  const { wordCount, charCount } = useMemo(() => {
    const words = (text || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return { wordCount: words.length, charCount: (text || "").length };
  }, [text]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Confirm details */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-300 p-4 space-y-4">
              <div>
                <h2 className="text-base font-medium text-gray-900">Confirm Details</h2>
                <p className="text-xs text-gray-500">Review before saving the contract</p>
              </div>

              <div className="space-y-3 text-sm">
                {summary.campaignTitle && (
                  <div>
                    <div className="text-gray-500">Campaign</div>
                    <div className="font-medium text-gray-900">{summary.campaignTitle}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500">Client</div>
                  <div className="font-medium text-gray-900">{summary.clientName}</div>
                </div>
                <div>
                  <div className="text-gray-500">Payment</div>
                  <div className="font-medium text-gray-900 capitalize">
                    {summary.payType === "post"
                      ? "Pay per post"
                      : summary.payType === "cpm"
                      ? "Pay per CPM"
                      : "Not specified"}
                  </div>
                </div>
                {summary.startDate && (
                  <div>
                    <div className="text-gray-500">Start Date</div>
                    <div className="font-medium text-gray-900">{summary.startDate}</div>
                  </div>
                )}
                <div>
                  <div className="text-gray-500">Ambassadors</div>
                  <div className="mt-2 space-y-2">
                    {summary.ambassadors.length === 0 ? (
                      <div className="text-gray-500">None selected</div>
                    ) : (
                      summary.ambassadors.map((a) => (
                        <div key={a.id} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {a.avatar_url ? (
                              <Image
                                src={a.avatar_url}
                                alt={a.name || "Ambassador"}
                                width={28}
                                height={28}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-gray-600 font-semibold">
                                {(a.name || "A").charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="truncate text-gray-900 text-sm">{a.name || "Ambassador"}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 space-y-3">
                <button
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  onClick={onBack}
                >
                  Back
                </button>
                <button
                  className="w-full px-4 py-2.5 rounded-lg bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none transition-colors"
                  onClick={() => onSave(text)}
                >
                  Save & Finish
                </button>
                <div className="text-xs text-gray-500 text-center pt-1">
                  {wordCount} words · {charCount} characters
                </div>
              </div>
            </div>
          </aside>

          {/* Right: Document editor */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div className="text-sm text-gray-600">Contract Document</div>
                <div className="text-xs text-gray-500">Font: Serif · Editable</div>
              </div>
              <div className="p-0">
                <textarea
                  className="w-full h-[70vh] p-4 text-base md:text-lg font-serif bg-white outline-none resize-none leading-relaxed"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter your contract text here..."
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
