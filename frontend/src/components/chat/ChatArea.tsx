"use client";

import { useState, useEffect, useRef } from "react";
import {
  EllipsisVerticalIcon,
  Bars3Icon,
  PaperClipIcon,
  PaperAirplaneIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { chatService, type Message as ChatMessage, type ChatParticipant } from "@/services/chatService";

interface Message extends ChatMessage {
  sender_name?: string;
}

interface ChatAreaProps {
  selectedChatId: string | null;
  onOpenMobileMenu: () => void;
  onParticipantsUpdate?: () => void;
  onChatDeleted?: (chatId: string) => void;
}

export function ChatArea({ selectedChatId, onOpenMobileMenu, onParticipantsUpdate, onChatDeleted }: ChatAreaProps) {
  const { user } = useAuth();
  
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatDisplayName, setChatDisplayName] = useState<string>("Unknown Chat");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState<ChatParticipant | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch chat data and messages
  useEffect(() => {
    if (!selectedChatId || !user) {
      setMessages([]);
      setChatDisplayName("Unknown Chat");
      setOtherParticipant(null);
      setIsGroupChat(false);
      setErrorMessage(null);
      
      // Clear polling when no chat selected
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const fetchChatData = async () => {
      setLoading(true);
      setErrorMessage(null);
      
      try {
        // Fetch chat room details
        const chatRoomResult = await chatService.getChatRoom(selectedChatId);
        
        if (chatRoomResult.error) {
          setErrorMessage(chatRoomResult.error.message);
          return;
        }
        
        const chatRoom = chatRoomResult.data;
        setIsGroupChat(chatRoom?.is_group || false);
        
        // For private chats, get the other participant's info
        if (!chatRoom?.is_group) {
          const participantResult = await chatService.getOtherParticipant(selectedChatId);
          
          if (participantResult.data) {
            setOtherParticipant(participantResult.data);
            setChatDisplayName(`Chat with ${participantResult.data.name}`);
          } else {
            setChatDisplayName("Private Chat");
          }
        } else {
          setChatDisplayName(chatRoom?.name || "Group Chat");
        }
        
        // Fetch initial messages
        await fetchMessages();
        
        // Notify parent about participants update
        if (onParticipantsUpdate) {
          onParticipantsUpdate();
        }
        
      } catch (error) {
        console.error("Error fetching chat data:", error);
        setErrorMessage("Failed to load chat. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
    
    // Set up polling for new messages every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      await fetchMessages(true); // Silent fetch, don't show loading
    }, 3000);
    
    // Cleanup polling on unmount or chat change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId, user, onParticipantsUpdate]);

  // Fetch messages function
  const fetchMessages = async (silent: boolean = false) => {
    if (!selectedChatId) return;
    
    if (!silent) {
      setLoading(true);
    }
    
    try {
      const result = await chatService.getMessages(selectedChatId, 100);
      
      if (result.error) {
        if (!silent) {
          console.error("Error fetching messages:", result.error.message);
        }
        return;
      }
      
      // Enrich messages with sender names
      const enrichedMessages = await Promise.all(
        (result.data || []).map(async (msg) => {
          // If we already have the other participant info and this is their message
          if (otherParticipant && msg.sender_id !== user?.id) {
            return {
              ...msg,
              sender_name: otherParticipant.name
            };
          }
          
          // For current user's messages
          if (msg.sender_id === user?.id) {
            return {
              ...msg,
              sender_name: "You"
            };
          }
          
          // For group chats or unknown senders, would need to fetch
          // For now, return with generic name
          return {
            ...msg,
            sender_name: "Unknown"
          };
        })
      );
      
      setMessages(enrichedMessages);
      
    } catch (error) {
      if (!silent) {
        console.error("Error fetching messages:", error);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChatId || !user || sending) return;

    setSending(true);
    setErrorMessage(null);
    
    try {
      const result = await chatService.sendMessage(selectedChatId, {
        content: messageInput.trim()
      });
      
      if (result.error) {
        setErrorMessage(`Failed to send message: ${result.error.message}`);
        return;
      }

      // Clear input on success
      setMessageInput("");
      
      // Immediately fetch messages to show the new one
      await fetchMessages(true);
      
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage("Failed to send message. Please try again.");
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
    setErrorMessage(null);

    try {
      const result = await chatService.deleteChat(selectedChatId);
      
      if (result.error) {
        setErrorMessage(`Failed to delete chat: ${result.error.message}`);
        return;
      }

      console.log('Chat deleted successfully');
      
      // Notify parent component
      if (onChatDeleted) {
        onChatDeleted(selectedChatId);
      }
      
      // Clear local state
      setMessages([]);
      setChatDisplayName("Unknown Chat");
      
    } catch (error) {
      console.error('Error deleting chat:', error);
      setErrorMessage("Failed to delete chat. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
  };

  // No chat selected state
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
              {isGroupChat ? (
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
                  {chatDisplayName.split(' ').pop()?.charAt(0) || '?'}
                </div>
              )}
            </div>

            {/* Chat Info */}
            <div>
              <h2 className="font-semibold text-gray-900">{chatDisplayName}</h2>
              <div className="text-sm text-gray-600">
                {isGroupChat ? "Group chat" : "Private chat"}
              </div>
            </div>
          </div>

          {/* Options Menu */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowOptionsMenu(!showOptionsMenu);
              }}
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

      {/* Error Message */}
      {errorMessage && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

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
            const senderName = message.sender_name || "Unknown";
            
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
                    {!isCurrentUser && isGroupChat && (
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
          {/* Backdrop */}
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
