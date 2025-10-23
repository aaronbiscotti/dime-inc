"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { getChatRoomsAction } from "@/app/(protected)/chat/actions";
import { useAuth } from "@/components/providers/AuthProvider";
import { GroupChatModal } from "./GroupChatModal";

// UI-specific chat type for sidebar display
interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isGroup: boolean;
  participants: string[];
}

interface ChatSidebarClientProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseMobile: () => void;
  chatsChanged?: number; // Trigger refresh
}

export function ChatSidebarClient({
  selectedChatId,
  onSelectChat,
  onCloseMobile,
  chatsChanged,
}: ChatSidebarClientProps) {
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const { user } = useAuth();

  // Fetch chats from server actions
  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const result = await getChatRoomsAction();
        if (result.ok) {
          // Transform the data to match the UI interface
          const transformedChats = result.data.map((chat: any) => ({
            id: chat.id,
            name: chat.name || "Unnamed Chat",
            lastMessage: "No messages yet",
            timestamp: chat.updated_at,
            unreadCount: 0, // This would need to be calculated separately
            isOnline: true, // This would need to be calculated separately
            isGroup: chat.is_group,
            participants:
              chat.chat_participants?.map((p: any) => p.user_id) || [],
          }));
          setChats(transformedChats);
        } else {
          console.error("Failed to fetch chats:", result.error);
        }
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [chatsChanged]);

  // Filter chats based on search and tab
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "group" ? chat.isGroup : !chat.isGroup;
    return matchesSearch && matchesTab;
  });

  const handleGroupChatCreated = () => {
    setShowGroupModal(false);
    // Trigger refresh by updating a state that causes useEffect to run
    // This is a simple approach - in a real app you might use a more sophisticated state management
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("private")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === "private"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Private
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === "group"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Group
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>No chats found</p>
            {activeTab === "group" && (
              <Button
                onClick={() => setShowGroupModal(true)}
                className="mt-2"
                size="sm"
              >
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChatId === chat.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      {chat.isGroup ? (
                        <UserGroupIcon className="w-5 h-5 text-gray-600" />
                      ) : (
                        <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {chat.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
                        {chat.unreadCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Button */}
      {activeTab === "group" && (
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={() => setShowGroupModal(true)}
            className="w-full"
            size="sm"
          >
            <UserGroupIcon className="w-4 h-4 mr-2" />
            Create Group Chat
          </Button>
        </div>
      )}

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        availableUsers={[]}
        onGroupCreated={handleGroupChatCreated}
      />
    </div>
  );
}
