"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InstagramMedia } from "@/services/instagramService";

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
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Check if Instagram is connected
  useEffect(() => {
    if (isOpen) {
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/instagram/connect");
      const data = await response.json();

      if (data.connected) {
        setConnected(true);
        setUsername(data.username);
        await fetchMedia();
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const handleConnectInstagram = async () => {
    try {
      setLoading(true);
      setError(null);

      // Initiate Instagram OAuth
      await signIn("instagram", {
        callbackUrl: window.location.href,
      });

      // After OAuth success, save connection
      const response = await fetch("/api/instagram/connect", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect Instagram");
      }

      setConnected(true);
      setUsername(data.username);
      await fetchMedia();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/instagram/media?limit=50");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch media");
      }

      setMedia(data.data || []);
    } catch (err: any) {
      setError(err.message);
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
    const selectedItems = media.filter((item) =>
      selectedMedia.has(item.id)
    );
    onContentSelected(selectedItems);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(0, 0, 0, 0.5)",
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-bounce-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Add Content</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {!connected ? (
            /* Not Connected - Show Connect Button */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 mb-4 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </div>

              <h3 className="text-xl font-semibold mb-2">
                Connect Your Instagram
              </h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Connect your Instagram Business or Creator account to import
                your Reels and analytics
              </p>

              <Button
                onClick={handleConnectInstagram}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              >
                {loading ? "Connecting..." : "Connect Instagram"}
              </Button>
            </div>
          ) : (
            /* Connected - Show Media Grid */
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  Connected as <span className="font-semibold">@{username}</span>
                </p>
                <p className="text-sm text-gray-500">
                  {selectedMedia.size} selected
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : media.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No Reels found. Make sure your account is set to Business or
                  Creator.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${
                        selectedMedia.has(item.id)
                          ? "border-purple-600 scale-95"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      onClick={() => toggleMediaSelection(item.id)}
                    >
                      <img
                        src={item.thumbnail_url || item.media_url}
                        alt={item.caption || "Instagram media"}
                        className="w-full h-full object-cover"
                      />

                      {/* Play icon for videos */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-white ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>

                      {/* Checkmark */}
                      {selectedMedia.has(item.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSelected}
                  disabled={selectedMedia.size === 0}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Add {selectedMedia.size > 0 && `(${selectedMedia.size})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
