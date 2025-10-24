"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { createChatAction, createGroupChatAction } from "@/app/(protected)/chat/actions";
import { Check } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export function CreateChatModal({
  isOpen,
  onClose,
  onChatCreated,
}: CreateChatModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedUsers(new Set());
      setGroupName("");
      setCreating(false);
      fetchUsers();
    }
  }, [isOpen]);

  // Fetch available users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Use Supabase directly to fetch users
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
          email: profile.profiles.email,
        })),
        ...(clientProfiles || []).map((profile: any) => ({
          id: profile.user_id,
          name: profile.company_name,
          email: profile.profiles.email,
        })),
      ];

      setAvailableUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreateChat = async () => {
    if (selectedUsers.size === 0) return;

    setCreating(true);
    try {
      if (selectedUsers.size === 1) {
        // Create direct message
        const formData = new FormData();
        formData.append("participantId", Array.from(selectedUsers)[0]);
        
        const result = await createChatAction(null, formData);
        
        if (result.ok && result.data) {
          onChatCreated(result.data.id);
          onClose();
        } else {
          console.error("Error creating direct message:", result.error);
          alert(`Error: ${result.error || "Failed to create direct message"}`);
        }
      } else {
        // Create group chat
        if (!groupName.trim()) {
          alert("Please enter a group name");
          return;
        }

        const formData = new FormData();
        formData.append("name", groupName);
        formData.append("participantIds", JSON.stringify(Array.from(selectedUsers)));
        
        const result = await createGroupChatAction(null, formData);
        
        if (result.ok && result.data) {
          onChatCreated(result.data.id);
          onClose();
        } else {
          console.error("Error creating group chat:", result.error);
          alert(`Error: ${result.error || "Failed to create group chat"}`);
        }
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat");
    } finally {
      setCreating(false);
    }
  };

  const isDirectMessage = selectedUsers.size === 1;
  const isGroupChat = selectedUsers.size > 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isDirectMessage ? "Start Direct Message" : isGroupChat ? "Create Group Chat" : "Start New Conversation"}
    >
      <div className="space-y-4">
        {/* Group Name - only show for group chats */}
        {isGroupChat && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
              placeholder="Enter group name..."
              maxLength={50}
            />
          </div>
        )}

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isDirectMessage ? "Select Person" : isGroupChat ? `Select Members (${selectedUsers.size})` : "Select People"}
          </label>
          
          {loadingUsers ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">Loading users...</div>
            </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-sm text-gray-500">No users available</div>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.has(user.id)
                      ? "bg-[#f5d82e] text-black"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleUserToggle(user.id)}
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {selectedUsers.has(user.id) && (
                    <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateChat}
            disabled={creating || selectedUsers.size === 0 || (isGroupChat && !groupName.trim())}
            className="flex-1 px-4 py-2 bg-[#f5d82e] text-black rounded-lg hover:bg-[#e5c820] disabled:opacity-50 disabled:bg-gray-300 font-medium"
          >
            {creating ? "Creating..." : isDirectMessage ? "Start Chat" : isGroupChat ? "Create Group" : "Create Chat"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
