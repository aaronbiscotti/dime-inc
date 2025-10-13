'use client'

import { useState } from 'react'
import { Search, Heart, ChevronDown } from 'lucide-react'
import { UserRole } from '@/types/database'

interface ExploreInterfaceProps {
  userRole: UserRole
}

interface Influencer {
  id: string
  name: string
  handle: string
  platforms: string[]
  followers: string
  engagement: string
  categories: string[]
  avatar: string
  associatedWith?: string
}

const mockInfluencers: Influencer[] = [
  {
    id: '1',
    name: 'Ava Martinez',
    handle: '@avmartinez',
    platforms: ['YouTube', 'Twitter'],
    followers: '200K',
    engagement: '6.1%',
    categories: ['Travel', 'Fashion'],
    avatar: '/api/placeholder/40/40',
    associatedWith: 'Meta'
  },
  {
    id: '2',
    name: 'Liam Johnson',
    handle: '@liamjohnson',
    platforms: ['Facebook', 'Snapchat'],
    followers: '150K',
    engagement: '5.5%',
    categories: ['Fitness', 'Health'],
    avatar: '/api/placeholder/40/40',
    associatedWith: 'Meta'
  },
  {
    id: '3',
    name: 'Olivia Brown',
    handle: '@oliviabrown',
    platforms: ['Pinterest', 'Reddit'],
    followers: '90K',
    engagement: '3.7%',
    categories: ['Food', 'Recipes'],
    avatar: '/api/placeholder/40/40',
    associatedWith: 'Meta'
  },
  {
    id: '4',
    name: 'Ethan Smith',
    handle: '@ethansmith',
    platforms: ['LinkedIn', 'Tumblr'],
    followers: '220K',
    engagement: '7.4%',
    categories: ['Tech', 'Gadgets'],
    avatar: '/api/placeholder/40/40',
    associatedWith: 'Meta'
  },
  {
    id: '5',
    name: 'Mia Davis',
    handle: '@miadavis',
    platforms: ['Snapchat', 'TikTok'],
    followers: '300K',
    engagement: '8.2%',
    categories: ['Dance', 'Music'],
    avatar: '/api/placeholder/40/40',
    associatedWith: 'Meta'
  }
]

export function ExploreInterface({ userRole }: ExploreInterfaceProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Most relevant')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filters = ['Most relevant', 'Highest engagement', 'Newest joined']

  return (
    <div className="pt-16">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Find the right influencers for your brand
          </h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? 'bg-[#f5d82e] text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center justify-between w-full text-left font-medium text-gray-900 mb-4"
              >
                Influencer Type Filters
                <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {filtersOpen && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[#f5d82e] focus:ring-gray-200 focus:ring-2 accent-[#f5d82e]" 
                    />
                    <span className="ml-2 text-sm text-gray-700">UGC (New Account Farmers)</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[#f5d82e] focus:ring-gray-200 focus:ring-2 accent-[#f5d82e]" 
                    />
                    <span className="ml-2 text-sm text-gray-700">Influencers in network</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[#f5d82e] focus:ring-gray-200 focus:ring-2 accent-[#f5d82e]" 
                    />
                    <span className="ml-2 text-sm text-gray-700">Influencer search</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-[#f5d82e] focus:ring-gray-200 focus:ring-2 accent-[#f5d82e]" 
                    />
                    <span className="ml-2 text-sm text-gray-700">Followers</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Influencers Grid */}
          <div className="flex-1">
            <div className="space-y-4">
              {mockInfluencers.map((influencer) => (
                <div key={influencer.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {influencer.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{influencer.name}</h3>
                          <span className="text-gray-500 text-sm">{influencer.handle}</span>
                          <div className="flex gap-1">
                            {influencer.platforms.map((platform) => (
                              <span key={platform} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>Followers: {influencer.followers}</span>
                          <span>Engagement: {influencer.engagement}</span>
                          <div className="flex gap-1">
                            {influencer.categories.map((category) => (
                              <span key={category} className="text-gray-500">
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {influencer.associatedWith && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Associated with</span>
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">M</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Heart className="w-5 h-5" />
                      </button>
                      <button className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 font-medium px-6 py-2 rounded-lg transition-colors">
                        Invite
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}