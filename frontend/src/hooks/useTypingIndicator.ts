import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TypingUser {
  user_id: string
  user_name: string
  timestamp: number
}

export function useTypingIndicator(chatRoomId: string | null, currentUserId: string, currentUserName: string) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const supabase = createClient()

  // Broadcast typing status
  const startTyping = useCallback(() => {
    if (!chatRoomId || isTyping) return
    
    setIsTyping(true)
    supabase.channel(`typing-${chatRoomId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: currentUserId,
        user_name: currentUserName,
        typing: true,
        timestamp: Date.now(),
      },
    })
  }, [chatRoomId, currentUserId, currentUserName, isTyping])

  const stopTyping = useCallback(() => {
    if (!chatRoomId || !isTyping) return
    
    setIsTyping(false)
    supabase.channel(`typing-${chatRoomId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: currentUserId,
        typing: false,
      },
    })
  }, [chatRoomId, currentUserId, isTyping])

  // Listen for typing events
  useEffect(() => {
    if (!chatRoomId) return

    const channel = supabase
      .channel(`typing-${chatRoomId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, typing, timestamp, user_name } = payload.payload

        if (user_id === currentUserId) return // Ignore own typing events

        setTypingUsers(prev => {
          if (typing) {
            // Add or update typing user
            const filtered = prev.filter(u => u.user_id !== user_id)
            return [...filtered, { user_id, user_name: user_name || 'Someone', timestamp }]
          } else {
            // Remove user from typing
            return prev.filter(u => u.user_id !== user_id)
          }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoomId, currentUserId])

  // Clean up old typing indicators (5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => prev.filter(u => now - u.timestamp < 5000))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return { typingUsers, startTyping, stopTyping, isTyping }
}

