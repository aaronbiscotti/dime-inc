"use client";

import { useState } from "react";
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentTextIcon,
  LinkIcon,
  TagIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types/database";
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

  if (!selectedChatId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">Select a conversation to view details</p>
        </div>
      </div>
    );
  }

  // Mock data - replace with real data
  const mockCampaign = {
    id: "campaign-1",
    title: "Summer Collection Launch",
    clientName: "Nike",
    clientLogo: "/logos/nike.jpg",
    startDate: "2025-09-15",
    endDate: "2025-10-15",
    progress: 65,
  };

  const mockAmbassador = {
    id: "ambassador-1",
    name: "Sarah Johnson",
    username: "sarahjohnson",
    profilePicture: "/avatars/sarah.jpg",
    instagramHandle: "@sarah.johnson",
    tiktokHandle: "@sarahjohnson",
    followers: "125K",
  };

  const mockMilestones = [
    {
      id: "1",
      name: "Contract Signed",
      status: "completed",
      date: "2025-09-15",
      description: "Initial agreement signed",
    },
    {
      id: "2",
      name: "Content Planning",
      status: "completed",
      date: "2025-09-18",
      description: "Content strategy approved",
    },
    {
      id: "3",
      name: "Link Submission",
      status: "active",
      date: "2025-09-25",
      description: "Submit your published post link",
    },
    {
      id: "4",
      name: "Content Review",
      status: "pending",
      date: "2025-09-28",
      description: "Client review and feedback",
    },
    {
      id: "5",
      name: "Campaign Launch",
      status: "pending",
      date: "2025-10-01",
      description: "Content goes live",
    },
  ];

  const handleLinkSubmit = () => {
    if (linkSubmission.trim()) {
      // Handle link submission logic
      console.log("Link submitted:", linkSubmission);
      setLinkSubmission("");
    }
  };

  const handleCodesSubmit = () => {
    if (adCodes.trim()) {
      // Handle codes submission logic
      console.log("Codes submitted:", adCodes);
      setAdCodes("");
    }
  };

  if (userRole === "ambassador") {
    return (
      <div className="h-full overflow-y-auto bg-white rounded-xl border border-gray-200">
        <div className="p-6">
          {/* Campaign Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 text-lg font-semibold">
                {mockCampaign.clientName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {mockCampaign.clientName}
                </h3>
                <p className="text-sm text-gray-600">{mockCampaign.title}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CalendarIcon className="w-4 h-4" />
                <span>
                  {mockCampaign.startDate} - {mockCampaign.endDate}
                </span>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{mockCampaign.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#f5d82e] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mockCampaign.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "timeline"
                  ? "border-[#f5d82e] text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("submission")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "submission"
                  ? "border-[#f5d82e] text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Submission
            </button>
          </div>

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">
                  Activity Timeline
                </h4>
                <button
                  onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isTimelineExpanded ? (
                    <ChevronUpIcon className="w-5 h-5" />
                  ) : (
                    <ChevronDownIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {isTimelineExpanded && (
                <div className="space-y-4">
                  {mockMilestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            milestone.status === "completed"
                              ? "bg-green-500 border-green-500 text-white"
                              : milestone.status === "active"
                              ? "bg-[#f5d82e] border-[#f5d82e] text-gray-900 animate-pulse"
                              : "bg-white border-gray-300 text-gray-400"
                          }`}
                        >
                          {milestone.status === "completed" ? (
                            <CheckCircleIcon className="w-3 h-3" />
                          ) : milestone.status === "active" ? (
                            <ExclamationCircleIcon className="w-3 h-3" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                          )}
                        </div>
                        {index < mockMilestones.length - 1 && (
                          <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between mb-1">
                          <h4
                            className={`text-sm font-medium ${
                              milestone.status === "completed"
                                ? "text-gray-900"
                                : milestone.status === "active"
                                ? "text-gray-900"
                                : "text-gray-500"
                            }`}
                          >
                            {milestone.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {milestone.date}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {milestone.description}
                        </p>
                        {milestone.status === "active" && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            Awaiting submission
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submission Tab */}
          {activeTab === "submission" && (
            <div className="space-y-6">
              {/* Link Submission */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Link Submission
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Post Link
                    </label>
                    <input
                      type="url"
                      value={linkSubmission}
                      onChange={(e) => setLinkSubmission(e.target.value)}
                      placeholder="https://instagram.com/p/your-post-link"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the link to your published post
                    </p>
                  </div>

                  <Button
                    onClick={handleLinkSubmit}
                    className="w-full bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
                    disabled={!linkSubmission.trim()}
                  >
                    Submit Link
                  </Button>
                </div>
              </div>

              {/* Ad Codes (Optional) */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  Ad Codes
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    Optional
                  </span>
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promotional Codes
                    </label>
                    <textarea
                      value={adCodes}
                      onChange={(e) => setAdCodes(e.target.value)}
                      placeholder="Enter promotional codes (e.g., SUMMER20, NIKE15)..."
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter one code per line. These will be shared with your
                      audience.
                    </p>
                  </div>

                  <Button
                    onClick={handleCodesSubmit}
                    variant="outline"
                    className="w-full"
                    disabled={!adCodes.trim()}
                  >
                    Submit Codes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Client view
  return (
    <div className="h-full overflow-y-auto bg-white rounded-xl border border-gray-200">
      <div className="p-6 space-y-6">
        {/* Ambassador Profile */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-semibold mx-auto mb-3">
                {mockAmbassador.name.charAt(0)}
              </div>
              <h3 className="font-semibold text-gray-900">
                {mockAmbassador.name}
              </h3>
              <p className="text-sm text-gray-600">
                @{mockAmbassador.username}
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <a
                href={`https://instagram.com/${mockAmbassador.instagramHandle.replace(
                  "@",
                  ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f5d82e] transition-colors"
              >
                <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center text-white text-xs font-semibold">
                  I
                </div>
                <span>{mockAmbassador.instagramHandle}</span>
                <LinkIcon className="w-3 h-3" />
              </a>
              <a
                href={`https://tiktok.com/${mockAmbassador.tiktokHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#f5d82e] transition-colors"
              >
                <div className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center text-white text-xs font-semibold">
                  T
                </div>
                <span>{mockAmbassador.tiktokHandle}</span>
                <LinkIcon className="w-3 h-3" />
              </a>
            </div>

            <Button className="w-full bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 mb-3">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              View Contract
            </Button>

            <Button variant="outline" className="w-full">
              Browse Ambassadors
            </Button>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClockIcon className="w-5 h-5" />
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockMilestones.map((milestone, index) => (
                <div key={milestone.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        milestone.status === "completed"
                          ? "bg-green-500 border-green-500 text-white"
                          : milestone.status === "active"
                          ? "bg-[#f5d82e] border-[#f5d82e] text-gray-900 animate-pulse"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {milestone.status === "completed" ? (
                        <CheckCircleIcon className="w-3 h-3" />
                      ) : milestone.status === "active" ? (
                        <ExclamationCircleIcon className="w-3 h-3" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      )}
                    </div>
                    {index < mockMilestones.length - 1 && (
                      <div className="w-0.5 h-8 bg-gray-200 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4
                        className={`text-sm font-medium ${
                          milestone.status === "completed"
                            ? "text-gray-900"
                            : milestone.status === "active"
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {milestone.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {milestone.date}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {milestone.description}
                    </p>
                    {milestone.status === "active" && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        Awaiting submission
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <Button variant="outline" className="w-full mb-3">
                Propose More Work
              </Button>
              <div className="text-center">
                <p className="text-xs text-gray-500">Campaign ends in</p>
                <p className="text-sm font-semibold text-gray-900">12 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
