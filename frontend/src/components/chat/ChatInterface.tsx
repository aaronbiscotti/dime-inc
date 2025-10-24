"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatSidebar } from "./ChatSidebar";
import { ChatArea } from "./ChatArea";
import { ContextPanel } from "./ContextPanel";
import { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

interface ChatInterfaceProps {
  userRole: UserRole;
}

export function ChatInterface({ userRole }: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL immediately (before first render)
  const chatIdFromUrl = searchParams.get("chat");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    chatIdFromUrl
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatsChanged, setChatsChanged] = useState(0); // NEW: track chat list changes

  // Sync with URL changes
  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (chatId && chatId !== selectedChatId) {
      setSelectedChatId(chatId);
      setIsMobileMenuOpen(false); // Close sidebar on mobile to show chat
    }
  }, [searchParams, selectedChatId]);

  // Handle chat selection - update URL
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    router.push(`/chats?chat=${chatId}`);
  };

  // NEW: handle chat deleted
  const handleChatDeleted = () => {
    setSelectedChatId(null);
    setChatsChanged((v) => v + 1); // trigger sidebar refresh
    window.location.replace("/chats"); // Force full page reload to /chats only
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="h-[calc(100vh-145px)] flex gap-6">
        {/* Left Sidebar - Chat List */}
        <div
          className={`w-72 flex-shrink-0 ${
            isMobileMenuOpen ? "block" : "hidden"
          } lg:block`}
        >
          <ChatSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            chatsChanged={chatsChanged} // NEW
          />
        </div>

        {/* Center Column - Active Chat */}
        <div className="flex-1 min-w-0">
          <ChatArea
            selectedChatId={selectedChatId}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onChatDeleted={handleChatDeleted}
          />
        </div>

        {/* Right Sidebar - Context Panel */}
        {selectedChatId && (
          <div className="w-80 flex-shrink-0 lg:block">
            <ContextPanel selectedChatId={selectedChatId} userRole={userRole} />
          </div>
        )}
      </div>
    </div>
  );
}
