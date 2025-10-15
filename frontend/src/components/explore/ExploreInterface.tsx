'use client'

import { useState, useEffect } from 'react'
import { Search, Heart, ChevronDown } from 'lucide-react'
import { UserRole, Campaign } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { chatService } from '@/services/chatService'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ExploreSkeleton } from '@/components/skeletons/ExploreSkeleton'
import { CampaignCard } from '@/components/explore/CampaignCard'

// Interface can be added back if userRole is needed for role-based filtering later

interface Influencer {
  id: string
  userId: string // Added to track the user_id for chat creation
  name: string
  handle: string | null
  platforms: string[]
  followers: string | null
  engagement: string | null
  categories: string[]
  avatar: string | null
  associatedWith?: string | null
}

interface CampaignWithClient extends Campaign {
  client_profiles?: {
    company_name: string
    logo_url: string | null
  }
}

export function ExploreInterface() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Most relevant')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [campaigns, setCampaigns] = useState<CampaignWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const router = useRouter()
  const { user, profile } = useAuth()

  const filters = ['Most relevant', 'Highest engagement', 'Newest joined', 'All Categories']
  const isAmbassador = profile?.role === 'ambassador'

  // Fetch ambassadors from database (for clients)
  useEffect(() => {
    const fetchAmbassadors = async () => {
      if (isAmbassador) return // Skip if user is an ambassador
      
      try {
        setLoading(true)
        
        const { data: ambassadorProfiles, error } = await supabase
          .from('ambassador_profiles')
          .select(`
            id,
            full_name,
            bio,
            location,
            niche,
            instagram_handle,
            tiktok_handle,
            twitter_handle,
            profile_photo_url,
            user_id
          `)
          .limit(20) // Limit to 20 results for now

        console.log('Loaded', ambassadorProfiles?.length || 0, 'ambassador profiles')

        if (error) {
          console.error('Error fetching ambassadors:', error)
          return
        }

        if (ambassadorProfiles && ambassadorProfiles.length > 0) {
          const mappedInfluencers: Influencer[] = ambassadorProfiles.map((profile) => {

            // Create platforms array from available handles
            const platforms: string[] = []
            if (profile.instagram_handle) platforms.push('Instagram')
            if (profile.tiktok_handle) platforms.push('TikTok')
            if (profile.twitter_handle) platforms.push('Twitter')

            // Use niche as categories, fallback to empty array
            const categories = profile.niche || []

            return {
              id: profile.id, // Use profile ID as the display ID
              userId: profile.user_id, // Use user_id for chat functionality
              name: profile.full_name,
              handle: profile.instagram_handle ? `@${profile.instagram_handle}` : null,
              platforms,
              followers: null, // We don't have follower data in the current schema
              engagement: null, // We don't have engagement data in the current schema
              categories,
              avatar: profile.profile_photo_url,
              associatedWith: null // We don't have association data in the current schema
            }
          })

          setInfluencers(mappedInfluencers)
          console.log(`Loaded ${mappedInfluencers.length} ambassadors for display`)
        } else {
          // Create mock data for testing if no ambassadors exist
          const mockInfluencers: Influencer[] = [
            {
              id: 'mock-1',
              userId: user?.id || 'test-user-id', // Use current user for testing
              name: 'Test Ambassador',
              handle: '@testambassador',
              platforms: ['Instagram', 'TikTok'],
              followers: '10K',
              engagement: '5.2%',
              categories: ['Lifestyle', 'Fashion'],
              avatar: null,
              associatedWith: null
            }
          ]
          setInfluencers(mockInfluencers)
          console.log('Using mock data: no ambassador profiles found in database')
        }
      } catch (error) {
        console.error('Error fetching ambassadors:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAmbassadors()
  }, [supabase, isAmbassador])

  // Fetch active campaigns (for ambassadors)
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!isAmbassador) return // Skip if user is not an ambassador
      
      try {
        setLoading(true)
        
        const { data: activeCampaigns, error } = await supabase
          .from('campaigns')
          .select(`
            *,
            client_profiles (
              company_name,
              logo_url
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(50)

        console.log('Loaded', activeCampaigns?.length || 0, 'active campaigns')

        if (error) {
          console.error('Error fetching campaigns:', error)
          return
        }

        if (activeCampaigns) {
          setCampaigns(activeCampaigns as CampaignWithClient[])
          console.log(`Loaded ${activeCampaigns.length} active campaigns for display`)
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [supabase, isAmbassador])

  const handleInvite = async (ambassadorUserId: string, ambassadorName: string) => {
    if (!user) {
      console.error('User not authenticated')
      return
    }

    console.log('Starting invite process:', {
      currentUser: user.id,
      ambassadorUserId,
      ambassadorName
    })

    setInvitingId(ambassadorUserId)

    try {
      // First, verify that the ambassador user exists in the profiles table
      console.log('Verifying ambassador exists in profiles table:', ambassadorUserId)
      const { data: ambassadorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', ambassadorUserId)
        .single()

      if (profileError || !ambassadorProfile) {
        console.error('Ambassador profile not found:', profileError)
        alert('This ambassador profile is not properly set up. Please contact support.')
        return
      }

      console.log('Ambassador profile found:', ambassadorProfile)

      // Create or find existing chat with the ambassador
      console.log('Creating chat with ambassador:', ambassadorUserId)
      const { data: chatRoom, error: chatError } = await chatService.createChat({
        participantId: ambassadorUserId,
        participantName: ambassadorName,
        participantRole: 'ambassador'
      })

      if (chatError || !chatRoom) {
        console.error('Error creating chat:', chatError)
        return
      }

      console.log('Chat created successfully:', chatRoom.id)

      // Send initial "Hi" message
      console.log('Sending initial message to chat:', chatRoom.id)
      const { data: message, error: messageError } = await chatService.sendMessage(chatRoom.id, 'Hi')

      if (messageError) {
        console.error('Error sending initial message:', messageError)
        return
      }

      console.log('Message sent successfully:', message)

      // Redirect to the specific chat we just created
      router.push(`/chats?chat=${chatRoom.id}`)

    } catch (error) {
      console.error('Error inviting ambassador:', error)
    } finally {
      setInvitingId(null)
    }
  }

  // Filter and search logic
  const filteredInfluencers = influencers.filter((influencer) => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      influencer.categories.some(category => 
        category.toLowerCase().includes(searchQuery.toLowerCase())
      ) ||
      (influencer.handle && influencer.handle.toLowerCase().includes(searchQuery.toLowerCase()))

    // Category filter
    const matchesCategory = activeFilter === 'All Categories' || 
      activeFilter === 'Most relevant' ||
      influencer.categories.some(category => 
        category.toLowerCase() === activeFilter.toLowerCase()
      )

    return matchesSearch && matchesCategory
  })

  return (
    <div className="pt-16">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {isAmbassador 
              ? 'Discover Active Campaigns' 
              : 'Find the right influencers for your brand'}
          </h1>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={isAmbassador ? "Search campaigns..." : "Search keywords..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
            />
          </div>

          {/* Filter Buttons - Only show for clients */}
          {!isAmbassador && (
            <div className="flex justify-center gap-4 mb-8 flex-wrap">
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
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters - Only show for clients */}
          {!isAmbassador && (
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
                        className="mr-3 w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Lifestyle</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Fashion</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Beauty</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Technology</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Food & Travel</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 text-[#f5d82e] bg-gray-100 border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">Fitness</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={isAmbassador ? "w-full" : "flex-1"}>
            {loading ? (
              isAmbassador ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="space-y-4 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : isAmbassador ? (
              // Campaign Grid for Ambassadors
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-600">
                      No active campaigns available at the moment.
                    </p>
                  </div>
                ) : (
                  campaigns
                    .filter(campaign => 
                      searchQuery === '' ||
                      campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      campaign.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        clientName={campaign.client_profiles?.company_name}
                        clientLogo={campaign.client_profiles?.logo_url || undefined}
                      />
                    ))
                )}
              </div>
            ) : (
              // Ambassador List for Clients
              <div className="space-y-4">
                {filteredInfluencers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      {searchQuery || activeFilter !== 'All Categories' ? 
                        'No ambassadors found matching your criteria.' : 
                        'No ambassadors found.'
                      }
                    </p>
                  </div>
                ) : (
                  filteredInfluencers.map((influencer) => (
                    <div key={influencer.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {influencer.avatar ? (
                              <img 
                                src={influencer.avatar} 
                                alt={influencer.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-medium">
                                {influencer.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{influencer.name}</h3>
                              {influencer.handle && (
                                <span className="text-gray-500 text-sm">{influencer.handle}</span>
                              )}
                              {influencer.platforms.length > 0 && (
                                <div className="flex gap-1">
                                  {influencer.platforms.map((platform: string) => (
                                    <span key={platform} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                      {platform}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              {influencer.followers && <span>Followers: {influencer.followers}</span>}
                              {influencer.engagement && <span>Engagement: {influencer.engagement}</span>}
                              {influencer.categories.length > 0 && (
                                <div className="flex gap-1">
                                  {influencer.categories.map((category: string) => (
                                    <span key={category} className="text-gray-500">
                                      {category}
                                    </span>
                                  ))}
                                </div>
                              )}
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
                          <button 
                            onClick={() => handleInvite(influencer.userId, influencer.name)}
                            disabled={invitingId === influencer.userId}
                            className="bg-[#f5d82e] hover:bg-[#FEE65D] text-gray-900 font-medium px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {invitingId === influencer.userId ? 'Inviting...' : 'Invite'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}