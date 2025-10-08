'use client'

import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { ProfileGuard } from '@/components/auth/ProfileGuard'

function ChatsContent() {
  const { profile } = useAuth()

  return (
    <>
      <Navbar />
      {profile && <ChatInterface userRole={profile.role} />}
    </>
  )
}

export default function Chats() {
  return (
    <ProfileGuard>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-gray-600">Loading...</div>
          </div>
        }>
          <ChatsContent />
        </Suspense>
      </div>
    </ProfileGuard>
  )
}