import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import ContractDraftForm from "./ContractDraftForm";
import styles from "./page.module.css";

// Contract drafting page UI will be implemented here.
// TODO: Implement modern contract drafting UI as per design.

export default function NewContractPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="w-full max-w-7xl mx-auto flex flex-col">
        <div className="flex items-center mb-6 mt-4">
          <Link
            href="/contracts"
            className="flex items-center text-gray-500 hover:text-gray-800 transition mr-4"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-base font-medium">Back</span>
          </Link>
          <h1 className="text-2xl font-bold mx-auto">Send an contract</h1>
        </div>
        <main className="max-w-9xl mx-auto p-8 bg-white rounded-xl shadow border mt-10">
          <ContractDraftForm />
        </main>
      </div>
    </div>
  );
}
