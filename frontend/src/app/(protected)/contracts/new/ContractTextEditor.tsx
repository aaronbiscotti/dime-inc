"use client";
import React, { useState } from "react";

export default function ContractTextEditor({
  initialText,
  onBack,
  onSave,
}: {
  initialText: string;
  onBack: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initialText);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12">
      <div className="w-full max-w-[1200px] bg-white rounded-2xl shadow border p-0 flex flex-col items-center">
        <div className="w-full flex flex-col items-center border-b border-gray-300 py-6">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Contract Preview & Edit
          </h1>
        </div>
        <div className="w-full flex justify-center">
          <textarea
            className="w-[900px] border-none outline-none p-12 text-lg font-serif bg-white focus:outline-none resize-none shadow-none"
            style={{
              boxShadow: "0 1px 8px 0 rgba(60,64,67,.08)",
              minHeight: 600,
              maxWidth: 900,
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className="flex justify-between w-[900px] mt-8 mb-10">
          <button
            className="px-10 py-3 rounded-full border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition text-lg"
            onClick={onBack}
          >
            Back
          </button>
          <button
            className="px-12 py-3 rounded-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold shadow-sm border-none transition text-lg"
            onClick={() => onSave(text)}
          >
            Save & Finish
          </button>
        </div>
      </div>
    </div>
  );
}
