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
import { UserRole, Contract } from "@/types/database";
import { chatService, ChatParticipant, ChatRoom } from "@/services/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ContextPanelProps {
  selectedChatId: string | null;
  userRole: UserRole;
}

export function ContextPanel({ selectedChatId, userRole }: ContextPanelProps) {
  const { user } = useAuth();
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [otherParticipant, setOtherParticipant] =
    useState<ChatParticipant | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!selectedChatId) {
      setOtherParticipant(null);
      setParticipants([]);
      setContract(null);
      setError(null);
      setIsGroupChat(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const loadChatContext = async () => {
      try {
        console.log("[ContextPanel] Loading chat context for:", selectedChatId);
        
        const chatRoomRes = await chatService.getChatRoom(selectedChatId);
        if (chatRoomRes.error || !chatRoomRes.data) {
          console.error("[ContextPanel] Failed to load chat room:", chatRoomRes.error);
          throw new Error("Failed to load chat information");
        }

        const isGroup = chatRoomRes.data.is_group;
        setIsGroupChat(isGroup);
        console.log("[ContextPanel] Chat room loaded, isGroup:", isGroup);

        if (isGroup) {
          const participantsRes = await chatService.getParticipants(
            selectedChatId
          );
          if (participantsRes.error) {
            console.error("[ContextPanel] Failed to load participants:", participantsRes.error);
            throw new Error("Failed to load participants");
          }
          setParticipants(participantsRes.data || []);
          console.log("[ContextPanel] Participants loaded:", participantsRes.data?.length);
        } else {
          const participantRes = await chatService.getOtherParticipant(
            selectedChatId
          );
          if (participantRes.error || !participantRes.data) {
            console.error("[ContextPanel] Failed to load other participant:", participantRes.error);
            throw new Error("Failed to load participant information");
          }
          setOtherParticipant(participantRes.data);
          console.log("[ContextPanel] Other participant loaded:", participantRes.data.name);

          const contractRes = await chatService.getContractByChatId(
            selectedChatId
          );
          if (!contractRes.error && contractRes.data) {
            setContract(contractRes.data);
            console.log("[ContextPanel] Contract loaded:", contractRes.data.id);
          } else {
            console.log("[ContextPanel] No contract found for this chat");
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
    if (otherParticipant.role === "ambassador") {
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
      const { data: chatRoom, error: chatError } = await chatService.createChat(
        {
          participant_id: participant.user_id,
          participant_name: participant.name,
          participant_role: participant.role,
        }
      );

      if (chatError || !chatRoom) {
        console.error("Failed to create or find private chat:", chatError);
        setError("Could not open a private chat with this participant.");
        return;
      }

      // Navigate to the private chat, which will then show the contract panel
      router.push(`/chats?chat=${chatRoom.id}`);
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
      otherParticipant.profile_photo || otherParticipant.logo_url || null;

    return (
      <>
        {/* Avatar */}
        <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mb-3">
          {avatar ? (
            <Image
              src={avatar}
              alt={otherParticipant.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-semibold text-gray-600">
              {otherParticipant.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Name & Role */}
        <div className="text-center mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">
            {otherParticipant.name}
          </h3>
          <p className="text-sm text-gray-500 capitalize">
            {otherParticipant.role}
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
          const avatar = p.profile_photo || p.logo_url;
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
                    alt={p.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-medium">
                    {p.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-gray-800 truncate">
                  {p.user_id === user?.id ? "You" : p.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">{p.role}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full bg-white rounded-xl border border-gray-300 flex flex-col items-center p-6 flex-grow overflow-auto">
      {isGroupChat ? <GroupParticipantsView /> : <SingleParticipantView />}
    </div>
  );
}
