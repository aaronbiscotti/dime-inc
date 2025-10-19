"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ContractPreviewPage({ params, searchParams }: any) {
  // We'll get the draft from localStorage or history state for now (for demo)
  let draft = null;
  if (typeof window !== "undefined") {
    draft = window.history.state?.usr?.contractDraft || null;
  }
  const [text, setText] = useState(draft?.text || draft?.defaultText || "");
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow border p-10">
        <h1 className="text-2xl font-bold mb-6 text-center">Contract Preview & Edit</h1>
        <textarea
          className="w-full h-[600px] border border-gray-300 rounded-lg p-6 text-lg font-mono bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#f5d82e] resize-vertical"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="flex justify-end mt-6">
          <button
            className="px-8 py-2 rounded-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold shadow-sm border-none transition"
            onClick={() => router.push("/contracts")}
          >
            Save & Finish
          </button>
        </div>
      </div>
    </div>
  );
}
