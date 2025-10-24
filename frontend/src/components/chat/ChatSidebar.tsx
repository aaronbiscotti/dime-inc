"use client";

import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { GroupChatModal } from "./GroupChatModal";
import { getUserChatsAction } from "@/app/(protected)/chat/actions";

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
        const result = await getUserChatsAction();

        if (result.error) {
          console.error("Error fetching chats:", result.error);
          return;
        }

        const chatRooms = result.data || [];

        // Transform backend data to UI format using real participants/messages
        const formattedChats: Chat[] = chatRooms.map((chatRoom: any) => {
          // Determine display name
          let displayName = "Unknown Chat";
          if (chatRoom.is_group) {
            displayName = chatRoom.name || "Group Chat";
          } else if (Array.isArray(chatRoom.chat_participants)) {
            const other = chatRoom.chat_participants.find(
              (p: any) => p.user_id !== user?.id
            );
            displayName =
              other?.profiles?.ambassador_profiles?.full_name ||
              other?.profiles?.client_profiles?.company_name ||
              other?.profiles?.email ||
              "Private Chat";
          }

          // Latest message (server may return embedded messages; prefer newest)
          const latestMessage = Array.isArray(chatRoom.messages)
            ? [...chatRoom.messages].sort(
                (a: any, b: any) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
              )[0]
            : undefined;

          const timestamp = latestMessage?.created_at
            ? new Date(latestMessage.created_at).toLocaleDateString()
            : new Date(chatRoom.created_at).toLocaleDateString();

          return {
            id: chatRoom.id,
            name: displayName,
            lastMessage: latestMessage?.content || "No messages yet",
            timestamp,
            unreadCount: 0, // TODO: implement unread count
            isOnline: false,
            isGroup: !!chatRoom.is_group,
            participants: chatRoom.chat_participants?.map((p: any) => p.user_id) || [],
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
        // Use Supabase directly instead of backend API
        const { supabaseBrowser } = await import("@/lib/supabase/client");
        const supabase = supabaseBrowser();

        // Get ambassador profiles
        const { data: ambassadorProfiles, error: ambassadorError } =
          await supabase.from("ambassador_profiles").select(`
            id,
            user_id,
            full_name,
            profiles!inner(
              email
            )
          `);

        if (ambassadorError) {
          console.error("Error fetching ambassador profiles:", ambassadorError);
          return;
        }

        // Get client profiles
        const { data: clientProfiles, error: clientError } =
          await supabase.from("client_profiles").select(`
            id,
            user_id,
            company_name,
            profiles!inner(
              email
            )
          `);

        if (clientError) {
          console.error("Error fetching client profiles:", clientError);
          return;
        }

        // Combine and format users
        const allUsers = [
          ...(ambassadorProfiles || []).map((profile: any) => ({
            id: profile.user_id,
            name: profile.full_name,
            email:
              profile.profiles?.email ||
              `user-${profile.id.slice(-4)}@dime.com`,
          })),
          ...(clientProfiles || []).map((profile: any) => ({
            id: profile.user_id,
            name: profile.company_name,
            email:
              profile.profiles?.email ||
              `user-${profile.id.slice(-4)}@dime.com`,
          })),
        ];

        // Filter out current user and duplicates
        const uniqueUsers = allUsers.filter(
          (u: { id: string | undefined }, index: any, self: any[]) =>
            u.id &&
            u.id !== user?.id &&
            index === self.findIndex((t) => t.id === u.id)
        );

        setAvailableUsers(uniqueUsers);
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

      {/* Desktop title to match spec */}
      <div className="p-4 border-b border-gray-300 hidden lg:block">
        <h2 className="text-lg font-semibold">Messages</h2>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
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
