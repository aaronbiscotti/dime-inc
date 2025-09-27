'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Navbar } from '@/components/layout/Navbar'
import { ChatsSkeleton } from '@/components/skeletons/ChatsSkeleton'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function Chats() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return <ChatsSkeleton />
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
                Chats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#f5d82e] rounded-full flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-900" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600">
                  {profile.role === 'client'
                    ? 'Start chatting with ambassadors when you create campaigns'
                    : 'Start chatting with clients when you apply to campaigns'
                  }
                </p>
              </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}