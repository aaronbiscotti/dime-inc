import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { chatService } from "@/services/chatService";

interface UseChatInitiationProps {
  participantId: string;
  participantName: string;
  participantRole: "client" | "ambassador";
}

export function useChatInitiation({
  participantId,
  participantName,
  participantRole,
}: UseChatInitiationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { profile, clientProfile, ambassadorProfile } = useAuth();
  const router = useRouter();

  const initiateChat = async () => {
    // Validate user role
    if (!profile) {
      console.error("User not authenticated");
      return;
    }

    if (profile.role === "client" && !clientProfile) {
      console.error("Client profile not found");
      return;
    }

    if (profile.role === "ambassador" && !ambassadorProfile) {
      console.error("Ambassador profile not found");
      return;
    }

    // Validate role compatibility
    if (profile.role === participantRole) {
      console.error("Cannot chat with users of the same role");
      return;
    }

    setIsLoading(true);
    try {
      // Create new chat (createChat handles existing chat detection)
      const { data: chat, error } = await chatService.createChat({
        participant_id: participantId,
        participant_name: participantName,
        participant_role: participantRole,
      });

      if (error || !chat) {
        console.error("Error creating chat:", error);
        return;
      }

      // Redirect to chat
      router.push(`/chats?chat=${chat.id}`);
    } catch (error) {
      console.error("Error initiating chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiateChat,
    isLoading,
    canInitiate: profile && profile.role !== participantRole,
  };
}
