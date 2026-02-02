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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string
          id: string
          permission_level: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email: string
          id?: string
          permission_level: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string
          id?: string
          permission_level?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          permission_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id: string
          permission_level: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_level?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_response_suggestions: {
        Row: {
          company_research_id: string | null
          created_at: string | null
          email_body: string
          follow_up_date: string | null
          id: string
          key_points: string[] | null
          lead_id: string | null
          priority_level: string | null
          subject_line: string
        }
        Insert: {
          company_research_id?: string | null
          created_at?: string | null
          email_body: string
          follow_up_date?: string | null
          id?: string
          key_points?: string[] | null
          lead_id?: string | null
          priority_level?: string | null
          subject_line: string
        }
        Update: {
          company_research_id?: string | null
          created_at?: string | null
          email_body?: string
          follow_up_date?: string | null
          id?: string
          key_points?: string[] | null
          lead_id?: string | null
          priority_level?: string | null
          subject_line?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_response_suggestions_company_research_id_fkey"
            columns: ["company_research_id"]
            isOneToOne: false
            referencedRelation: "company_research"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_suggestions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_response_suggestions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_detailed"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          company_email: string | null
          company_name: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          company_email?: string | null
          company_name?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          company_email?: string | null
          company_name?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      api_cost_tracking: {
        Row: {
          actual_cost: number | null
          created_at: string | null
          date: string | null
          estimated_cost: number
          id: string
          metadata: Json | null
          model: string | null
          operation: string
          request_count: number | null
          service: string
          user_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string | null
          date?: string | null
          estimated_cost: number
          id?: string
          metadata?: Json | null
          model?: string | null
          operation: string
          request_count?: number | null
          service: string
          user_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          created_at?: string | null
          date?: string | null
          estimated_cost?: number
          id?: string
          metadata?: Json | null
          model?: string | null
          operation?: string
          request_count?: number | null
          service?: string
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      automation_limits: {
        Row: {
          created_at: string
          daily_inmails: number
          daily_invites: number
          daily_messages: number
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          daily_inmails?: number
          daily_invites?: number
          daily_messages?: number
          id?: string
          role: string
        }
        Update: {
          created_at?: string
          daily_inmails?: number
          daily_invites?: number
          daily_messages?: number
          id?: string
          role?: string
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action_type: string
          id: string
          performed_at: string
          status: string
          target_url: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          id?: string
          performed_at?: string
          status: string
          target_url?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          id?: string
          performed_at?: string
          status?: string
          target_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "automation_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      automation_profiles: {
        Row: {
          created_at: string
          is_active: boolean | null
          role: string
          unipile_account_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          is_active?: boolean | null
          role?: string
          unipile_account_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          is_active?: boolean | null
          role?: string
          unipile_account_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_profiles_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "automation_limits"
            referencedColumns: ["role"]
          },
        ]
      }
      blog_posts: {
        Row: {
          ai_generated: boolean | null
          author_id: string | null
          category_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          keywords: string[] | null
          metadata: Json | null
          published_at: string | null
          rejected_at: string | null
          rejection_reason: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          author_id?: string | null
          category_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          metadata?: Json | null
          published_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          author_id?: string | null
          category_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          metadata?: Json | null
          published_at?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      company_research: {
        Row: {
          company_name: string | null
          created_at: string | null
          domain: string
          expires_at: string | null
          id: string
          industry: string | null
          key_products: string[] | null
          linkedin_info: string | null
          recent_news: string | null
          researched_at: string | null
          website_summary: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          domain: string
          expires_at?: string | null
          id?: string
          industry?: string | null
          key_products?: string[] | null
          linkedin_info?: string | null
          recent_news?: string | null
          researched_at?: string | null
          website_summary?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          domain?: string
          expires_at?: string | null
          id?: string
          industry?: string | null
          key_products?: string[] | null
          linkedin_info?: string | null
          recent_news?: string | null
          researched_at?: string | null
          website_summary?: string | null
        }
        Relationships: []
      }
      contact_leads: {
        Row: {
          admin_notes: string | null
          annual_volume: string | null
          assigned_to: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          lead_score: number | null
          message: string | null
          name: string
          phone: string
          priority: Database["public"]["Enums"]["lead_priority"]
          project_type: string
          project_types:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          score_breakdown: Json | null
          source: Database["public"]["Enums"]["lead_source"]
          status: Database["public"]["Enums"]["lead_status"]
          technical_requirements: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          annual_volume?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          lead_score?: number | null
          message?: string | null
          name: string
          phone: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_type: string
          project_types?:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          score_breakdown?: Json | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          technical_requirements: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          annual_volume?: string | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          lead_score?: number | null
          message?: string | null
          name?: string
          phone?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_type?: string
          project_types?:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          score_breakdown?: Json | null
          source?: Database["public"]["Enums"]["lead_source"]
          status?: Database["public"]["Enums"]["lead_status"]
          technical_requirements?: string
          updated_at?: string
        }
        Relationships: []
      }
      cost_alerts: {
        Row: {
          acknowledged: boolean | null
          alert_type: string
          created_at: string | null
          current_value: number | null
          id: string
          message: string | null
          metadata: Json | null
          operation: string | null
          severity: string
          threshold_value: number | null
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          alert_type: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          operation?: string | null
          severity: string
          threshold_value?: number | null
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          alert_type?: string
          created_at?: string | null
          current_value?: number | null
          id?: string
          message?: string | null
          metadata?: Json | null
          operation?: string | null
          severity?: string
          threshold_value?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      governance_rules: {
        Row: {
          config: Json
          current_usage: number | null
          last_reset_at: string | null
          rule_key: string
        }
        Insert: {
          config: Json
          current_usage?: number | null
          last_reset_at?: string | null
          rule_key: string
        }
        Update: {
          config?: Json
          current_usage?: number | null
          last_reset_at?: string | null
          rule_key?: string
        }
        Relationships: []
      }
      instagram_posts: {
        Row: {
          admin_user_id: string
          ai_generated: boolean | null
          caption: string
          created_at: string
          cta_action: string | null
          desired_outcome: string | null
          generation_metadata: Json | null
          hashtags: string[] | null
          id: string
          image_urls: Json | null
          is_favorite: boolean | null
          pain_point: string | null
          post_type: string | null
          quality_score: number | null
          rejected_at: string | null
          rejection_reason: string | null
          scheduled_date: string | null
          slides: Json | null
          status: string | null
          target_audience: string
          topic: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          ai_generated?: boolean | null
          caption: string
          created_at?: string
          cta_action?: string | null
          desired_outcome?: string | null
          generation_metadata?: Json | null
          hashtags?: string[] | null
          id?: string
          image_urls?: Json | null
          is_favorite?: boolean | null
          pain_point?: string | null
          post_type?: string | null
          quality_score?: number | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          slides?: Json | null
          status?: string | null
          target_audience: string
          topic: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          ai_generated?: boolean | null
          caption?: string
          created_at?: string
          cta_action?: string | null
          desired_outcome?: string | null
          generation_metadata?: Json | null
          hashtags?: string[] | null
          id?: string
          image_urls?: Json | null
          is_favorite?: boolean | null
          pain_point?: string | null
          post_type?: string | null
          quality_score?: number | null
          rejected_at?: string | null
          rejection_reason?: string | null
          scheduled_date?: string | null
          slides?: Json | null
          status?: string | null
          target_audience?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      "Knowledge embeddings": {
        Row: {
          chunk_index: string | null
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string | null
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_index?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_index?: string | null
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string | null
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string | null
          updated_at: string | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          city: string | null
          company_name: string | null
          created_at: string
          decision_makers: Json | null
          decision_makers_emails: Json | null
          email: string | null
          enrichment_status: string | null
          id: string
          notes: string | null
          phone: string | null
          predicted_score: number | null
          score: number | null
          segment: string | null
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          decision_makers?: Json | null
          decision_makers_emails?: Json | null
          email?: string | null
          enrichment_status?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          predicted_score?: number | null
          score?: number | null
          segment?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          decision_makers?: Json | null
          decision_makers_emails?: Json | null
          email?: string | null
          enrichment_status?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          predicted_score?: number | null
          score?: number | null
          segment?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      linkedin_analytics_daily: {
        Row: {
          created_at: string
          id: string
          messages_received_today: number | null
          messages_sent_today: number | null
          meta: Json | null
          profile_views: number | null
          snapshot_date: string
          total_connections: number | null
          total_conversations: number | null
          unipile_account_id: string
          unread_conversations: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages_received_today?: number | null
          messages_sent_today?: number | null
          meta?: Json | null
          profile_views?: number | null
          snapshot_date?: string
          total_connections?: number | null
          total_conversations?: number | null
          unipile_account_id: string
          unread_conversations?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          messages_received_today?: number | null
          messages_sent_today?: number | null
          meta?: Json | null
          profile_views?: number | null
          snapshot_date?: string
          total_connections?: number | null
          total_conversations?: number | null
          unipile_account_id?: string
          unread_conversations?: number | null
        }
        Relationships: []
      }
      linkedin_carousels: {
        Row: {
          admin_user_id: string
          assets_used: string[] | null
          caption: string
          content_embedding: string | null
          created_at: string
          cta_action: string | null
          desired_outcome: string | null
          format: string | null
          generation_metadata: Json | null
          generation_method: string | null
          generation_settings: Json | null
          id: string
          image_urls: Json | null
          is_favorite: boolean | null
          pain_point: string | null
          performance_metrics: Json | null
          profile_type: Database["public"]["Enums"]["profile_type_enum"] | null
          proof_points: string | null
          quality_score: number | null
          regeneration_count: number | null
          scheduled_date: string | null
          slides: Json
          status: string | null
          target_audience: string
          tone: string | null
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_user_id: string
          assets_used?: string[] | null
          caption: string
          content_embedding?: string | null
          created_at?: string
          cta_action?: string | null
          desired_outcome?: string | null
          format?: string | null
          generation_metadata?: Json | null
          generation_method?: string | null
          generation_settings?: Json | null
          id?: string
          image_urls?: Json | null
          is_favorite?: boolean | null
          pain_point?: string | null
          performance_metrics?: Json | null
          profile_type?: Database["public"]["Enums"]["profile_type_enum"] | null
          proof_points?: string | null
          quality_score?: number | null
          regeneration_count?: number | null
          scheduled_date?: string | null
          slides: Json
          status?: string | null
          target_audience: string
          tone?: string | null
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_user_id?: string
          assets_used?: string[] | null
          caption?: string
          content_embedding?: string | null
          created_at?: string
          cta_action?: string | null
          desired_outcome?: string | null
          format?: string | null
          generation_metadata?: Json | null
          generation_method?: string | null
          generation_settings?: Json | null
          id?: string
          image_urls?: Json | null
          is_favorite?: boolean | null
          pain_point?: string | null
          performance_metrics?: Json | null
          profile_type?: Database["public"]["Enums"]["profile_type_enum"] | null
          proof_points?: string | null
          quality_score?: number | null
          regeneration_count?: number | null
          scheduled_date?: string | null
          slides?: Json
          status?: string | null
          target_audience?: string
          tone?: string | null
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      processed_product_images: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          custom_prompt: string | null
          description: string | null
          enhanced_url: string
          file_size: number | null
          id: string
          is_featured: boolean | null
          is_visible: boolean | null
          model: string | null
          name: string
          original_filename: string
          original_url: string
          processed_by: string | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          custom_prompt?: string | null
          description?: string | null
          enhanced_url: string
          file_size?: number | null
          id?: string
          is_featured?: boolean | null
          is_visible?: boolean | null
          model?: string | null
          name: string
          original_filename: string
          original_url: string
          processed_by?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          custom_prompt?: string | null
          description?: string | null
          enhanced_url?: string
          file_size?: number | null
          id?: string
          is_featured?: boolean | null
          is_visible?: boolean | null
          model?: string | null
          name?: string
          original_filename?: string
          original_url?: string
          processed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_catalog: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          embedding: string | null
          id: string
          image_url: string
          metadata: Json | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          image_url: string
          metadata?: Json | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          embedding?: string | null
          id?: string
          image_url?: string
          metadata?: Json | null
          name?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          content: string
          created_at: string | null
          description: string | null
          download_url: string | null
          id: string
          metadata: Json | null
          persona: string | null
          slug: string
          status: string | null
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          description?: string | null
          download_url?: string | null
          id?: string
          metadata?: Json | null
          persona?: string | null
          slug: string
          status?: string | null
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          description?: string | null
          download_url?: string | null
          id?: string
          metadata?: Json | null
          persona?: string | null
          slug?: string
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      spending_limits: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          limit_type: string
          max_cost: number
          max_requests: number | null
          operation: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          limit_type: string
          max_cost: number
          max_requests?: number | null
          operation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          limit_type?: string
          max_cost?: number
          max_requests?: number | null
          operation?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      daily_spending_summary: {
        Row: {
          date: string | null
          operation: string | null
          operation_count: number | null
          service: string | null
          total_cost: number | null
          total_requests: number | null
          user_id: string | null
        }
        Relationships: []
      }
      lead_analytics_detailed: {
        Row: {
          annual_volume: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string | null
          is_converted: boolean | null
          lead_date: string | null
          name: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"] | null
          project_types:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          status: Database["public"]["Enums"]["lead_status"] | null
          time_bucket: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      lead_metrics_by_period: {
        Row: {
          active_leads: number | null
          closed_leads: number | null
          conversion_rate: number | null
          new_leads: number | null
          period: string | null
          rejected_leads: number | null
          total_leads: number | null
        }
        Relationships: []
      }
      project_type_distribution: {
        Row: {
          conversion_rate: number | null
          converted_count: number | null
          count: number | null
          project_type:
            | Database["public"]["Enums"]["project_type_option"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_daily_limit: {
        Args: { p_action_type: string; p_user_id: string }
        Returns: boolean
      }
      check_spending_limit: {
        Args: {
          p_estimated_cost: number
          p_operation: string
          p_user_id: string
        }
        Returns: Json
      }
      create_cost_alert: {
        Args: {
          p_alert_type: string
          p_current_value: number
          p_message: string
          p_operation: string
          p_severity: string
          p_threshold_value: number
          p_user_id: string
        }
        Returns: string
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { p_role: string; p_uid: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      log_api_cost: {
        Args: {
          p_estimated_cost: number
          p_metadata?: Json
          p_model: string
          p_operation: string
          p_service: string
          p_user_id: string
        }
        Returns: string
      }
      match_knowledge_base: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_type: string
        }[]
      }
      match_product_assets: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          description: string
          id: string
          image_url: string
          name: string
          similarity: number
        }[]
      }
      match_successful_carousels: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          quality_score: number
          similarity: number
          slides: Json
          topic: string
        }[]
      }
      refresh_daily_spending_summary: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      lead_priority: "low" | "medium" | "high"
      lead_source: "website" | "unipile"
      lead_status:
        | "new"
        | "contacted"
        | "in_progress"
        | "quoted"
        | "closed"
        | "rejected"
      profile_type_enum: "company" | "salesperson"
      project_type_option:
        | "dental_implants"
        | "orthopedic_implants"
        | "spinal_implants"
        | "veterinary_implants"
        | "surgical_instruments"
        | "micro_precision_parts"
        | "custom_tooling"
        | "medical_devices"
        | "measurement_tools"
        | "other_medical"
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
      app_role: ["admin", "moderator", "user"],
      lead_priority: ["low", "medium", "high"],
      lead_source: ["website", "unipile"],
      lead_status: [
        "new",
        "contacted",
        "in_progress",
        "quoted",
        "closed",
        "rejected",
      ],
      profile_type_enum: ["company", "salesperson"],
      project_type_option: [
        "dental_implants",
        "orthopedic_implants",
        "spinal_implants",
        "veterinary_implants",
        "surgical_instruments",
        "micro_precision_parts",
        "custom_tooling",
        "medical_devices",
        "measurement_tools",
        "other_medical",
      ],
    },
  },
} as const
