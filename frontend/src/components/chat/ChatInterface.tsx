'use client'

import { useState } from 'react'
import { ChatSidebar } from './ChatSidebar'
import { ChatArea } from './ChatArea'
import { ContextPanel } from './ContextPanel'
import { UserRole } from '@/types/database'

interface ChatInterfaceProps {
  userRole: UserRole
}

export function ChatInterface({ userRole }: ChatInterfaceProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="h-[calc(100vh-145px)] flex gap-6">
        {/* Left Sidebar - Chat List */}
        <div className={`w-80 flex-shrink-0 ${
          isMobileMenuOpen ? 'block' : 'hidden'
        } lg:block`}>
          <ChatSidebar
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>

        {/* Center Column - Active Chat */}
        <div className="flex-1 min-w-0">
          <ChatArea
            selectedChatId={selectedChatId}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
        </div>

        {/* Right Sidebar - Context Panel */}
        <div className={`w-96 flex-shrink-0 ${
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