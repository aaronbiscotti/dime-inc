"use client";

import { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { UserRole, Contract } from "@/types/database";
import { chatService, ChatParticipant } from "@/services/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ContextPanelProps {
  selectedChatId: string | null;
  userRole: UserRole;
}

export function ContextPanel({ selectedChatId, userRole }: ContextPanelProps) {
  const [otherParticipant, setOtherParticipant] = useState<ChatParticipant | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);
  const router = useRouter();

  // Load other participant data and contract when chat is selected
  useEffect(() => {
    if (!selectedChatId) {
      setOtherParticipant(null);
      setContract(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadOtherParticipantAndContract = async () => {
      try {
        const { data, error } = await chatService.getOtherParticipant(selectedChatId);
        if (error) {
          setError('Failed to load participant information');
          setOtherParticipant(null);
        } else {
          setOtherParticipant(data);
        }
        // Fetch contract details (now returns doc info if exists)
        const contractResponse = await chatService.getContractByChatId(selectedChatId);
        if (contractResponse.error) {
          setContract(null);
        } else {
          setContract(contractResponse.data as Contract | null);
        }
      } catch {
        setError('Failed to load context panel data');
        setOtherParticipant(null);
        setContract(null);
      }
      setIsLoading(false);
    };
    loadOtherParticipantAndContract();
  }, [selectedChatId]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDraftContract = async () => {
    if (!selectedChatId) return;
    setIsLoading(true);
    setError(null);
    // TODO: Implement contract creation
    // This feature is not yet implemented in the chatService
    setError('Contract creation not yet implemented');
    setIsLoading(false);
  };

  const handleGoToDraftContract = () => {
    if (!otherParticipant) return;
    // If the other participant is an ambassador, pass their id
    let ambassadorId = "";
    const campaignId = ""; // Campaign ID would need to be fetched from campaign_ambassadors relationship
    if (otherParticipant.role === "ambassador") {
      ambassadorId = (otherParticipant as unknown as Record<string, unknown>).id as string;
    }
    // If you have a campaignId, pass it; otherwise, just ambassador
    let url = "/contracts/new";
    const params = [];
    if (campaignId) params.push(`campaign=${campaignId}`);
    if (ambassadorId) params.push(`ambassador=${ambassadorId}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    router.push(url);
  };

  if (!selectedChatId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">Select a conversation to view details</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5d82e] mx-auto mb-2"></div>
          <p className="text-sm">Loading participant information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-red-500">
          <ExclamationCircleIcon className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!otherParticipant) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">No participant information available</p>
        </div>
      </div>
    );
  }

  // --- Simple UI: Only participant info and timeline ---
  let avatar: string | null = null;
  if (otherParticipant.role === 'ambassador') {
    avatar = (otherParticipant as unknown as Record<string, unknown>).profilePhoto as string || null;
  } else if (otherParticipant.role === 'client') {
    avatar = (otherParticipant as unknown as Record<string, unknown>).logo as string || null;
  }

  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-200 flex flex-col items-center p-6 flex-grow overflow-auto">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mb-3">
        {avatar ? (
          <Image src={avatar} alt={otherParticipant.name} width={80} height={80} className="w-full h-full object-cover rounded-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-600">
            {otherParticipant.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Name & Socials */}
      <div className="text-center mb-2">
        <h3 className="font-semibold text-gray-900 text-lg">{otherParticipant.name}</h3>
        {otherParticipant.role === 'ambassador' && (
          <div className="text-gray-500 text-sm mb-1">
            {otherParticipant.instagram_handle && (
              <span className="ml-2">Instagram: {otherParticipant.instagram_handle}</span>
            )}
            {otherParticipant.tiktok_handle && (
              <span className="ml-2">TikTok: {otherParticipant.tiktok_handle}</span>
            )}
            {otherParticipant.twitter_handle && (
              <span className="ml-2">Twitter: {otherParticipant.twitter_handle}</span>
            )}
          </div>
        )}
        {otherParticipant.role === 'client' && (
          <div className="text-gray-500 text-sm mb-1">
            {otherParticipant.industry && <span>{otherParticipant.industry}</span>}
            {otherParticipant.website && (
              <span className="ml-2">{otherParticipant.website}</span>
            )}
          </div>
        )}
      </div>
      <hr className="w-full border-gray-200 mb-4" />
      {/* Contract status UI */}
      <div className="mb-4 w-full">
        {contract ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowContractModal(true)}
          >
            <EyeIcon className="w-5 h-5 mr-2" /> View contract
          </Button>
        ) : (
          <div className="text-center text-gray-500 mb-2">
            <p className="text-sm">No contract yet</p>
          </div>
        )}
        {/* Only show Draft a Contract button for client users and if no contract exists */}
        {userRole === 'client' && !contract && (
          <Button
            variant="default"
            className="w-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full"
            onClick={handleGoToDraftContract}
            disabled={isLoading}
          >
            {isLoading ? "Drafting..." : "Draft a Contract"}
          </Button>
        )}
        {/* If contract exists, show status for all users */}
        {contract && (
          <Button
            variant="outline"
            className="w-full mt-2"
            disabled
          >
            Contract Exists
          </Button>
        )}
      </div>
      {/* Contract Modal */}
      {showContractModal && contract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-8 relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
              onClick={() => setShowContractModal(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-2 text-center">Contract Agreement</h2>
            <div className="mb-6 text-center text-gray-500 text-sm">
              Contract ID: <span className="font-mono">{contract.id}</span>
            </div>
            <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-4">
              <div>
                <div className="font-semibold text-gray-700">Campaign</div>
                <div className="text-gray-900">{(contract as Record<string, unknown>).campaign_name as string || 'N/A'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Ambassador</div>
                <div className="text-gray-900">{(contract as Record<string, unknown>).ambassador_name as string || 'N/A'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Status</div>
                <div className={contract.terms_accepted ? "text-green-700 font-semibold" : "text-yellow-700 font-semibold"}>
                  {contract.terms_accepted ? 'Active' : 'Draft'}
                </div>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-semibold text-gray-700">Created</div>
                <div className="text-gray-900">{contract.created_at ? new Date(contract.created_at).toLocaleString() : '-'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Start Date</div>
                <div className="text-gray-900">{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : '-'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Payment Type</div>
                <div className="text-gray-900">{contract.payment_type || '-'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Target Impressions</div>
                <div className="text-gray-900">{contract.target_impressions || '-'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Cost per CPM</div>
                <div className="text-gray-900">{contract.cost_per_cpm ? `$${contract.cost_per_cpm}` : '-'}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-700">Usage Rights Duration</div>
                <div className="text-gray-900">{contract.usage_rights_duration || '-'}</div>
              </div>
            </div>
            {contract.contract_text && (
              <div className="mb-6">
                <div className="font-semibold text-gray-700 mb-1">Contract Body</div>
                <div className="bg-gray-50 border border-gray-100 rounded p-4 text-gray-800 whitespace-pre-line text-base leading-relaxed">
                  {contract.contract_text}
                </div>
              </div>
            )}
            {contract.pdf_url && (
              <div className="mb-4">
                <a href={contract.pdf_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View PDF Version</a>
              </div>
            )}
            <div className="mt-8 text-xs text-gray-400 text-center">
              This contract is a digital agreement between the client and ambassador.<br />
              For questions, contact support.
            </div>
          </div>
        </div>
      )}
      {/* Activity Timeline */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-gray-900">Activity Timeline</span>
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">Contract started</span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">Jul 8</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">Previous milestones</span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">Sept 12</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-5 h-5 text-yellow-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">Milestone 3 completed</span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">Sept 12</span>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <span className="text-sm text-gray-900">Milestone 4</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap"></span>
          </div>
        </div>
        {/* Post submission */}
        <div className="mt-6">
          <label className="block text-sm text-gray-700 mb-1">Post submission</label>
          <div className="flex items-center gap-2 mb-4">
            <input type="text" placeholder="Upload here..." className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none" />
            <Button variant="outline" className="px-4 py-2 text-sm">Submit</Button>
          </div>
          {/* Ad Codes */}
          <label className="block text-sm text-gray-700 mb-1">Ad Codes (optional)</label>
          <div className="flex items-center gap-2 mb-4">
            <input type="text" placeholder="Upload here..." className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none" />
            <Button variant="outline" className="px-4 py-2 text-sm">Submit</Button>
          </div>
          {/* Propose More Work */}
          <div className="mb-4">
            <a href="#" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <span className="text-lg font-bold">+</span> Propose More Work?
            </a>
          </div>
          {/* Contract ends */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ClockIcon className="w-4 h-4" /> Contract ends
          </div>
        </div>
      </div>
    </div>
  );
}