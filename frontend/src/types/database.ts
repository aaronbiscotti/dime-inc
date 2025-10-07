// Auto-generated from Supabase schema - DO NOT EDIT MANUALLY
// To regenerate: Run supabase gen types typescript --local

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ambassador_profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          full_name: string
          id: string
          instagram_handle: string | null
          location: string | null
          niche: string[] | null
          profile_photo_url: string | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          instagram_handle?: string | null
          location?: string | null
          niche?: string[] | null
          profile_photo_url?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          instagram_handle?: string | null
          location?: string | null
          niche?: string[] | null
          profile_photo_url?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          ambassador_id: string
          budget: number | null
          campaign_description: string | null
          campaign_title: string
          client_id: string
          created_at: string | null
          id: string
          requirements: string | null
          status: Database["public"]["Enums"]["bid_status"] | null
          timeline: string | null
          updated_at: string | null
        }
        Insert: {
          ambassador_id: string
          budget?: number | null
          campaign_description?: string | null
          campaign_title: string
          client_id: string
          created_at?: string | null
          id?: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["bid_status"] | null
          timeline?: string | null
          updated_at?: string | null
        }
        Update: {
          ambassador_id?: string
          budget?: number | null
          campaign_description?: string | null
          campaign_title?: string
          client_id?: string
          created_at?: string | null
          id?: string
          requirements?: string | null
          status?: Database["public"]["Enums"]["bid_status"] | null
          timeline?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          chat_room_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          chat_room_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          chat_room_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          company_description: string | null
          company_name: string
          created_at: string | null
          id: string
          industry: string | null
          logo_url: string | null
          updated_at: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          company_description?: string | null
          company_name: string
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          updated_at?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          company_description?: string | null
          company_name?: string
          created_at?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          updated_at?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          bid_id: string
          created_at: string | null
          document_url: string | null
          id: string
          signed_by_ambassador_at: string | null
          signed_by_client_at: string | null
          status: Database["public"]["Enums"]["contract_status"] | null
          terms: Json | null
          updated_at: string | null
        }
        Insert: {
          bid_id: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          signed_by_ambassador_at?: string | null
          signed_by_client_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          terms?: Json | null
          updated_at?: string | null
        }
        Update: {
          bid_id?: string
          created_at?: string | null
          document_url?: string | null
          id?: string
          signed_by_ambassador_at?: string | null
          signed_by_client_at?: string | null
          status?: Database["public"]["Enums"]["contract_status"] | null
          terms?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string | null
          created_at: string | null
          file_url: string | null
          id: string
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string | null
          created_at?: string | null
          file_url?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          ambassador_id: string
          campaign_date: string | null
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          instagram_url: string | null
          media_urls: string[] | null
          results: Json | null
          tiktok_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ambassador_id: string
          campaign_date?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_url?: string | null
          media_urls?: string[] | null
          results?: Json | null
          tiktok_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ambassador_id?: string
          campaign_date?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          instagram_url?: string | null
          media_urls?: string[] | null
          results?: Json | null
          tiktok_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bid_status: "pending" | "accepted" | "rejected" | "expired"
      contract_status: "draft" | "sent" | "signed" | "active" | "completed"
      user_role: "ambassador" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type UserRole = Database["public"]["Enums"]["user_role"]
export type BidStatus = Database["public"]["Enums"]["bid_status"]
export type ContractStatus = Database["public"]["Enums"]["contract_status"]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type AmbassadorProfile = Database["public"]["Tables"]["ambassador_profiles"]["Row"]
export type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"]
export type Bid = Database["public"]["Tables"]["bids"]["Row"]
export type ChatRoom = Database["public"]["Tables"]["chat_rooms"]["Row"]
export type ChatParticipant = Database["public"]["Tables"]["chat_participants"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
export type Contract = Database["public"]["Tables"]["contracts"]["Row"]
export type Portfolio = Database["public"]["Tables"]["portfolios"]["Row"]

// Legacy types for UI components (keep for compatibility)
export type ChatStatus = "active" | "completed" | "pending" | "overdue"

export interface Chat {
  id: string
  name: string
  lastMessage: string
  timestamp: string
  unreadCount: number
  profilePicture?: string
  isOnline: boolean
  isGroup: boolean
  participants?: string[]
  status?: ChatStatus
  milestone?: string
  contractId?: string
}

export interface PortfolioItem {
  id: string
  title: string
  description?: string
  platform: "instagram" | "tiktok" | "youtube" | "twitter"
  postUrl: string
  thumbnailUrl?: string
  date: string
  views?: string
  likes?: string
  engagement?: string
}

export interface Campaign {
  id: string
  title: string
  status: "active" | "completed"
  budgetRange: string
  ambassadorCount: number
  timeline: string
  coverImage?: string
}
