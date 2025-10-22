'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Navbar } from '@/components/layout/Navbar'
import { ExploreInterface } from '@/components/explore/ExploreInterface'

export default function Explore() {
  const { profile } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {profile && <ExploreInterface />}
    </div>
  )
}