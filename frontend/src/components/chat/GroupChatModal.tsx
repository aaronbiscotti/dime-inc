import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { chatService } from "@/services/chatService";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableUsers: User[];
  onGroupCreated: (chatId: string) => void;
}

export function GroupChatModal({
  isOpen,
  onClose,
  availableUsers,
  onGroupCreated,
}: GroupChatModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);

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
      // Log the request payload
      const payload = {
        name: groupName.trim(),
        participant_ids: Array.from(selectedUsers),
      };
      console.log("[GroupChatModal] Creating group chat:", payload);

      const result = await chatService.createGroupChat(payload);
      console.log("[GroupChatModal] Result:", result);

      if (result.error || !result.data) {
        console.error("[GroupChatModal] Error:", result.error);
        alert(`Error: ${result.error?.message || "Failed to create group"}`);
        return;
      }

      onGroupCreated(result.data.id);
      onClose();

      // Reset form
      setGroupName("");
      setSelectedUsers(new Set());
    } catch (error) {
      console.error("[GroupChatModal] Catch error:", error);
      alert("Failed to create group chat");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Group Chat">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e]"
            placeholder="Enter group name..."
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Participants ({selectedUsers.size})
          </label>
          <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
            {availableUsers.length === 0 ? (
              <p
                key="no-users"
                className="text-sm text-gray-500 text-center py-4"
              >
                No users available
              </p>
            ) : (
              <>
                {availableUsers.map((user, index) => {
                  const isSelected = selectedUsers.has(user.id);
                  return (
                    <label
                      key={`user-${user.id}-${index}`}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleUserToggle(user.id)}
                        className="rounded border-gray-300"
                      />
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={creating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            className="flex-1 bg-[#f5d82e] hover:bg-[#ffe066] text-black"
            disabled={!groupName.trim() || selectedUsers.size === 0 || creating}
          >
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
