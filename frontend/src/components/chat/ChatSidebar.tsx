"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { chatService, type ChatRoom } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { GroupChatModal } from "./GroupChatModal";
import { API_URL } from "@/config/api";

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

interface ChatSidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseMobile: () => void;
  chatsChanged?: number; // Trigger refresh
}

export function ChatSidebar({
  selectedChatId,
  onSelectChat,
  onCloseMobile,
  chatsChanged,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const { user } = useAuth();

  // Fetch chats from API (optimized single call)
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Single API call to get all chat data with messages and participants
        const result = await chatService.getUserChats();

        if (result.error) {
          console.error("Error fetching chats:", result.error.message);
          return;
        }

        const chatRooms = result.data || [];

        // Transform backend data to frontend format
        const formattedChats: Chat[] = chatRooms.map((chatRoom: any) => {
          const latestMessage = chatRoom.latest_message;

          // Format timestamp
          const timestamp = latestMessage?.created_at
            ? new Date(latestMessage.created_at).toLocaleDateString()
            : new Date(chatRoom.created_at).toLocaleDateString();

          return {
            id: chatRoom.id,
            name: chatRoom.display_name || "Unknown Chat",
            lastMessage: latestMessage?.content || "No messages yet",
            timestamp,
            unreadCount: 0, // TODO: Implement unread count tracking
            isOnline: false, // TODO: Implement online status
            isGroup: chatRoom.is_group,
            participants: [],
          };
        });

        setChats(formattedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user, chatsChanged]);

  // Fetch available users for group creation
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch from explore endpoint
        const response = await fetch(`${API_URL}/api/explore/ambassadors`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            const allUsers = data.data.map((profile: any) => ({
              id: profile.id, // FIX: Was profile.userId, which is incorrect. API returns user_id as 'id'.
              name: profile.name,
              email:
                profile.email || `user-temp-${profile.id.slice(-4)}@dime.com`,
            }));

            // FIX: Filter out the current user and remove duplicates to prevent issues in the modal
            const uniqueUsers = allUsers.filter(
              (u: { id: string | undefined }, index: any, self: any[]) =>
                u.id &&
                u.id !== user?.id &&
                index === self.findIndex((t) => t.id === u.id)
            );

            setAvailableUsers(uniqueUsers);
          }
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (showGroupModal) {
      fetchUsers();
    }
  }, [showGroupModal, user?.id]);

  const filteredChats = chats.filter(
    (chat) =>
      chat.isGroup === (activeTab === "group") &&
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-300">
      {/* Header with close button for mobile */}
      <div className="p-4 border-b border-gray-300 lg:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button variant="ghost" size="sm" onClick={onCloseMobile}>
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar and Group Creation Button */}
      <div className="p-4 border-b border-gray-300 space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
          />
        </div>

        {/* Create Group Chat Button */}
        <Button
          onClick={() => setShowGroupModal(true)}
          className="w-full bg-[#f5d82e] hover:bg-[#ffe066] text-black font-medium"
          size="sm"
        >
          <UserGroupIcon className="w-4 h-4 mr-2" />
          Create Group Chat
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-300">
        <div className="flex">
          <button
            onClick={() => setActiveTab("private")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "private"
                ? "text-gray-900 border-b border-[#f5d82e]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Private Chat
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "group"
                ? "text-gray-900 border-b border-[#f5d82e]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Group Chat
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-sm">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => {
                  onSelectChat(chat.id);
                  onCloseMobile();
                }}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedChatId === chat.id ? "bg-[#FEF9E7]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Profile Picture */}
                  <div className="relative">
                    {chat.isGroup ? (
                      <div className="w-10 h-10 bg-[#f5d82e] rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-900">
                          {chat.participants?.length || "G"}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`w-10 h-10 bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold ${
                          // Use square avatars for companies/clients
                          chat.name.includes("Chat with") &&
                          (chat.name.includes("Team") ||
                            chat.name.includes("Corp") ||
                            chat.name.includes("Inc") ||
                            chat.name.includes("LLC") ||
                            chat.name.includes("Ltd") ||
                            chat.name.includes("Company") ||
                            chat.name.includes("Brand") ||
                            chat.name.includes("Marketing") ||
                            chat.name.includes("Nike") ||
                            chat.name.includes("Adidas") ||
                            chat.name.includes("Apple") ||
                            chat.name.includes("Google"))
                            ? "rounded-lg"
                            : "rounded-full"
                        }`}
                      >
                        {/* Get first character from the participant name */}
                        {chat.name.startsWith("Chat with ")
                          ? chat.name.replace("Chat with ", "").charAt(0)
                          : chat.name.charAt(0)}
                      </div>
                    )}
                    {chat.isOnline && !chat.isGroup && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-sm truncate ${
                          chat.unreadCount > 0 ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {chat.name}
                      </h3>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {chat.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate">
                        {chat.lastMessage}
                      </p>
                      {chat.unreadCount > 0 && (
                        <span className="ml-2 bg-[#f5d82e] text-gray-900 text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        availableUsers={availableUsers}
        onGroupCreated={(chatId) => {
          onSelectChat(chatId);
          onCloseMobile();
          // Trigger chats refresh by notifying parent
          // Parent should increment chatsChanged prop
        }}
      />
    </div>
  );
}
