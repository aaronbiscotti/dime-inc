'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, profile, ambassadorProfile, clientProfile, loading, refreshProfile } = useAuth()

  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <div style={{ position: 'fixed', bottom: '10px', right: '10px', zIndex: 9999, backgroundColor: 'white', border: '1px solid #ccc', padding: '10px', maxWidth: '300px' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}
      >
        DEBUG {isOpen ? '▼' : '▶'}
      </div>
      
      {isOpen && (
        <div style={{ fontSize: '12px' }}>
          <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
          <div><strong>User:</strong> {user ? 'Authenticated' : 'Not authenticated'}</div>
          <div><strong>Profile:</strong> {profile ? 'Loaded' : 'Not loaded'}</div>
          <div><strong>Role:</strong> {profile?.role || 'N/A'}</div>
          <div><strong>Onboarding:</strong> {profile?.onboarding_completed ? 'Completed' : 'Pending'}</div>
          
          {user && (
            <>
              <div><strong>Email:</strong> {user.email || 'N/A'}</div>
              <div><strong>ID:</strong> {user.id?.slice(0, 8)}...</div>
            </>
          )}
          
          {profile && (
            <>
              <div><strong>Ambassador Profile:</strong> {ambassadorProfile ? 'Yes' : 'No'}</div>
              <div><strong>Client Profile:</strong> {clientProfile ? 'Yes' : 'No'}</div>
            </>
          )}
          
          <button 
            onClick={refreshProfile}
            style={{ marginTop: '10px', padding: '5px 10px', fontSize: '12px' }}
          >
            Refresh Profile
          </button>
        </div>
      )}
    </div>
  )
}
