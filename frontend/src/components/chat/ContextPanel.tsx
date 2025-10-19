"use client";

import { useState, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/database";
import { chatService, OtherParticipant } from "@/services/chatService";
import Image from "next/image";

interface ContextPanelProps {
  selectedChatId: string | null;
  userRole: UserRole;
}

export function ContextPanel({ selectedChatId, userRole }: ContextPanelProps) {
  const [linkSubmission, setLinkSubmission] = useState("");
  const [adCodes, setAdCodes] = useState("");
  const [activeTab, setActiveTab] = useState("timeline");
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const [otherParticipant, setOtherParticipant] = useState<OtherParticipant | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        await chatService.debugChatParticipants(selectedChatId);
        const { data, error } = await chatService.getOtherParticipant(selectedChatId);
        if (error) {
          setError('Failed to load participant information');
          setOtherParticipant(null);
        } else {
          setOtherParticipant(data);
        }
        // Fetch contract details
        const contractResponse = await chatService.getContractByChatId(selectedChatId);
        if (contractResponse.error) {
          setContract(null);
        } else {
          setContract(contractResponse.data);
        }
      } catch (err) {
        setError('Failed to load participant information');
        setOtherParticipant(null);
        setContract(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadOtherParticipantAndContract();
    (window as any).debugChat = () => chatService.debugChatParticipants(selectedChatId);
  }, [selectedChatId]);

  const handleDraftContract = async () => {
    if (!selectedChatId) return;
    setIsLoading(true);
    setError(null);
    try {
      // You need to implement chatService.createContract for actual contract creation
      const { error } = await chatService.createContract(selectedChatId);
      if (error) {
        setError('Failed to draft contract');
      } else {
        setError(null);
        // Refetch contract
        const contractResponse = await chatService.getContractByChatId(selectedChatId);
        if (!contractResponse.error) {
          setContract(contractResponse.data);
        }
      }
    } catch (err) {
      setError('Failed to draft contract');
    } finally {
      setIsLoading(false);
    }
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
    avatar = (otherParticipant as any).profilePhoto || null;
  } else if (otherParticipant.role === 'client') {
    avatar = (otherParticipant as any).logo || null;
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
            {otherParticipant.instagramHandle && (
              <span className="ml-2">Instagram: {otherParticipant.instagramHandle}</span>
            )}
            {otherParticipant.tiktokHandle && (
              <span className="ml-2">TikTok: {otherParticipant.tiktokHandle}</span>
            )}
            {otherParticipant.twitterHandle && (
              <span className="ml-2">Twitter: {otherParticipant.twitterHandle}</span>
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
          <Button variant="ghost" className="mb-2 flex items-center gap-2 w-full">
            <EyeIcon className="w-5 h-5" /> View contract
          </Button>
        ) : (
          <div className="text-center text-gray-500 mb-2">
            <p className="text-sm">No contract yet</p>
          </div>
        )}
        {/* Only show Draft a Contract button for client users and if no contract exists */}
        {userRole === 'client' && !contract && (
          <Button
            variant="primary"
            className="w-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full"
            onClick={handleDraftContract}
            disabled={isLoading}
          >
            {isLoading ? "Drafting..." : "Draft a Contract"}
          </Button>
        )}
        {/* If contract exists, show status for all users */}
        {contract && (
          <Button
            variant="outline"
            className="w-full"
            disabled
          >
            Contract Exists
          </Button>
        )}
      </div>
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