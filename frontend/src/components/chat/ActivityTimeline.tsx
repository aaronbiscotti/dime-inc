"use client";

import { useState } from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  EnvelopeIcon,
  HandThumbUpIcon,
  PlayIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";

type CampaignAmbassadorStatus = Database["public"]["Enums"]["campaign_ambassador_status"];

interface ActivityTimelineProps {
  status: CampaignAmbassadorStatus;
  createdAt?: string;
  selectedAt?: string;
  contractCreatedAt?: string;
  campaignTitle?: string;
  ambassadorName?: string;
}

interface TimelineItem {
  id: string;
  status: CampaignAmbassadorStatus;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  isCompleted: boolean;
  isActive: boolean;
  date?: string;
}

export function ActivityTimeline({
  status, 
  createdAt, 
  selectedAt, 
  contractCreatedAt,
  campaignTitle, 
  ambassadorName 
}: ActivityTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getTimelineItems = (): TimelineItem[] => {
    const items: TimelineItem[] = [
      {
        id: "proposal_received",
        status: "proposal_received",
        title: "Proposal received",
        description: "Campaign invitation sent and received",
        icon: <EnvelopeIcon className="w-4 h-4" />,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        isCompleted: status !== "proposal_received",
        isActive: status === "proposal_received",
        date: createdAt ? new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined,
      },
      {
        id: "contract_drafted",
        status: "contract_drafted",
        title: "Contract drafted",
        description: contractCreatedAt
          ? "Contract drafted and ready for review"
          : "Proposal accepted. Contract will be drafted next",
        icon: <DocumentTextIcon className="w-4 h-4" />,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        isCompleted: ["contract_drafted", "contract_signed", "active", "complete"].includes(status),
        isActive: status === "contract_drafted",
        date: contractCreatedAt ? new Date(contractCreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined,
      },
      {
        id: "contract_signed",
        status: "contract_signed",
        title: "Contract signed",
        description: "Both parties have signed the contract",
        icon: <HandThumbUpIcon className="w-4 h-4" />,
        color: "text-green-600",
        bgColor: "bg-green-100",
        isCompleted: ["contract_signed", "active", "complete"].includes(status),
        isActive: status === "contract_signed",
        date: undefined,
      },
      {
        id: "active",
        status: "active",
        title: "Campaign active",
        description: "Campaign is live and work has begun",
        icon: <PlayIcon className="w-4 h-4" />,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        isCompleted: ["active", "complete"].includes(status),
        isActive: status === "active",
        date: undefined,
      },
      {
        id: "complete",
        status: "complete",
        title: "Campaign complete",
        description: "All deliverables submitted and approved",
        icon: <TrophyIcon className="w-4 h-4" />,
        color: "text-green-600",
        bgColor: "bg-green-100",
        isCompleted: status === "complete",
        isActive: status === "complete",
        date: undefined,
      },
    ];

    // Add terminated status if applicable
    if (status === "terminated") {
      items.push({
        id: "terminated",
        status: "terminated",
        title: "Campaign terminated",
        description: "Campaign was terminated",
        icon: <ExclamationCircleIcon className="w-4 h-4" />,
        color: "text-red-600",
        bgColor: "bg-red-100",
        isCompleted: true,
        isActive: true,
        date: undefined,
      });
    }

    return items;
  };

  const timelineItems = getTimelineItems();
  const currentItem = timelineItems.find(item => item.isActive);

  return (
    <div className="w-full">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer mb-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-semibold text-gray-900 text-lg">Activity Timeline</h3>
        {isExpanded ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {timelineItems.map((item, index) => (
              <div key={item.id} className="relative flex items-start gap-4 pb-4">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.isCompleted 
                    ? item.bgColor 
                    : item.isActive 
                      ? `${item.bgColor} ring-2 ring-offset-2 ring-current` 
                      : "bg-gray-100"
                }`}>
                  <div className={`${
                    item.isCompleted || item.isActive ? item.color : "text-gray-400"
                  }`}>
                    {item.isCompleted ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : item.isActive ? (
                      item.icon
                    ) : (
                      <ClockIcon className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium text-sm ${
                      item.isCompleted || item.isActive ? "text-gray-900" : "text-gray-500"
                    }`}>
                      {item.title}
                    </h4>
                    {item.isActive && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                    {item.date && (
                      <span className="text-xs text-gray-500">{item.date}</span>
                    )}
                  </div>
                  <p className={`text-xs ${
                    item.isCompleted || item.isActive ? "text-gray-600" : "text-gray-400"
                  }`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Current Status Actions */}
          {currentItem && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Current Status: {currentItem.title}</h4>
              
              {status === "proposal_received" && (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-sm">
                      Campaign invitation sent. Waiting for ambassador to accept the proposal.
                    </p>
                  </div>
                </div>
              )}

              {status === "contract_drafted" && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 text-sm">
                      Contract drafted and ready for review and signatures.
                    </p>
                  </div>
                </div>
              )}

              {status === "contract_signed" && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      Contract signed by both parties. Campaign can begin.
                    </p>
                  </div>
                </div>
              )}

              {status === "active" && (
                <div className="space-y-3">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                    <p className="text-purple-800 text-sm">
                      Campaign is active. Work has begun and deliverables are being created.
                    </p>
                  </div>
                  
                  {/* Post Submission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post submission
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Upload here..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div className="flex -space-x-1">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                          A
                        </div>
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                          C
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ad Codes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Codes (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Upload here..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {status === "complete" && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 text-sm">
                      Campaign completed. All deliverables have been submitted and approved.
                    </p>
                  </div>
                </div>
              )}

              {status === "terminated" && (
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-800 text-sm">
                      This campaign has been terminated. Contact support if you have questions.
                    </p>
                  </div>
                </div>
              )}

              {/* Propose More Work - only show for active or complete campaigns */}
              {(status === "active" || status === "complete") && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <PlusIcon className="w-4 h-4" />
                    Propose More Work?
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contract End (subtle, no divider line) */}
          <div className="pt-3">
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-700">
              <DocumentTextIcon className="w-4 h-4" />
              Contract end details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
