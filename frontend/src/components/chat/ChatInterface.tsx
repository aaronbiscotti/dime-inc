'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChatSidebar } from './ChatSidebar'
import { ChatArea } from './ChatArea'
import { ContextPanel } from './ContextPanel'
import { UserRole } from '@/types/database'

interface ChatInterfaceProps {
  userRole: UserRole
}

export function ChatInterface({ userRole }: ChatInterfaceProps) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Initialize state from URL immediately (before first render)
  const chatIdFromUrl = searchParams.get('chat')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(chatIdFromUrl)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Sync with URL changes
  useEffect(() => {
    const chatId = searchParams.get('chat')
    if (chatId && chatId !== selectedChatId) {
      setSelectedChatId(chatId)
      setIsMobileMenuOpen(false) // Close sidebar on mobile to show chat
    }
  }, [searchParams, selectedChatId])

  // Handle chat selection - update URL
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)
    router.push(`/chats?chat=${chatId}`)
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-[calc(100vh-145px)] flex gap-6">
        {/* Left Sidebar - Chat List */}
        <div className={`w-72 flex-shrink-0 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        } lg:block`}>
          <ChatSidebar
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Center Column - Active Chat */}
        <div className="flex-1 min-w-0">
          <ChatArea
            selectedChatId={selectedChatId}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onChatDeleted={() => setSelectedChatId(null)}
          />
        </div>

        {/* Right Sidebar - Context Panel */}
        <div className={`w-80 flex-shrink-0 ${
          selectedChatId ? 'block' : 'hidden'
        } lg:block`}>
          <ContextPanel
            selectedChatId={selectedChatId}
            userRole={userRole}
          />
        </div>
      </div>
    </div>
  )
}