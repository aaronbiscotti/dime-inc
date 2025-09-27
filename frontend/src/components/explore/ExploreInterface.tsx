'use client'

import { ExploreGrid } from './ExploreGrid'
import { UserRole } from '@/types/database'

interface ExploreInterfaceProps {
  userRole: UserRole
}

export function ExploreInterface({ userRole }: ExploreInterfaceProps) {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userRole === 'client' ? 'Find Ambassadors' : 'Find Clients'}
        </h1>
        <p className="text-gray-600">
          {userRole === 'client'
            ? 'Discover talented content creators and influencers for your campaigns'
            : 'Connect with brands looking for ambassador partnerships'
          }
        </p>
      </div>

      {/* Results Grid */}
      <ExploreGrid
        userRole={userRole}
        searchQuery=""
        filters={{}}
      />
    </div>
  )
}