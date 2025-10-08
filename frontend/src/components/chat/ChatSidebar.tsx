"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Chat } from "@/types/database";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSidebarProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCloseMobile: () => void;
}

export function ChatSidebar({
  selectedChatId,
  onSelectChat,
  onCloseMobile,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"private" | "group">("private");
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch real chat data from database
  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;

      try {
        // First get chat room IDs that the user participates in
        const { data: userParticipations, error: participationError } =
          await supabase
            .from("chat_participants")
            .select("chat_room_id")
            .eq("user_id", user.id);

        if (participationError) {
          console.error(
            "Error fetching user participations:",
            participationError
          );
          return;
        }

        if (!userParticipations || userParticipations.length === 0) {
          setChats([]);
          return;
        }

        const chatRoomIds = userParticipations.map((p) => p.chat_room_id);

        // Now get the chat rooms using the IDs
        const { data: userChatRooms, error: chatRoomsError } = await supabase
          .from("chat_rooms")
          .select("id, name, is_group, created_at, updated_at")
          .in("id", chatRoomIds);

        if (chatRoomsError) {
          console.error("Error fetching chat rooms:", chatRoomsError);
          return;
        }

        // For each chat room, get the latest message and other participants
        const chatPromises = userChatRooms.map(async (chatRoom: any) => {
          // Get latest message (maybeSingle allows 0 or 1 row)
          const { data: latestMessage } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("chat_room_id", chatRoom.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get other participants (simple queries to avoid RLS issues)
          const { data: participantIds } = await supabase
            .from("chat_participants")
            .select("user_id")
            .eq("chat_room_id", chatRoom.id)
            .neq("user_id", user.id);

          let otherParticipants: any[] = [];
          if (participantIds && participantIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select(`
                id, role,
                ambassador_profiles(full_name, profile_photo_url),
                client_profiles(company_name, logo_url)
              `)
              .in("id", participantIds.map(p => p.user_id));

            if (profiles) {
              otherParticipants = profiles;
            }
          }

          // Format chat name
          let chatName = chatRoom.name;
          if (!chatName && otherParticipants && otherParticipants.length > 0) {
            const otherParticipant = otherParticipants[0] as any;
            if (
              otherParticipant.role === "ambassador" &&
              otherParticipant.ambassador_profiles?.[0]
            ) {
              chatName = otherParticipant.ambassador_profiles[0].full_name;
            } else if (
              otherParticipant.role === "client" &&
              otherParticipant.client_profiles?.[0]
            ) {
              chatName = otherParticipant.client_profiles[0].company_name;
            } else {
              chatName = "Unknown User";
            }
          }

          const chat: Chat = {
            id: chatRoom.id,
            name: chatName || "Unnamed Chat",
            lastMessage: latestMessage?.content || "No messages yet",
            timestamp: latestMessage
              ? new Date(latestMessage.created_at).toLocaleDateString()
              : new Date(chatRoom.created_at).toLocaleDateString(),
            unreadCount: 0, // TODO: Implement unread count tracking
            isOnline: false, // TODO: Implement online status
            isGroup: chatRoom.is_group,
            participants: otherParticipants?.map((p: any) => p.id) || [],
          };

          return chat;
        });

        const resolvedChats = (await Promise.all(chatPromises)).filter(
          Boolean
        ) as Chat[];
        setChats(resolvedChats);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const filteredChats = chats.filter(
    (chat) =>
      chat.isGroup === (activeTab === "group") &&
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200">
      {/* Header with close button for mobile */}
      <div className="p-4 border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button variant="ghost" size="sm" onClick={onCloseMobile}>
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("private")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "private"
                ? "text-gray-900 border-b-2 border-[#f5d82e]"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Private Chat
          </button>
          <button
            onClick={() => setActiveTab("group")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "group"
                ? "text-gray-900 border-b-2 border-[#f5d82e]"
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
            {Array(5).fill(0).map((_, i) => (
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
                          chat.name.includes("Team") ||
                          chat.name.includes("Nike") ||
                          chat.name.includes("Corp") ||
                          chat.name.includes("Inc") ||
                          chat.name.includes("LLC") ||
                          chat.name.includes("Ltd") ||
                          chat.name.includes("Company") ||
                          chat.name.includes("Brand") ||
                          chat.name.includes("Marketing")
                            ? "rounded-lg"
                            : "rounded-full"
                        }`}
                      >
                        {chat.name.charAt(0)}
                      </div>
                    )}
                    {chat.isOnline && !chat.isGroup && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
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
    </div>
  );
}
