"use client";

import { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ChevronDownIcon,
  EyeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Database } from "@/types/database";
import { ActivityTimeline } from "./ActivityTimeline";

type UserRole = Database["public"]["Enums"]["user_role"];
type Contract = Database["public"]["Tables"]["contracts"]["Row"];
// Types defined locally since they're not exported from actions
interface ChatParticipant {
  id: string;
  user_id: string;
  profiles: {
    id: string;
    email: string | null;
    role: string;
    ambassador_profiles?: {
      id: string;
      full_name: string;
      profile_photo_url: string | null;
      instagram_handle: string | null;
    };
    client_profiles?: {
      id: string;
      company_name: string;
      logo_url: string | null;
    };
  };
}

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { createChatAction } from "@/app/(protected)/chat/actions";

interface ContextPanelProps {
  selectedChatId: string | null;
  userRole: UserRole;
}

export function ContextPanel({ selectedChatId, userRole }: ContextPanelProps) {
  const { user } = useAuth();
  const supabase = supabaseBrowser();
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [otherParticipant, setOtherParticipant] =
    useState<ChatParticipant | null>(null);
  const [contract, setContract] = useState<any>(null);
  const [campaignAmbassador, setCampaignAmbassador] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [adCodeUrl, setAdCodeUrl] = useState("");
  const [submittingAdCode, setSubmittingAdCode] = useState(false);

  useEffect(() => {
    if (!selectedChatId) {
      setOtherParticipant(null);
      setParticipants([]);
      setContract(null);
      setCampaignAmbassador(null);
      setError(null);
      setIsGroupChat(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadChatContext = async () => {
      try {
        console.log("[ContextPanel] Loading chat context for:", selectedChatId);

        const chatRoomRes = await supabase
          .from("chat_rooms")
          .select("*")
          .eq("id", selectedChatId)
          .single();
        if (chatRoomRes.error || !chatRoomRes.data) {
          console.error(
            "[ContextPanel] Failed to load chat room:",
            chatRoomRes.error
          );
          throw new Error("Failed to load chat information");
        }

        const isGroup = chatRoomRes.data.is_group;
        setIsGroupChat(!!isGroup);
        console.log("[ContextPanel] Chat room loaded, isGroup:", isGroup);

        if (isGroup) {
          const participantsRes = await supabase
            .from("chat_participants")
            .select(
              `
              *,
              profiles!inner(*)
            `
            )
            .eq("chat_room_id", selectedChatId);
          if (participantsRes.error) {
            console.error(
              "[ContextPanel] Failed to load participants:",
              participantsRes.error
            );
            throw new Error("Failed to load participants");
          }
          setParticipants(
            (participantsRes.data || []) as unknown as ChatParticipant[]
          );
          console.log(
            "[ContextPanel] Participants loaded:",
            participantsRes.data?.length
          );
        } else {
          const participantRes = await supabase
            .from("chat_participants")
            .select(
              `
              *,
              profiles!inner(*)
            `
            )
            .eq("chat_room_id", selectedChatId)
            .neq("user_id", user?.id || "")
            .single();
          if (participantRes.error || !participantRes.data) {
            console.error(
              "[ContextPanel] Failed to load other participant:",
              participantRes.error
            );

            // Check if this is an orphaned chat that should be cleaned up
            if (
              participantRes.error &&
              "shouldRemove" in participantRes.error &&
              participantRes.error.shouldRemove
            ) {
              console.log(
                "[ContextPanel] Chat appears to be orphaned, attempting cleanup"
              );
              // Redirect to chats page without the problematic chat
              router.push("/chats");
              return;
            }

            throw new Error("Failed to load participant information");
          }
          setOtherParticipant(
            participantRes.data as unknown as ChatParticipant
          );
          console.log(
            "[ContextPanel] Other participant loaded:",
            participantRes.data.profiles?.email
          );

          const contractRes = await supabase
            .from("contracts")
            .select("*")
            .eq("chat_room_id", selectedChatId)
            .single();
          if (!contractRes.error && contractRes.data) {
            setContract(contractRes.data);
            console.log("[ContextPanel] Contract loaded:", contractRes.data.id);
          } else {
            console.log("[ContextPanel] No contract found for this chat");
          }

          // Fetch campaign ambassador status
          const campaignAmbassadorRes = await supabase
            .from("campaign_ambassadors")
            .select("*")
            .eq("chat_room_id", selectedChatId)
            .single();
          if (!campaignAmbassadorRes.error && campaignAmbassadorRes.data) {
            let campaignAmbassadorData = campaignAmbassadorRes.data;

            // Frontend guard: If contract is active but campaign_ambassador_status is not contract_signed,
            // override the status to show the correct state
            if (
              contractRes.data &&
              (contractRes.data as any).status === "active" &&
              campaignAmbassadorData.status !== "contract_signed"
            ) {
              console.log(
                "[ContextPanel] Frontend guard: Contract is active but campaign_ambassador_status is",
                campaignAmbassadorData.status,
                "- overriding to contract_signed"
              );
              campaignAmbassadorData = {
                ...campaignAmbassadorData,
                status: "contract_signed",
              };
            }

            setCampaignAmbassador(campaignAmbassadorData);
            console.log(
              "[ContextPanel] Campaign ambassador status loaded:",
              campaignAmbassadorData.status
            );
          } else {
            console.log(
              "[ContextPanel] No campaign ambassador found for this chat"
            );
          }
        }
      } catch (err) {
        console.error("[ContextPanel] Error loading context:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load context data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadChatContext();
  }, [selectedChatId]);

  const handleGoToDraftContract = () => {
    if (!otherParticipant) return;

    let ambassadorId = "";
    if (otherParticipant.profiles.role === "ambassador") {
      // Use the ambassador_profile_id which is the correct ID for contract creation
      ambassadorId = (otherParticipant as any).ambassador_profile_id || "";
    }

    let url = "/contracts/new";
    if (ambassadorId) {
      url += `?ambassador=${ambassadorId}`;
    }

    router.push(url);
  };

  const handleParticipantClick = async (participant: ChatParticipant) => {
    // Only clients can initiate contract chats from the group panel, and not with themselves
    if (userRole !== "client" || !user || participant.user_id === user.id) {
      return;
    }

    try {
      // Use server action to create-or-get a private chat with participant
      const formData = new FormData();
      formData.append("participantId", participant.user_id);

      const result = await createChatAction(null as any, formData);

      if (!result.ok || !result.data) {
        console.error("Failed to create or find private chat:", result);
        setError("Could not open a private chat with this participant.");
        return;
      }

      // Navigate to the private chat, which will then show the contract panel
      router.push(`/chats?chat=${result.data.id}`);
    } catch (err) {
      console.error("Error handling participant click:", err);
      setError("An unexpected error occurred while trying to open the chat.");
    }
  };

  if (!selectedChatId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-gray-500">
        <p className="text-sm">Select a conversation to view details</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b border-[#f5d82e] mx-auto mb-2"></div>
        <p className="text-sm">Loading details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center text-red-500">
        <ExclamationCircleIcon className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const SingleParticipantView = () => {
    if (!otherParticipant) return null;
    let avatar: string | null =
      otherParticipant.profiles?.ambassador_profiles?.profile_photo_url ||
      otherParticipant.profiles?.client_profiles?.logo_url ||
      null;

    return (
      <>
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mb-3">
          {avatar ? (
            <Image
              src={avatar}
              alt={otherParticipant.profiles?.email || "Unknown"}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-600">
              {(otherParticipant.profiles?.email || "U").charAt(0)}
            </div>
          )}
        </div>

        {/* Name & Role */}
        <div className="text-center mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">
            {otherParticipant.profiles?.email || "Unknown"}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {otherParticipant.profiles.role}
          </p>
        </div>
        <hr className="w-full border-gray-300 mb-4" />
        {/* Contract status UI */}
        <div className="mb-4 w-full">
          {contract ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/contracts/${contract.id}`)}
            >
              <EyeIcon className="w-5 h-5 mr-2" /> View contract
            </Button>
          ) : (
            <div className="text-center text-gray-500 mb-2">
              <p className="text-sm">No contract yet</p>
            </div>
          )}
          {userRole === "client" && !contract && (
            <Button
              variant="default"
              className="w-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-semibold border-none shadow-sm rounded-full"
              onClick={handleGoToDraftContract}
              disabled={isLoading}
            >
              {isLoading ? "Drafting..." : "Draft a Contract"}
            </Button>
          )}
        </div>

        {/* Activity Timeline */}
        {campaignAmbassador && (
          <div className="mt-6">
            <ActivityTimeline
              status={campaignAmbassador.status}
              createdAt={campaignAmbassador.created_at}
              selectedAt={campaignAmbassador.selected_at}
              contractCreatedAt={contract?.created_at}
              campaignTitle={campaignAmbassador.campaigns?.title}
              ambassadorName={campaignAmbassador.ambassador_profiles?.full_name}
            />
          </div>
        )}
      </>
    );
  };

  const GroupParticipantsView = () => (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <UserGroupIcon className="w-6 h-6 text-gray-500" />
        <h3 className="font-semibold text-gray-900 text-lg">
          Group Participants ({participants.length})
        </h3>
      </div>
      <div className="space-y-3">
        {participants.map((p) => {
          const avatar =
            p.profiles?.ambassador_profiles?.profile_photo_url ||
            p.profiles?.client_profiles?.logo_url;
          const isClickable = userRole === "client" && p.user_id !== user?.id;
          return (
            <div
              key={p.user_id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                isClickable ? "cursor-pointer hover:bg-gray-50" : ""
              }`}
              onClick={() => handleParticipantClick(p)}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={p.profiles?.email || "Unknown"}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {(p.profiles?.email || "U").charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-gray-800 truncate">
                  {p.user_id === user?.id
                    ? "You"
                    : p.profiles?.email || "Unknown"}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {p.profiles.role}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isGroupChat) {
    return (
      <div className="h-full w-full overflow-auto flex flex-col gap-4">
        {/* Campaign Overview card (matches design) */}
        <div className="bg-white rounded-xl border border-gray-300 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Campaign Overview</h3>
          </div>
          <div className="mt-3 space-y-1 text-sm text-gray-700">
            {campaignAmbassador?.campaigns?.client_profiles?.company_name && (
              <p>
                <span className="font-medium">Brand:</span>{" "}
                {campaignAmbassador.campaigns.client_profiles.company_name}
              </p>
            )}
            {campaignAmbassador?.campaigns?.title && (
              <p>
                <span className="font-medium">Campaign:</span>{" "}
                {campaignAmbassador.campaigns.title}
              </p>
            )}
            {campaignAmbassador?.created_at && (
              <p>
                <span className="font-medium">Duration:</span>{" "}
                {new Date(campaignAmbassador.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Upload + Link sections */}
          <div className="mt-4 space-y-3">
            <details className="bg-white rounded-xl p-0 border border-gray-200 overflow-hidden">
              <summary className="cursor-pointer font-semibold text-gray-900 px-4 py-3 flex items-center justify-between">
                <span>Post Submission</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </summary>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center bg-white border border-gray-300 rounded-full h-11 px-4 text-sm text-gray-500">
                    Upload here...
                  </div>
                  <Button className="bg-gray-200 text-gray-600 font-semibold rounded-full h-11 px-5" disabled>
                    Submit
                  </Button>
                </div>
              </div>
            </details>

            <details className="bg-white rounded-xl p-0 border border-gray-200 overflow-hidden">
              <summary className="cursor-pointer font-semibold text-gray-900 px-4 py-3 flex items-center justify-between">
                <span>Ad Codes</span>
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </summary>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="Paste a link..."
                    value={adCodeUrl}
                    onChange={(e) => setAdCodeUrl(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-full h-11 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
                  />
                  <Button
                    onClick={async () => {
                      if (!selectedChatId || !user?.id || !adCodeUrl.trim()) return;
                      try {
                        setSubmittingAdCode(true);
                        await supabase
                          .from("messages")
                          .insert({
                            chat_room_id: selectedChatId,
                            sender_id: user.id,
                            content: adCodeUrl.trim(),
                            message_type: "ad_code",
                          });
                        setAdCodeUrl("");
                      } finally {
                        setSubmittingAdCode(false);
                      }
                    }}
                    disabled={!adCodeUrl.trim() || submittingAdCode}
                    className="bg-[#f5d82e] text-black font-semibold rounded-full h-11 px-5 disabled:opacity-50"
                  >
                    {submittingAdCode ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Participants card */}
        <div className="bg-white rounded-xl border border-gray-300 p-5">
          <GroupParticipantsView />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-300 flex flex-col items-center p-6 flex-grow overflow-auto">
      <SingleParticipantView />
    </div>
  );
}
