"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  EllipsisVerticalIcon,
  Bars3Icon,
  PaperClipIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { chatService } from "@/services/chatService";
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
  onParticipantsUpdate?: () => void;
  onChatDeleted?: () => void;
}

export function ChatArea({ selectedChatId, onOpenMobileMenu, onParticipantsUpdate, onChatDeleted }: ChatAreaProps) {
  const { user } = useAuth();
  
  // Helper function to get participant name from user ID (same as ChatSidebar)
  const getParticipantNameFromUserId = useCallback(async (userId: string): Promise<string | null> => {
    try {
      console.log('ChatArea - looking up user ID:', userId);
      
      // Get the user's role first
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile) {
        console.log('ChatArea - no profile found for user ID:', userId);
        return null;
      }

      console.log('ChatArea - found profile role:', profile.role);

      // Get detailed profile based on role
      if (profile.role === 'ambassador') {
        const { data: ambassadorProfile } = await supabase
          .from('ambassador_profiles')
          .select('full_name')
          .eq('user_id', userId)
          .single();

        if (ambassadorProfile) {
          console.log('ChatArea - found ambassador name:', ambassadorProfile.full_name);
          return ambassadorProfile.full_name;
        }
      } else if (profile.role === 'client') {
        const { data: clientProfile } = await supabase
          .from('client_profiles')
          .select('company_name')
          .eq('user_id', userId)
          .single();

        if (clientProfile) {
          console.log('ChatArea - found client name:', clientProfile.company_name);
          return clientProfile.company_name;
        }
      }

      return null;
    } catch (error) {
      console.error('ChatArea - error looking up user:', error);
      return null;
    }
  }, []);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [chatDisplayName, setChatDisplayName] = useState<string>("Unknown Chat");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [sending, setSending] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update chat display name when chat room changes
  useEffect(() => {
    const updateDisplayName = async () => {
      if (!chatRoom) {
        setChatDisplayName("Unknown Chat");
        return;
      }

      const displayName = await getChatDisplayName();
      setChatDisplayName(displayName);
    };

    updateDisplayName();
  }, [chatRoom, user]); // Re-run when chatRoom or user changes
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

        // Get participants for the chat room (simple query to avoid RLS issues)
        const { data: participantsData, error: participantsError } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("chat_room_id", selectedChatId)
          .neq("user_id", user.id);

        if (participantsError) {
          console.error("Error fetching participants:", participantsError);
        }

        // Get profile details for other participants
        let participants: any[] = [];
        if (participantsData && participantsData.length > 0) {
          const otherUserIds = participantsData.map(p => p.user_id);
          console.log('Fetching profiles for other users:', otherUserIds);

          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select(`
              id, role,
              ambassador_profiles(full_name, profile_photo_url),
              client_profiles(company_name, logo_url)
            `)
            .in("id", otherUserIds);

          console.log('Profiles data:', profilesData, 'Error:', profilesError);

          if (profilesData) {
            participants = profilesData.map(profile => ({
              user_id: profile.id,
              profiles: { role: profile.role },
              ambassador_profiles: profile.ambassador_profiles || null,
              client_profiles: profile.client_profiles || null
            }));
            console.log('Mapped participants:', participants);
          }
        }

        setChatRoom({ 
          ...chatRoomData, 
          participants,
          is_group: chatRoomData.is_group || false
        });

        // Pass participants to parent component
        if (onParticipantsUpdate) {
          onParticipantsUpdate?.();
        }

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

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showOptionsMenu) {
        setShowOptionsMenu(false);
      }
    };

    if (showOptionsMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showOptionsMenu]);

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
  const getChatDisplayName = useCallback(async () => {
    if (!chatRoom) return "Unknown Chat";

    // For group chats, use the chat name
    if (chatRoom.is_group && chatRoom.name) {
      return chatRoom.name;
    }

    // For private chats, construct "Chat with {participant name}"
    if (chatRoom.participants && chatRoom.participants.length > 0) {
      const participant = chatRoom.participants[0];
      console.log('ChatArea - Getting name for participant:', participant);
      
      let participantName = "Unknown User";
      if (participant.profiles?.role === "ambassador" && participant.ambassador_profiles) {
        participantName = participant.ambassador_profiles.full_name;
      } else if (participant.profiles?.role === "client" && participant.client_profiles) {
        participantName = participant.client_profiles.company_name;
      }
      
      return `Chat with ${participantName}`;
    }

    // Fallback: try to parse neutral chat name format
    if (chatRoom.name && user) {
      console.log('ChatArea - no participants found, trying to parse chat name:', chatRoom.name);
      console.log('ChatArea - current user ID:', user.id);
      
      if (chatRoom.name.match(/^chat_([a-f0-9-]+)_([a-f0-9-]+)$/)) {
        // This is a neutral format chat name, try to get the other user ID
        const neutralMatch = chatRoom.name.match(/^chat_([a-f0-9-]+)_([a-f0-9-]+)$/);
        if (neutralMatch) {
          const [, userId1, userId2] = neutralMatch;
          const otherUserId = userId1 === user.id ? userId2 : userId1;
          console.log('ChatArea - found other user ID from neutral name:', otherUserId);
          
          // Try to get their profile
          const foundName = await getParticipantNameFromUserId(otherUserId);
          if (foundName) {
            console.log('ChatArea - successfully resolved name:', foundName);
            return `Chat with ${foundName}`;
          } else {
            console.log('ChatArea - could not resolve name, using fallback');
          }
        }
      } else if (chatRoom.name.match(/Chat with (.+)/)) {
        // Old format, keep as is
        return chatRoom.name;
      }
    }

    // Final fallback for private chats without participant info
    return "Private Chat";
  }, [chatRoom, user, getParticipantNameFromUserId]);

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

  const handleDeleteChat = async () => {
    if (!selectedChatId) return;

    setDeleting(true);
    setShowDeleteConfirm(false);
    setShowOptionsMenu(false);

    try {
      const result = await chatService.deleteChat(selectedChatId);
      
      if (result.error) {
        console.error('Failed to delete chat:', result.error);
        return;
      }

      console.log('Chat deleted successfully');
      
      // Notify parent component
      onChatDeleted?.();
      
      // Clear local state
      setMessages([]);
      setChatRoom(null);
      
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setDeleting(false);
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
                    chatDisplayName.includes("Team") ||
                    chatDisplayName.includes("Nike") ||
                    chatDisplayName.includes("Corp") ||
                    chatDisplayName.includes("Inc") ||
                    chatDisplayName.includes("LLC") ||
                    chatDisplayName.includes("Ltd") ||
                    chatDisplayName.includes("Company") ||
                    chatDisplayName.includes("Brand") ||
                    chatDisplayName.includes("Marketing")
                      ? "rounded-lg"
                      : "rounded-full"
                  }`}
                >
                  {chatDisplayName.charAt(0)}
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div>
              <h2 className="font-semibold text-gray-900">{chatDisplayName}</h2>
              {chatRoom?.is_group ? (
                <p className="text-sm text-gray-600">
                  {(chatRoom.participants?.length || 0) + 1} members
                </p>
              ) : (
                <div className="text-sm text-gray-600">
                  {typingUsers.size > 0 ? (
                    <span className="text-green-600 font-medium">Typing...</span>
                  ) : (
                    "Last seen recently"
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            >
              <EllipsisVerticalIcon className="w-5 h-5" />
            </Button>
            
            {showOptionsMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TrashIcon className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete Chat'}
                </button>
              </div>
            )}
          </div>
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
          <div className="text-center py-8 text-gray-600">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.sender_id === user?.id;
            const senderName = getSenderName(message);
            
            return (
              <div key={message.id}>
                <div
                  className={`flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } items-end gap-2`}
                >
                  {/* Avatar for other person's messages */}
                  {!isCurrentUser && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="max-w-[60%]">
                    {!isCurrentUser && chatRoom?.is_group && (
                      <p className="text-xs text-gray-600 mb-1 pl-3 font-medium">
                        {senderName}
                      </p>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        isCurrentUser
                          ? "bg-[#1a1a1a] text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className={`text-xs mt-1 ${
                      isCurrentUser 
                        ? "text-gray-400 text-right pr-3" 
                        : "text-gray-500 pl-3"
                    }`}>
                      {formatTimestamp(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start items-end gap-2">
            {/* Avatar for typing indicator */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
              ?
            </div>
            
            <div className="max-w-[45%]">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center space-x-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="sm" className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <PaperClipIcon className="w-5 h-5" />
          </Button>

          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onBlur={handleTypingStop}
              placeholder="Write something..."
              rows={1}
              disabled={sending}
              className="w-full resize-none border-0 bg-gray-50 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white max-h-24 disabled:opacity-50 text-sm"
              style={{
                minHeight: "42px",
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
            className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:bg-gray-100 disabled:text-gray-300 rounded-lg h-[42px] w-[42px] p-0"
            size="sm"
          >
            <PaperAirplaneIcon className={`w-5 h-5 ${sending ? 'opacity-50' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setShowDeleteConfirm(false)}
          />
          
          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Delete Chat</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone and will delete all messages in this conversation.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
