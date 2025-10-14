'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Navbar } from '@/components/layout/Navbar'
import { ExploreInterface } from '@/components/explore/ExploreInterface'
import { ProfileGuard } from '@/components/auth/ProfileGuard'

export default function Explore() {
  const { profile } = useAuth()

  return (
    <ProfileGuard>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {profile && <ExploreInterface />}
      </div>
    </ProfileGuard>
  )
}