"use client";

import { useState, useEffect, useRef } from "react";
import {
  EllipsisVerticalIcon,
  Bars3Icon,
  PaperClipIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  sender_id: string;
  chat_room_id: string;
  content: string;
  created_at: string;
  sender?: {
    role: string;
    ambassador_profiles?: { full_name: string };
    client_profiles?: { company_name: string };
  };
}

interface ChatRoom {
  id: string;
  name: string | null;
  is_group: boolean;
  participants?: Array<{
    user_id: string;
    profiles: {
      role: string;
    };
    ambassador_profiles?: { full_name: string };
    client_profiles?: { company_name: string };
  }>;
}

interface ChatAreaProps {
  selectedChatId: string | null;
  onOpenMobileMenu: () => void;
}

export function ChatArea({ selectedChatId, onOpenMobileMenu }: ChatAreaProps) {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat room data and set up real-time messaging
  useEffect(() => {
    if (!selectedChatId || !user) {
      setMessages([]);
      setChatRoom(null);
      if (channel) {
        supabase.removeChannel(channel);
        setChannel(null);
      }
      return;
    }

    const fetchChatData = async () => {
      setLoading(true);
      try {
        // Get chat room details
        const { data: chatRoomData, error: chatError } = await supabase
          .from("chat_rooms")
          .select("id, name, is_group")
          .eq("id", selectedChatId)
          .single();

        if (chatError || !chatRoomData) {
          console.error("Error fetching chat room:", chatError);
          return;
        }

        // Get participants for the chat room using join to avoid policy issues
        const { data: participantsData } = await supabase
          .from("chat_rooms")
          .select(`
            chat_participants!inner(
              user_id,
              profiles!inner(
                id, role,
                ambassador_profiles(full_name),
                client_profiles(company_name)
              )
            )
          `)
          .eq("id", selectedChatId)
          .neq("chat_participants.user_id", user.id)
          .single();

        let participants: any[] = [];
        if (participantsData?.chat_participants) {
          participants = participantsData.chat_participants.map((participant: any) => ({
            user_id: participant.user_id,
            profiles: participant.profiles,
            ambassador_profiles: participant.profiles?.ambassador_profiles?.[0] || null,
            client_profiles: participant.profiles?.client_profiles?.[0] || null
          }));
        }

        setChatRoom({ ...chatRoomData, participants });

        // Fetch existing messages
        const { data: messagesData, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            sender_id,
            chat_room_id,
            content,
            created_at,
            sender:profiles(
              role,
              ambassador_profiles(full_name),
              client_profiles(company_name)
            )
          `)
          .eq("chat_room_id", selectedChatId)
          .order("created_at", { ascending: true });

        if (!messagesError && messagesData) {
          setMessages(messagesData as Message[]);
        }

      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, [selectedChatId, user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!selectedChatId || !user) return;

    // Clean up existing channel
    if (channel) {
      supabase.removeChannel(channel);
    }

    // Create new channel for this chat room
    const newChannel = supabase
      .channel(`chat:${selectedChatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${selectedChatId}`,
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data: newMessage } = await supabase
            .from("messages")
            .select(`
              id,
              sender_id,
              chat_room_id,
              content,
              created_at,
              sender:profiles(
                role,
                ambassador_profiles(full_name),
                client_profiles(company_name)
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages(prev => [...prev, newMessage as Message]);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = newChannel.presenceState();
        const users = new Set<string>();

        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            if (presence.user_id !== user.id && presence.typing) {
              users.add(presence.user_id);
            }
          });
        });

        setTypingUsers(users);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Track presence for this user
          await newChannel.track({
            user_id: user.id,
            typing: false,
            online_at: new Date().toISOString(),
          });
        }
      });

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [selectedChatId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle typing indicators
  const handleTypingStart = async () => {
    if (!channel || isTyping) return;

    setIsTyping(true);
    await channel.track({
      user_id: user?.id,
      typing: true,
      online_at: new Date().toISOString(),
    });

    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(async () => {
      if (channel) {
        await channel.track({
          user_id: user?.id,
          typing: false,
          online_at: new Date().toISOString(),
        });
      }
      setIsTyping(false);
    }, 3000);
  };

  const handleTypingStop = async () => {
    if (!channel || !isTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    await channel.track({
      user_id: user?.id,
      typing: false,
      online_at: new Date().toISOString(),
    });
    setIsTyping(false);
  };

  // Get chat display name
  const getChatDisplayName = () => {
    if (!chatRoom) return "Unknown Chat";

    if (chatRoom.name) return chatRoom.name;

    if (chatRoom.participants && chatRoom.participants.length > 0) {
      const participant = chatRoom.participants[0];
      if (participant.profiles?.role === "ambassador" && participant.ambassador_profiles) {
        return participant.ambassador_profiles.full_name;
      } else if (participant.profiles?.role === "client" && participant.client_profiles) {
        return participant.client_profiles.company_name;
      }
    }

    return "Unknown User";
  };

  // Format message timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get sender display name
  const getSenderName = (message: Message) => {
    if (!message.sender) return "Unknown";

    if (message.sender.role === "ambassador" && message.sender.ambassador_profiles) {
      return message.sender.ambassador_profiles.full_name;
    } else if (message.sender.role === "client" && message.sender.client_profiles) {
      return message.sender.client_profiles.company_name;
    }

    return "Unknown User";
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId || !user || sending) return;

    setSending(true);
    try {
      // Stop typing indicator
      await handleTypingStop();

      // Send message to database
      const { error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          chat_room_id: selectedChatId,
          content: messageInput.trim(),
        });

      if (error) {
        console.error("Error sending message:", error);
        return;
      }

      // Clear input
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    handleTypingStart();
  };

  if (!selectedChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#f5d82e] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a conversation to start messaging
          </h3>
          <p className="text-gray-600 max-w-sm">
            Choose a conversation from the sidebar to view messages and continue
            your discussion.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenMobileMenu}
              className="lg:hidden"
            >
              <Bars3Icon className="w-5 h-5" />
            </Button>

            {/* Profile Picture */}
            <div className="relative">
              {chatRoom?.is_group ? (
                <div className="w-10 h-10 bg-[#f5d82e] rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-gray-900">G</span>
                </div>
              ) : (
                <div
                  className={`w-10 h-10 bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-semibold ${
                    getChatDisplayName().includes("Team") ||
                    getChatDisplayName().includes("Nike") ||
                    getChatDisplayName().includes("Corp") ||
                    getChatDisplayName().includes("Inc") ||
                    getChatDisplayName().includes("LLC") ||
                    getChatDisplayName().includes("Ltd") ||
                    getChatDisplayName().includes("Company") ||
                    getChatDisplayName().includes("Brand") ||
                    getChatDisplayName().includes("Marketing")
                      ? "rounded-lg"
                      : "rounded-full"
                  }`}
                >
                  {getChatDisplayName().charAt(0)}
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div>
              <h2 className="font-semibold text-gray-900">{getChatDisplayName()}</h2>
              {chatRoom?.is_group ? (
                <p className="text-sm text-gray-500">
                  {(chatRoom.participants?.length || 0) + 1} members
                </p>
              ) : (
                <div className="text-sm text-gray-500">
                  {typingUsers.size > 0 ? (
                    <span className="text-green-600">Typing...</span>
                  ) : (
                    "Last seen recently"
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Options Menu */}
          <Button variant="ghost" size="sm">
            <EllipsisVerticalIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {/* Message skeletons */}
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-xs lg:max-w-md xl:max-w-lg animate-pulse">
                  <div className={`px-4 py-2 rounded-2xl ${
                    i % 2 === 0
                      ? 'bg-gray-200'
                      : 'bg-gray-200'
                  }`}>
                    <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                    <div className="h-4 bg-gray-300 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-16 mt-1 mx-3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${
                  message.sender_id === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                    message.sender_id === user?.id ? "order-2" : "order-1"
                  }`}
                >
                  {message.sender_id !== user?.id && chatRoom?.is_group && (
                    <p className="text-xs text-gray-500 mb-1 px-3">
                      {getSenderName(message)}
                    </p>
                  )}
                  <div
                    className={`px-4 py-2 rounded-2xl ${
                      message.sender_id === user?.id
                        ? "bg-[#FEE65D] text-gray-900"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-3">
                    {formatTimestamp(message.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="max-w-xs lg:max-w-md xl:max-w-lg">
              <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1 px-3">
                Someone is typing...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 rounded-b-xl">
        <div className="flex items-end gap-3">
          <Button variant="ghost" size="sm" className="flex-shrink-0">
            <PaperClipIcon className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={handleTypingStop}
              placeholder="Type a message..."
              rows={1}
              disabled={sending}
              className="w-full resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent max-h-24 disabled:opacity-50"
              style={{
                minHeight: "40px",
                height: "auto",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 96) + "px";
              }}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sending}
            className="flex-shrink-0 bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 disabled:bg-gray-200 disabled:text-gray-400"
            size="sm"
          >
            <PaperAirplaneIcon className={`w-5 h-5 ${sending ? 'opacity-50' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
