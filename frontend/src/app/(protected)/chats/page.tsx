"use client";

import { Suspense } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { ChatInterface } from "@/components/chat/ChatInterface";

function ChatsContent() {
  const { profile } = useAuth();

  return <>{profile && <ChatInterface userRole={profile.role} />}</>;
}

export default function Chats() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <ChatsContent />
    </Suspense>
  );
}
