export type UserRole = "client" | "ambassador";

export type BidStatus = "pending" | "accepted" | "rejected" | "completed";
export type ContractStatus =
  | "draft"
  | "pending_signatures"
  | "signed"
  | "completed"
  | "cancelled";
export type ChatStatus = "active" | "completed" | "pending" | "overdue";

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface AmbassadorProfile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  profile_photo_url: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
  niche: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  company_name: string;
  company_description: string | null;
  website: string | null;
  logo_url: string | null;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  client_id: string;
  ambassador_id: string;
  campaign_title: string;
  campaign_description?: string;
  budget?: number;
  timeline?: string;
  requirements?: string;
  status: BidStatus;
  created_at: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  is_group: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatParticipant {
  id: string;
  chat_room_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  chat_room_id: string;
  sender_id: string;
  content?: string;
  file_url?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  bid_id: string;
  document_url?: string;
  terms?: any;
  status: ContractStatus;
  signed_by_client_at?: string;
  signed_by_ambassador_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Portfolio {
  id: string;
  ambassador_id: string;
  client_id?: string;
  title: string;
  description?: string;
  campaign_date?: string;
  instagram_url?: string;
  tiktok_url?: string;
  media_urls?: string[];
  results?: any;
  created_at: string;
  updated_at: string;
}

// Chat types for UI components
export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  profilePicture?: string;
  isOnline: boolean;
  isGroup: boolean;
  participants?: string[];
  status?: ChatStatus;
  milestone?: string;
  contractId?: string;
}

// Portfolio and Campaign types for profile page
export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  platform: "instagram" | "tiktok" | "youtube" | "twitter";
  postUrl: string;
  thumbnailUrl?: string;
  date: string;
  views?: string;
  likes?: string;
  engagement?: string;
}

export interface Campaign {
  id: string;
  title: string;
  status: "active" | "completed";
  budgetRange: string;
  ambassadorCount: number;
  timeline: string;
  coverImage?: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ambassador_profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          bio: string | null
          location: string | null
          profile_photo_url: string | null
          instagram_handle: string | null
          tiktok_handle: string | null
          twitter_handle: string | null
          niche: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          bio?: string | null
          location?: string | null
          profile_photo_url?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          niche?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          bio?: string | null
          location?: string | null
          profile_photo_url?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          niche?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassador_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      client_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          company_description: string | null
          website: string | null
          logo_url: string | null
          industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          company_description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          company_description?: string | null
          website?: string | null
          logo_url?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      bids: {
        Row: {
          id: string
          client_id: string
          ambassador_id: string
          campaign_title: string
          campaign_description: string | null
          budget: number | null
          timeline: string | null
          requirements: string | null
          status: BidStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          ambassador_id: string
          campaign_title: string
          campaign_description?: string | null
          budget?: number | null
          timeline?: string | null
          requirements?: string | null
          status?: BidStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          ambassador_id?: string
          campaign_title?: string
          campaign_description?: string | null
          budget?: number | null
          timeline?: string | null
          requirements?: string | null
          status?: BidStatus
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_rooms: {
        Row: {
          id: string
          name: string | null
          is_group: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          is_group?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_participants: {
        Row: {
          id: string
          chat_room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          user_id?: string
          joined_at?: string
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
          }
        ]
      }
      messages: {
        Row: {
          id: string
          chat_room_id: string
          sender_id: string
          content: string | null
          file_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_room_id: string
          sender_id: string
          content?: string | null
          file_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_room_id?: string
          sender_id?: string
          content?: string | null
          file_url?: string | null
          created_at?: string
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
          }
        ]
      }
      contracts: {
        Row: {
          id: string
          bid_id: string
          document_url: string | null
          terms: Json | null
          status: ContractStatus
          signed_by_client_at: string | null
          signed_by_ambassador_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bid_id: string
          document_url?: string | null
          terms?: Json | null
          status?: ContractStatus
          signed_by_client_at?: string | null
          signed_by_ambassador_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bid_id?: string
          document_url?: string | null
          terms?: Json | null
          status?: ContractStatus
          signed_by_client_at?: string | null
          signed_by_ambassador_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolios: {
        Row: {
          id: string
          ambassador_id: string
          client_id: string | null
          title: string
          description: string | null
          campaign_date: string | null
          instagram_url: string | null
          tiktok_url: string | null
          media_urls: string[] | null
          results: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ambassador_id: string
          client_id?: string | null
          title: string
          description?: string | null
          campaign_date?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
          media_urls?: string[] | null
          results?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ambassador_id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          campaign_date?: string | null
          instagram_url?: string | null
          tiktok_url?: string | null
          media_urls?: string[] | null
          results?: Json | null
          created_at?: string
          updated_at?: string
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
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      bid_status: BidStatus
      contract_status: ContractStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
