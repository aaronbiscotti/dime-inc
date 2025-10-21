'use client'

import { useState, useEffect } from 'react'
import { Search, Heart, ChevronDown, X } from 'lucide-react'
import { Campaign } from '@/types/database'
import { exploreService } from '@/services/exploreService'
import { chatService } from '@/services/chatService'
import { campaignService } from '@/services/campaignService'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
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
  const [filtersOpen, setFiltersOpen] = useState(true) // Start open by default
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [campaigns, setCampaigns] = useState<CampaignWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [invitingId, setInvitingId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Set<string>>(new Set()) // Track favorited ambassadors
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedAmbassador, setSelectedAmbassador] = useState<{ id: string; userId: string; name: string } | null>(null)
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()
  const { user, profile, clientProfile } = useAuth()

  const filters = ['Most relevant', 'Highest engagement', 'Newest joined', 'All Categories']
  const isAmbassador = profile?.role === 'ambassador'

  // Fetch ambassadors from API (for clients)
  useEffect(() => {
    const fetchAmbassadors = async () => {
      if (isAmbassador) return // Skip if user is an ambassador
      
      try {
        setLoading(true)
        
        const ambassadorProfiles = await exploreService.getAmbassadors()

        console.log('Loaded', ambassadorProfiles?.length || 0, 'ambassador profiles')

        if (ambassadorProfiles && ambassadorProfiles.length > 0) {
          const mappedInfluencers: Influencer[] = ambassadorProfiles.map((profile) => {
            const prof = profile as Record<string, unknown>;

            // Create platforms array from available handles  
            const platforms: string[] = []
            if (prof.instagramHandle) platforms.push('Instagram')
            if (prof.tiktokHandle) platforms.push('TikTok')
            if (prof.twitterHandle) platforms.push('Twitter')

            // Use niche as categories, fallback to empty array
            const categories = (prof.niche as string[]) || []

            // Format handle, avoiding double @ if it already exists
            const formatHandle = (handle: string | null) => {
              if (!handle) return null
              return handle.startsWith('@') ? handle : `@${handle}`
            }

            return {
              id: prof.profileId as string, // Use profileId from API
              userId: prof.id as string, // Use id (user_id) for chat functionality
              name: prof.name as string,
              handle: formatHandle(prof.instagramHandle as string | null),
              platforms,
              followers: null, // We don't have follower data in the current schema
              engagement: null, // We don't have engagement data in the current schema
              categories,
              avatar: prof.profilePhotoUrl as string,
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
  }, [isAmbassador, user])

  // Fetch active campaigns (for ambassadors)
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!isAmbassador) return // Skip if user is not an ambassador
      
      try {
        setLoading(true)
        
        // TODO: Replace with backend API call instead of direct Supabase access
        // This should use exploreService to get campaigns through the FastAPI backend
        console.log('Campaign fetching not yet implemented through backend API')
        setCampaigns([])
        
        /* Direct Supabase call disabled - should use backend API
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
        */
      } catch (error) {
        console.error('Error fetching campaigns:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCampaigns()
  }, [isAmbassador])

  const handleToggleFavorite = (ambassadorId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(ambassadorId)) {
        newFavorites.delete(ambassadorId)
      } else {
        newFavorites.add(ambassadorId)
      }
      return newFavorites
    })
  }

  const handleInvite = async (ambassadorUserId: string, ambassadorName: string, ambassadorProfileId: string) => {
    if (!user) {
      console.error('User not authenticated')
      return
    }

    // Set the selected ambassador and open the modal
    setSelectedAmbassador({ id: ambassadorProfileId, userId: ambassadorUserId, name: ambassadorName })
    
    // Fetch active campaigns for the dropdown
    try {
      if (!clientProfile?.id) {
        console.error('No client profile available')
        setActiveCampaigns([])
        return
      }
      const result = await campaignService.getCampaignsForClient(clientProfile.id)
      if (result.error || !result.data) {
        console.error('Error fetching campaigns:', result.error)
        setActiveCampaigns([])
        return
      }
      const active = result.data.filter(c => c.status === 'active')
      setActiveCampaigns(active)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      setActiveCampaigns([])
    }
    
    // Reset form state
    setSelectedCampaignId('')
    setInviteMessage('')
    setShowInviteModal(true)
  }

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    
    // Find the selected campaign and load its proposal message
    const campaign = activeCampaigns.find(c => c.id === campaignId)
    if (campaign && campaign.proposal_message) {
      setInviteMessage(campaign.proposal_message)
    } else {
      setInviteMessage('')
    }
  }

  const handleSendInvite = async () => {
    if (!user || !selectedAmbassador) {
      console.error('User not authenticated or no ambassador selected')
      return
    }

    console.log('Starting invite process:', {
      currentUser: user.id,
      ambassadorUserId: selectedAmbassador.userId,
      ambassadorName: selectedAmbassador.name,
      selectedCampaignId,
    })

    setInvitingId(selectedAmbassador.userId)

    try {
      // Profile verification is handled by the backend when creating the chat
      console.log('Creating chat with ambassador:', selectedAmbassador.userId)
      
      const { data: chatRoom, error: chatError } = await chatService.createChat({
        participant_id: selectedAmbassador.userId,
        participant_name: selectedAmbassador.name,
        participant_role: 'ambassador'
      })

      if (chatError || !chatRoom) {
        console.error('Error creating chat:', chatError)
        return
      }

      console.log('Chat created successfully:', chatRoom.id)

      // TODO: Implement sending invite message through chatService
      // The sendMessage method needs to be implemented in chatService
      if (inviteMessage) {
        console.log('Invite message will be sent:', inviteMessage)
      }

      // Add ambassador to campaign_ambassadors table
      if (selectedCampaignId && selectedAmbassador?.id) {
        try {
          console.log('Adding ambassador to campaign_ambassadors:', {
            campaignId: selectedCampaignId,
            ambassadorId: selectedAmbassador.id,
          })
          const result = await campaignService.addAmbassadorToCampaign(
            selectedCampaignId,
            selectedAmbassador.id
          )
          console.log('Ambassador added to campaign_ambassadors:', result)
        } catch (err) {
          console.error('Error adding ambassador to campaign_ambassadors:', err)
        }
      } else {
        console.warn('No campaign selected or ambassador ID missing, skipping campaign_ambassadors insert.')
      }

      // Close modal and redirect to the specific chat
      setShowInviteModal(false)
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
            <div className="flex justify-center gap-3 mb-8 flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                    activeFilter === filter
                      ? 'bg-[#f5d82e] text-black shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
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
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <button
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  className="flex items-center justify-between w-full text-left font-semibold text-gray-900 mb-4"
                >
                  Influencer Type Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {filtersOpen && (
                  <div className="space-y-2.5">
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">UGC (New Account Farmers)</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">Influencers in network</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">Influencer search</span>
                    </label>
                    <label className="flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="mr-3 w-4 h-4 accent-[#f5d82e] border-gray-300 rounded focus:ring-[#f5d82e] focus:ring-2 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">Followers</span>
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
                    <div key={influencer.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Avatar */}
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {influencer.avatar ? (
                              <img 
                                src={influencer.avatar} 
                                alt={influencer.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-600 font-medium text-lg">
                                {influencer.name.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg mb-1">{influencer.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                {influencer.handle && (
                                  <span>{influencer.handle}</span>
                                )}
                                {influencer.platforms.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{influencer.platforms.join(' | ')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              {influencer.followers && (
                                <span><span className="font-medium">Followers:</span> {influencer.followers}</span>
                              )}
                              {influencer.engagement && (
                                <>
                                  <span>•</span>
                                  <span><span className="font-medium">Engagement:</span> {influencer.engagement}</span>
                                </>
                              )}
                              {influencer.categories.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{influencer.categories.join(', ')}</span>
                                </>
                              )}
                            </div>
                            
                            {influencer.associatedWith && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Associated with</span>
                                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">Z</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-3 ml-4">
                          <button 
                            onClick={() => handleToggleFavorite(influencer.id)}
                            className="p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                          >
                            <Heart 
                              className={`w-5 h-5 transition-colors ${
                                favorites.has(influencer.id) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                            />
                          </button>
                          <button 
                            onClick={() => handleInvite(influencer.userId, influencer.name, influencer.id)}
                            disabled={invitingId === influencer.userId}
                            className="bg-[#f5d82e] hover:bg-[#e5c820] text-black font-medium px-6 py-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

      {/* Invite to Campaign Modal */}
      {showInviteModal && selectedAmbassador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setShowInviteModal(false)}
          />
          
          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Invite to campaign</h3>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ambassador Info */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {selectedAmbassador.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedAmbassador.name}</p>
                  <p className="text-sm text-gray-500">Brand Ambassador</p>
                </div>
              </div>
            </div>

            {/* Campaign Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a campaign
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => handleCampaignSelect(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent"
                disabled={activeCampaigns.length === 0}
              >
                <option value="">
                  {activeCampaigns.length === 0 ? 'No active campaigns available' : 'Select a job'}
                </option>
                {activeCampaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
              {activeCampaigns.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  You need to create and activate a campaign first.
                </p>
              )}
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Write your message..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5d82e] focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                disabled={invitingId !== null}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={invitingId !== null || !inviteMessage.trim()}
                className="flex-1 px-4 py-2.5 bg-[#f5d82e] hover:bg-[#e5c820] text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {invitingId !== null ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="fixed inset-0"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
            onClick={() => setShowErrorModal(false)}
          />
          
          {/* Modal content */}
          <div className="relative z-10 bg-white rounded-xl p-6 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="px-6 py-2 bg-[#f5d82e] text-black rounded-lg font-medium hover:bg-[#e5c820] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}