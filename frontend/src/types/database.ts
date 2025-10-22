export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
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
      campaign_ambassadors: {
        Row: {
          agreed_budget: number | null
          ambassador_id: string
          campaign_id: string
          chat_room_id: string | null
          created_at: string | null
          id: string
          selected_at: string | null
          status: Database["public"]["Enums"]["campaign_ambassador_status"]
        }
        Insert: {
          agreed_budget?: number | null
          ambassador_id: string
          campaign_id: string
          chat_room_id?: string | null
          created_at?: string | null
          id?: string
          selected_at?: string | null
          status?: Database["public"]["Enums"]["campaign_ambassador_status"]
        }
        Update: {
          agreed_budget?: number | null
          ambassador_id?: string
          campaign_id?: string
          chat_room_id?: string | null
          created_at?: string | null
          id?: string
          selected_at?: string | null
          status?: Database["public"]["Enums"]["campaign_ambassador_status"]
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ambassadors_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "ambassador_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ambassadors_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_ambassadors_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_submissions: {
        Row: {
          ad_code: string | null
          campaign_ambassador_id: string
          content_url: string
          feedback: string | null
          id: string
          reviewed_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submitted_at: string | null
        }
        Insert: {
          ad_code?: string | null
          campaign_ambassador_id: string
          content_url: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
        }
        Update: {
          ad_code?: string | null
          campaign_ambassador_id?: string
          content_url?: string
          feedback?: string | null
          id?: string
          reviewed_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_submissions_campaign_ambassador_id_fkey"
            columns: ["campaign_ambassador_id"]
            isOneToOne: false
            referencedRelation: "campaign_ambassadors"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          budget_max: number
          budget_min: number
          client_id: string
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          max_ambassadors: number | null
          proposal_message: string | null
          requirements: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          budget_max: number
          budget_min: number
          client_id: string
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          max_ambassadors?: number | null
          proposal_message?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          budget_max?: number
          budget_min?: number
          client_id?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          max_ambassadors?: number | null
          proposal_message?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          updated_at?: string | null
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
      chat_room_participants_enhanced: {
        Row: {
          chat_room_id: string | null
          id: string
          joined_at: string | null
          last_read_message_id: string | null
          notification_preferences: Json | null
          role: string
          user_id: string | null
        }
        Insert: {
          chat_room_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_message_id?: string | null
          notification_preferences?: Json | null
          role: string
          user_id?: string | null
        }
        Update: {
          chat_room_id?: string | null
          id?: string
          joined_at?: string | null
          last_read_message_id?: string | null
          notification_preferences?: Json | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_participants_enhanced_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_participants_enhanced_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_room_participants_enhanced_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_types: {
        Row: {
          auto_archive_after_days: number | null
          id: string
          max_participants: number | null
          type_name: string
        }
        Insert: {
          auto_archive_after_days?: number | null
          id?: string
          max_participants?: number | null
          type_name: string
        }
        Update: {
          auto_archive_after_days?: number | null
          id?: string
          max_participants?: number | null
          type_name?: string
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          archived_at: string | null
          chat_type_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          metadata: Json | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          chat_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          chat_type_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          metadata?: Json | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_chat_type_id_fkey"
            columns: ["chat_type_id"]
            isOneToOne: false
            referencedRelation: "chat_room_types"
            referencedColumns: ["id"]
          },
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
      contract_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          template_content: string
          template_variables: Json | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_content: string
          template_variables?: Json | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: string
          template_variables?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_workflows: {
        Row: {
          auto_generated_at: string | null
          campaign_ambassador_id: string | null
          created_at: string | null
          current_step: number | null
          id: string
          template_id: string | null
          updated_at: string | null
          workflow_data: Json | null
          workflow_status: string | null
        }
        Insert: {
          auto_generated_at?: string | null
          campaign_ambassador_id?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          template_id?: string | null
          updated_at?: string | null
          workflow_data?: Json | null
          workflow_status?: string | null
        }
        Update: {
          auto_generated_at?: string | null
          campaign_ambassador_id?: string | null
          created_at?: string | null
          current_step?: number | null
          id?: string
          template_id?: string | null
          updated_at?: string | null
          workflow_data?: Json | null
          workflow_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_workflows_campaign_ambassador_id_fkey"
            columns: ["campaign_ambassador_id"]
            isOneToOne: false
            referencedRelation: "campaign_ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_workflows_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          ambassador_signed_at: string | null
          campaign_ambassador_id: string | null
          client_id: string | null
          client_signed_at: string | null
          contract_file_url: string | null
          contract_text: string | null
          cost_per_cpm: number | null
          created_at: string | null
          id: string
          payment_type: Database["public"]["Enums"]["contract_payment_type"]
          pdf_url: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          target_impressions: number | null
          terms_accepted: boolean
          updated_at: string | null
          usage_rights_duration: string | null
        }
        Insert: {
          ambassador_signed_at?: string | null
          campaign_ambassador_id?: string | null
          client_id?: string | null
          client_signed_at?: string | null
          contract_file_url?: string | null
          contract_text?: string | null
          cost_per_cpm?: number | null
          created_at?: string | null
          id: string
          payment_type: Database["public"]["Enums"]["contract_payment_type"]
          pdf_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          target_impressions?: number | null
          terms_accepted?: boolean
          updated_at?: string | null
          usage_rights_duration?: string | null
        }
        Update: {
          ambassador_signed_at?: string | null
          campaign_ambassador_id?: string | null
          client_id?: string | null
          client_signed_at?: string | null
          contract_file_url?: string | null
          contract_text?: string | null
          cost_per_cpm?: number | null
          created_at?: string | null
          id?: string
          payment_type?: Database["public"]["Enums"]["contract_payment_type"]
          pdf_url?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          target_impressions?: number | null
          terms_accepted?: boolean
          updated_at?: string | null
          usage_rights_duration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_campaign_ambassador_id_fkey"
            columns: ["campaign_ambassador_id"]
            isOneToOne: false
            referencedRelation: "campaign_ambassadors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_connections: {
        Row: {
          access_token: string
          ambassador_id: string
          created_at: string | null
          id: string
          instagram_user_id: string
          instagram_username: string
          token_expires_at: string
          updated_at: string | null
        }
        Insert: {
          access_token: string
          ambassador_id: string
          created_at?: string | null
          id?: string
          instagram_user_id: string
          instagram_username: string
          token_expires_at: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          ambassador_id?: string
          created_at?: string | null
          id?: string
          instagram_user_id?: string
          instagram_username?: string
          token_expires_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_connections_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: true
            referencedRelation: "ambassador_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string | null
          created_at: string | null
          edited_at: string | null
          file_url: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          reply_to_message_id: string | null
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          reply_to_message_id?: string | null
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string | null
          created_at?: string | null
          edited_at?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          reply_to_message_id?: string | null
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
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
          email: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
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
      add_chat_participant: {
        Args: { p_chat_room_id: string; p_user_id: string }
        Returns: boolean
      }
      cleanup_orphaned_chats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_private_chat_between_users: {
        Args: {
          chat_name?: string
          participant1_id: string
          participant2_id: string
        }
        Returns: Json
      }
      delete_chat_room: {
        Args: { chat_room_id: string; requesting_user_id: string }
        Returns: Json
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
      campaign_ambassador_status:
        | "proposal_received"
        | "accepted"
        | "active"
        | "completed"
        | "terminated"
      campaign_status: "draft" | "active" | "completed" | "cancelled"
      contract_payment_type: "pay_per_post" | "pay_per_cpm"
      contract_status:
        | "draft"
        | "pending_ambassador_signature"
        | "active"
        | "completed"
        | "terminated"
      submission_status: "pending_review" | "approved" | "requires_changes"
      user_role: "ambassador" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_ambassador_status: [
        "proposal_received",
        "accepted",
        "active",
        "completed",
        "terminated",
      ],
      campaign_status: ["draft", "active", "completed", "cancelled"],
      contract_payment_type: ["pay_per_post", "pay_per_cpm"],
      contract_status: [
        "draft",
        "pending_ambassador_signature",
        "active",
        "completed",
        "terminated",
      ],
      submission_status: ["pending_review", "approved", "requires_changes"],
      user_role: ["ambassador", "client"],
    },
  },
} as const
