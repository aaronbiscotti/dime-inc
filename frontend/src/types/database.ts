export type UserRole = 'client' | 'ambassador'

export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'completed'
export type ContractStatus = 'draft' | 'pending' | 'signed' | 'executed' | 'completed'

export interface Profile {
  id: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AmbassadorProfile {
  id: string
  user_id: string
  full_name: string
  bio?: string
  location?: string
  profile_photo_url?: string
  instagram_handle?: string
  tiktok_handle?: string
  twitter_handle?: string
  follower_count?: number
  niche?: string[]
  created_at: string
  updated_at: string
}

export interface ClientProfile {
  id: string
  user_id: string
  company_name: string
  company_description?: string
  website?: string
  logo_url?: string
  industry?: string
  created_at: string
  updated_at: string
}

export interface Bid {
  id: string
  client_id: string
  ambassador_id: string
  campaign_title: string
  campaign_description?: string
  budget?: number
  timeline?: string
  requirements?: string
  status: BidStatus
  created_at: string
  updated_at: string
}

export interface ChatRoom {
  id: string
  name?: string
  is_group: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface ChatParticipant {
  id: string
  chat_room_id: string
  user_id: string
  joined_at: string
}

export interface Message {
  id: string
  chat_room_id: string
  sender_id: string
  content?: string
  file_url?: string
  created_at: string
}

export interface Contract {
  id: string
  bid_id: string
  document_url?: string
  terms?: any
  status: ContractStatus
  signed_by_client_at?: string
  signed_by_ambassador_at?: string
  created_at: string
  updated_at: string
}

export interface Portfolio {
  id: string
  ambassador_id: string
  client_id?: string
  title: string
  description?: string
  campaign_date?: string
  instagram_url?: string
  tiktok_url?: string
  media_urls?: string[]
  results?: any
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      ambassador_profiles: {
        Row: AmbassadorProfile
        Insert: Omit<AmbassadorProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AmbassadorProfile, 'id' | 'user_id' | 'created_at'>>
      }
      client_profiles: {
        Row: ClientProfile
        Insert: Omit<ClientProfile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClientProfile, 'id' | 'user_id' | 'created_at'>>
      }
      bids: {
        Row: Bid
        Insert: Omit<Bid, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Bid, 'id' | 'created_at'>>
      }
      chat_rooms: {
        Row: ChatRoom
        Insert: Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ChatRoom, 'id' | 'created_at'>>
      }
      chat_participants: {
        Row: ChatParticipant
        Insert: Omit<ChatParticipant, 'id' | 'joined_at'>
        Update: Partial<Omit<ChatParticipant, 'id' | 'joined_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      contracts: {
        Row: Contract
        Insert: Omit<Contract, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contract, 'id' | 'created_at'>>
      }
      portfolios: {
        Row: Portfolio
        Insert: Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Portfolio, 'id' | 'created_at'>>
      }
    }
  }
}