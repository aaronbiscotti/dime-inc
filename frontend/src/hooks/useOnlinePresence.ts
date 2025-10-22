import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useOnlinePresence(chatRoomId: string | null, userId: string) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    if (!chatRoomId || !userId) return

    const channel = supabase
      .channel(`presence-${chatRoomId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const online = new Set<string>()
        
        Object.values(newState).forEach((presences: any[]) => {
          presences.forEach(presence => {
            online.add(presence.user_id)
          })
        })
        
        setOnlineUsers(online)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev)
          newPresences.forEach((presence: any) => updated.add(presence.user_id))
          return updated
        })
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers(prev => {
          const updated = new Set(prev)
          leftPresences.forEach((presence: any) => updated.delete(presence.user_id))
          return updated
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoomId, userId])

  return { onlineUsers }
}

