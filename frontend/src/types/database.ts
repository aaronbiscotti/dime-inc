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
      campaigns: {
        Row: {
          id: string
          title: string
          description: string
          client_id: string
          budget_min: number
          budget_max: number
          deadline: string | null
          requirements: string | null
          proposal_message: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          max_ambassadors: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          client_id: string
          budget_min: number
          budget_max: number
          deadline?: string | null
          requirements?: string | null
          proposal_message?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          max_ambassadors?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          client_id?: string
          budget_min?: number
          budget_max?: number
          deadline?: string | null
          requirements?: string | null
          proposal_message?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          max_ambassadors?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_ambassadors: {
        Row: {
          id: string
          campaign_id: string
          ambassador_id: string
          selected_at: string
          agreed_budget: number | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          ambassador_id: string
          selected_at?: string
          agreed_budget?: number | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          ambassador_id?: string
          selected_at?: string
          agreed_budget?: number | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ambassadors_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ambassadors_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_chat_participant: {
        Args: { p_chat_room_id: string; p_user_id: string }
        Returns: boolean
      }
      find_private_chat_between_users: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      is_chat_member: {
        Args: { p_chat_room_id: string; p_user_id: string }
        Returns: boolean
      }
      is_chat_participant: {
        Args: { room_id: string; user_id: string }
        Returns: boolean
      }
      remove_chat_participant: {
        Args: { p_chat_room_id: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      campaign_status: "draft" | "active" | "completed" | "cancelled"
      user_role: "ambassador" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type UserRole = Database["public"]["Enums"]["user_role"]
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"]

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type AmbassadorProfile = Database["public"]["Tables"]["ambassador_profiles"]["Row"]
export type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"]
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"]
export type CampaignAmbassador = Database["public"]["Tables"]["campaign_ambassadors"]["Row"]
export type ChatRoom = Database["public"]["Tables"]["chat_rooms"]["Row"]
export type ChatParticipant = Database["public"]["Tables"]["chat_participants"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]
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

// Campaign display type for UI components
export interface CampaignDisplay {
  id: string
  title: string
  status: "draft" | "active" | "completed" | "cancelled"
  budgetRange: string
  ambassadorCount: number
  timeline: string
  coverImage?: string
}

