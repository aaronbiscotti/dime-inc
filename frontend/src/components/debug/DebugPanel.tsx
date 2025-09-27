'use client'

import { useAuth } from '@/contexts/AuthContext'

export function DebugPanel() {
  const { user, profile, ambassadorProfile, clientProfile } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Debug Panel</div>
      <div>User: {user ? 'Logged In' : 'Not Logged In'}</div>
      {user && (
        <>
          <div>Email: {user.email}</div>
          <div>Role: {profile?.role || 'No Profile'}</div>
          <div>Profile ID: {profile?.id || 'None'}</div>
          <div>Ambassador Profile: {ambassadorProfile ? 'Yes' : 'No'}</div>
          <div>Client Profile: {clientProfile ? 'Yes' : 'No'}</div>
        </>
      )}
    </div>
  )
}