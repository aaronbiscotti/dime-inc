"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { InstagramMedia, instagramService } from "@/services/instagramService";
import { API_URL } from "@/config/api";

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContentSelected: (mediaItems: InstagramMedia[]) => void;
}

export function AddContentModal({
  isOpen,
  onClose,
  onContentSelected,
}: AddContentModalProps) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const connection = await instagramService.getConnection();

      if (connection.connected) {
        setConnected(true);
        setUsername(connection.username || null);
        await fetchMedia();
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  }, []);

  // Check if Instagram is connected
  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen, checkConnection]);

  const handleConnectInstagram = async () => {
    try {
      const response = await fetch(`${API_URL}/api/instagram/auth-url`);
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url; // Redirect user to Instagram
      } else {
        setError("Could not initiate Instagram connection.");
      }
    } catch {
      setError("Failed to connect to the server.");
    }
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const mediaData = await instagramService.getUserMedia(50);
      setMedia(mediaData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleMediaSelection = (mediaId: string) => {
    const newSelection = new Set(selectedMedia);
    if (newSelection.has(mediaId)) {
      newSelection.delete(mediaId);
    } else {
      newSelection.add(mediaId);
    }
    setSelectedMedia(newSelection);
  };

  const handleAddSelected = () => {
    const selectedItems = media.filter((item) => selectedMedia.has(item.id));
    onContentSelected(selectedItems);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Content" maxWidth="4xl">
      {/* Coming Soon Message */}
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 mb-4 bg-gradient-to-br from-[#f5d82e] to-[#FEE65D] rounded-xl flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-900"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>

        <h3 className="text-xl font-semibold mb-2 text-gray-900">Add Content Feature Coming Soon</h3>
        <p className="text-gray-600 text-center mb-6 max-w-md">
          We're working on bringing you the ability to easily import and showcase your Instagram content. Stay tuned!
        </p>

        <Button
          onClick={onClose}
          className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900"
        >
          Got it
        </Button>
      </div>
    </Modal>
  );
}
