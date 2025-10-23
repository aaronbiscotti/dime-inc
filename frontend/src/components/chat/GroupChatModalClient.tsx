"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { createChatRoomAction } from "@/app/(protected)/chat/actions";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface GroupChatModalClientProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

export function GroupChatModalClient({
  isOpen,
  onClose,
  onGroupCreated,
}: GroupChatModalClientProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Load available users when modal opens
  useState(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  });

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // In a real implementation, you would fetch users from a server action
      // For now, we'll use mock data
      const mockUsers: User[] = [
        { id: "1", name: "John Doe", email: "john@example.com" },
        { id: "2", name: "Jane Smith", email: "jane@example.com" },
        { id: "3", name: "Bob Johnson", email: "bob@example.com" },
      ];
      setAvailableUsers(mockUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
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

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.size === 0) return;

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", groupName.trim());
      formData.append("isGroup", "true");
      formData.append(
        "participantIds",
        JSON.stringify(Array.from(selectedUsers))
      );

      const result = await createChatRoomAction(null, formData);

      if (result.ok) {
        setGroupName("");
        setSelectedUsers(new Set());
        onGroupCreated();
        onClose();
      } else {
        console.error("Failed to create group chat:", result.error);
        // You might want to show an error message to the user
      }
    } catch (error) {
      console.error("Error creating group chat:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setSelectedUsers(new Set());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Group Chat"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Group Name */}
        <div>
          <label
            htmlFor="groupName"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Group Name
          </label>
          <input
            id="groupName"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Members
          </label>
          {loadingUsers ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleUserToggle(user.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Users Count */}
        {selectedUsers.size > 0 && (
          <p className="text-sm text-gray-600">
            {selectedUsers.size} member{selectedUsers.size !== 1 ? "s" : ""}{" "}
            selected
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button onClick={handleClose} variant="outline" disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.size === 0 || creating}
          >
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
