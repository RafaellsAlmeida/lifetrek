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
      admin_permissions: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          permission_level: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          permission_level?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          permission_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      app_config: {
        Row: {
          created_at: string | null
          key: string
          value: string
        }
        Insert: {
          created_at?: string | null
          key: string
          value: string
        }
        Update: {
          created_at?: string | null
          key?: string
          value?: string
        }
        Relationships: []
      }
      blog_analytics: {
        Row: {
          company_domain: string | null
          created_at: string
          cta_clicked: boolean | null
          id: string
          post_id: string | null
          referrer: string | null
          scroll_depth: number | null
          session_id: string
          time_on_page: number | null
          updated_at: string
          user_email: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          viewed_at: string
        }
        Insert: {
          company_domain?: string | null
          created_at?: string
          cta_clicked?: boolean | null
          id?: string
          post_id?: string | null
          referrer?: string | null
          scroll_depth?: number | null
          session_id: string
          time_on_page?: number | null
          updated_at?: string
          user_email?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_at?: string
        }
        Update: {
          company_domain?: string | null
          created_at?: string
          cta_clicked?: boolean | null
          id?: string
          post_id?: string | null
          referrer?: string | null
          scroll_depth?: number | null
          session_id?: string
          time_on_page?: number | null
          updated_at?: string
          user_email?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_analytics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_lead_attribution: {
        Row: {
          avg_scroll_depth: number | null
          avg_time_on_page: number | null
          company_domain: string | null
          company_name: string | null
          converted_to_lead_at: string | null
          created_at: string
          crm_lead_id: string | null
          deal_closed_at: string | null
          deal_stage: string | null
          deal_value: number | null
          favorite_category: string | null
          favorite_keywords: string[] | null
          first_blog_post: string | null
          first_visited_at: string | null
          id: string
          lead_email: string
          lead_source: string | null
          total_cta_clicks: number | null
          total_posts_viewed: number | null
          updated_at: string
        }
        Insert: {
          avg_scroll_depth?: number | null
          avg_time_on_page?: number | null
          company_domain?: string | null
          company_name?: string | null
          converted_to_lead_at?: string | null
          created_at?: string
          crm_lead_id?: string | null
          deal_closed_at?: string | null
          deal_stage?: string | null
          deal_value?: number | null
          favorite_category?: string | null
          favorite_keywords?: string[] | null
          first_blog_post?: string | null
          first_visited_at?: string | null
          id?: string
          lead_email: string
          lead_source?: string | null
          total_cta_clicks?: number | null
          total_posts_viewed?: number | null
          updated_at?: string
        }
        Update: {
          avg_scroll_depth?: number | null
          avg_time_on_page?: number | null
          company_domain?: string | null
          company_name?: string | null
          converted_to_lead_at?: string | null
          created_at?: string
          crm_lead_id?: string | null
          deal_closed_at?: string | null
          deal_stage?: string | null
          deal_value?: number | null
          favorite_category?: string | null
          favorite_keywords?: string[] | null
          first_blog_post?: string | null
          first_visited_at?: string | null
          id?: string
          lead_email?: string
          lead_source?: string | null
          total_cta_clicks?: number | null
          total_posts_viewed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_lead_attribution_first_blog_post_fkey"
            columns: ["first_blog_post"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          ai_generated: boolean | null
          author_name: string
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          keywords: string[] | null
          news_sources: string[] | null
          published_at: string | null
          scheduled_for: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          author_name?: string
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          news_sources?: string[] | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          author_name?: string
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          keywords?: string[] | null
          news_sources?: string[] | null
          published_at?: string | null
          scheduled_for?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      company_assets: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          name: string | null
          type: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          type: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          type?: string
          url?: string
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
          city: string | null
          cnpj: string | null
          company: string | null
          created_at: string
          email: string
          employees: string | null
          id: string
          industry: string | null
          lead_score: number | null
          linkedin_url: string | null
          message: string | null
          name: string
          phone: string
          priority: Database["public"]["Enums"]["lead_priority"]
          project_type: string
          project_types:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          revenue_range: string | null
          score_breakdown: Json | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          technical_requirements: string
          updated_at: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          annual_volume?: string | null
          assigned_to?: string | null
          city?: string | null
          cnpj?: string | null
          company?: string | null
          created_at?: string
          email: string
          employees?: string | null
          id?: string
          industry?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          message?: string | null
          name: string
          phone: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_type: string
          project_types?:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          revenue_range?: string | null
          score_breakdown?: Json | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          technical_requirements: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          annual_volume?: string | null
          assigned_to?: string | null
          city?: string | null
          cnpj?: string | null
          company?: string | null
          created_at?: string
          email?: string
          employees?: string | null
          id?: string
          industry?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          message?: string | null
          name?: string
          phone?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          project_type?: string
          project_types?:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          revenue_range?: string | null
          score_breakdown?: Json | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          technical_requirements?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      content_approvals: {
        Row: {
          approved_at: string | null
          comments: string | null
          created_at: string
          id: string
          reviewer_email: string | null
          reviewer_name: string
          reviewer_type: string
          status: string
          template_id: string
        }
        Insert: {
          approved_at?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          reviewer_email?: string | null
          reviewer_name: string
          reviewer_type?: string
          status: string
          template_id: string
        }
        Update: {
          approved_at?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          reviewer_email?: string | null
          reviewer_name?: string
          reviewer_type?: string
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_approvals_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      content_assets: {
        Row: {
          admin_user_id: string | null
          category: string | null
          content_type: string | null
          created_at: string | null
          file_path: string
          filename: string
          id: string
          size: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          category?: string | null
          content_type?: string | null
          created_at?: string | null
          file_path: string
          filename: string
          id?: string
          size?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          category?: string | null
          content_type?: string | null
          created_at?: string | null
          file_path?: string
          filename?: string
          id?: string
          size?: number | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_comments: {
        Row: {
          comment: string
          commenter_email: string | null
          commenter_name: string
          created_at: string
          id: string
          template_id: string
        }
        Insert: {
          comment: string
          commenter_email?: string | null
          commenter_name: string
          created_at?: string
          id?: string
          template_id: string
        }
        Update: {
          comment?: string
          commenter_email?: string | null
          commenter_name?: string
          created_at?: string
          id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "content_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string | null
          id: string
          language: string
          niche: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          niche?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          language?: string
          niche?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          assigned_to: string
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "contact_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "lead_analytics_detailed"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_embeddings: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string | null
          source_type: string
          updated_at: string | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string | null
          source_type: string
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
          source_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      linkedin_carousels: {
        Row: {
          admin_user_id: string
          caption: string
          created_at: string
          cta_action: string | null
          desired_outcome: string | null
          format: string | null
          generation_settings: Json | null
          id: string
          image_urls: Json | null
          is_favorite: boolean | null
          pain_point: string | null
          performance_metrics: Json | null
          proof_points: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          scheduled_for: string | null
          slides: Json
          status: string | null
          target_audience: string
          topic: string
          updated_at: string
        }
        Insert: {
          admin_user_id: string
          caption: string
          created_at?: string
          cta_action?: string | null
          desired_outcome?: string | null
          format?: string | null
          generation_settings?: Json | null
          id?: string
          image_urls?: Json | null
          is_favorite?: boolean | null
          pain_point?: string | null
          performance_metrics?: Json | null
          proof_points?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          slides: Json
          status?: string | null
          target_audience: string
          topic: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string
          caption?: string
          created_at?: string
          cta_action?: string | null
          desired_outcome?: string | null
          format?: string | null
          generation_settings?: Json | null
          id?: string
          image_urls?: Json | null
          is_favorite?: boolean | null
          pain_point?: string | null
          performance_metrics?: Json | null
          proof_points?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          scheduled_for?: string | null
          slides?: Json
          status?: string | null
          target_audience?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      linkedin_generation_logs: {
        Row: {
          admin_user_id: string
          analyst_output: Json | null
          carousel_id: string | null
          created_at: string | null
          final_output: Json | null
          generation_time_ms: number | null
          id: string
          image_count: number | null
          input_params: Json
          model_used: string | null
          strategist_output: Json | null
        }
        Insert: {
          admin_user_id: string
          analyst_output?: Json | null
          carousel_id?: string | null
          created_at?: string | null
          final_output?: Json | null
          generation_time_ms?: number | null
          id?: string
          image_count?: number | null
          input_params: Json
          model_used?: string | null
          strategist_output?: Json | null
        }
        Update: {
          admin_user_id?: string
          analyst_output?: Json | null
          carousel_id?: string | null
          created_at?: string | null
          final_output?: Json | null
          generation_time_ms?: number | null
          id?: string
          image_count?: number | null
          input_params?: Json
          model_used?: string | null
          strategist_output?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_generation_logs_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "linkedin_carousels"
            referencedColumns: ["id"]
          },
        ]
      }
      news_digest: {
        Row: {
          blog_posts_created: string[] | null
          content: string
          created_at: string
          customer_interests: string[] | null
          generated_at: string
          id: string
          search_query: string | null
          sources: string[] | null
        }
        Insert: {
          blog_posts_created?: string[] | null
          content: string
          created_at?: string
          customer_interests?: string[] | null
          generated_at?: string
          id?: string
          search_query?: string | null
          sources?: string[] | null
        }
        Update: {
          blog_posts_created?: string[] | null
          content?: string
          created_at?: string
          customer_interests?: string[] | null
          generated_at?: string
          id?: string
          search_query?: string | null
          sources?: string[] | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          item_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          item_key?: string
          updated_at?: string
          user_id?: string
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
          id: string
          image_url: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
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
        Insert: {
          annual_volume?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_converted?: never
          lead_date?: never
          name?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          project_types?:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          time_bucket?: never
          updated_at?: string | null
        }
        Update: {
          annual_volume?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string | null
          is_converted?: never
          lead_date?: never
          name?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          project_types?:
            | Database["public"]["Enums"]["project_type_option"][]
            | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          time_bucket?: never
          updated_at?: string | null
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
      extract_domain_from_email: { Args: { email: string }; Returns: string }
      get_admin_permission_level: { Args: never; Returns: string }
      get_top_customer_interests: {
        Args: { limit_count?: number }
        Returns: {
          avg_engagement_score: number
          keyword: string
          post_count: number
          total_views: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      match_knowledge: {
        Args: {
          filter_source_type?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_id: string
          source_type: string
        }[]
      }
      search_products_for_carousel: {
        Args: {
          limit_count?: number
          search_category?: string
          search_query?: string
        }
        Returns: {
          brand: string
          category: string
          description: string
          enhanced_url: string
          id: string
          model: string
          name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      lead_priority: "low" | "medium" | "high"
      lead_status:
        | "new"
        | "contacted"
        | "in_progress"
        | "quoted"
        | "closed"
        | "rejected"
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
      app_role: ["admin", "user", "super_admin"],
      lead_priority: ["low", "medium", "high"],
      lead_status: [
        "new",
        "contacted",
        "in_progress",
        "quoted",
        "closed",
        "rejected",
      ],
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
