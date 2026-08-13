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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notices: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          ends_at: string | null
          id: string
          is_active: boolean
          link_url: string | null
          message: string
          starts_at: string | null
          target_pages: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          message: string
          starts_at?: string | null
          target_pages?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          message?: string
          starts_at?: string | null
          target_pages?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      admin_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          module: Database["public"]["Enums"]["admin_module"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          module: Database["public"]["Enums"]["admin_module"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          module?: Database["public"]["Enums"]["admin_module"]
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          device: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id: number
          metadata: Json
          path: string | null
          referrer: string | null
          result_count: number | null
          scroll_pct: number | null
          search_query: string | null
          session_id: string
        }
        Insert: {
          created_at?: string
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: Database["public"]["Enums"]["analytics_event_type"]
          id?: number
          metadata?: Json
          path?: string | null
          referrer?: string | null
          result_count?: number | null
          scroll_pct?: number | null
          search_query?: string | null
          session_id: string
        }
        Update: {
          created_at?: string
          device?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: Database["public"]["Enums"]["analytics_event_type"]
          id?: number
          metadata?: Json
          path?: string | null
          referrer?: string | null
          result_count?: number | null
          scroll_pct?: number | null
          search_query?: string | null
          session_id?: string
        }
        Relationships: []
      }
      b_authors: {
        Row: {
          bio: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          profile_image: string | null
          profile_link: string | null
          show_email: boolean
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          profile_image?: string | null
          profile_link?: string | null
          show_email?: boolean
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          profile_image?: string | null
          profile_link?: string | null
          show_email?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      b_blog_authors_map: {
        Row: {
          author_id: string
          blog_id: string
        }
        Insert: {
          author_id: string
          blog_id: string
        }
        Update: {
          author_id?: string
          blog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b_blog_authors_map_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "b_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b_blog_authors_map_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "b_authors_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b_blog_authors_map_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "b_blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      b_blog_media_map: {
        Row: {
          blog_id: string
          display_order: number | null
          is_featured: boolean | null
          media_id: string
        }
        Insert: {
          blog_id: string
          display_order?: number | null
          is_featured?: boolean | null
          media_id: string
        }
        Update: {
          blog_id?: string
          display_order?: number | null
          is_featured?: boolean | null
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b_blog_media_map_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "b_blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b_blog_media_map_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "b_media"
            referencedColumns: ["id"]
          },
        ]
      }
      b_blog_seo: {
        Row: {
          blog_id: string
          canonical_url: string | null
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          updated_at: string
        }
        Insert: {
          blog_id: string
          canonical_url?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          updated_at?: string
        }
        Update: {
          blog_id?: string
          canonical_url?: string | null
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "b_blog_seo_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: true
            referencedRelation: "b_blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      b_blog_status_history: {
        Row: {
          blog_id: string
          changed_at: string
          id: string
          status: Database["public"]["Enums"]["content_status_enum"]
        }
        Insert: {
          blog_id: string
          changed_at?: string
          id?: string
          status: Database["public"]["Enums"]["content_status_enum"]
        }
        Update: {
          blog_id?: string
          changed_at?: string
          id?: string
          status?: Database["public"]["Enums"]["content_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "b_blog_status_history_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "b_blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      b_blog_tags_map: {
        Row: {
          blog_id: string
          tag_id: string
        }
        Insert: {
          blog_id: string
          tag_id: string
        }
        Update: {
          blog_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "b_blog_tags_map_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "b_blogs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "b_blog_tags_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "b_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      b_blog_versions: {
        Row: {
          blog_id: string
          change_summary: string | null
          content: string | null
          edited_at: string
          edited_by: string | null
          id: string
          title: string | null
          version_number: number
        }
        Insert: {
          blog_id: string
          change_summary?: string | null
          content?: string | null
          edited_at?: string
          edited_by?: string | null
          id?: string
          title?: string | null
          version_number?: number
        }
        Update: {
          blog_id?: string
          change_summary?: string | null
          content?: string | null
          edited_at?: string
          edited_by?: string | null
          id?: string
          title?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "b_blog_versions_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "b_blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      b_blogs: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string
          id: string
          is_featured: boolean
          is_top: boolean
          published_at: string | null
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["content_status_enum"]
          summary: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_top?: boolean
          published_at?: string | null
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["content_status_enum"]
          summary?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          is_top?: boolean
          published_at?: string | null
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["content_status_enum"]
          summary?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "b_blogs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "b_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      b_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      b_media: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          media_type: Database["public"]["Enums"]["media_type_enum"]
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type_enum"]
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type_enum"]
          url?: string
        }
        Relationships: []
      }
      b_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          delivery_error: string | null
          email: string
          email_status: string | null
          id: string
          is_read: boolean
          message: string
          name: string
          sms_status: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          delivery_error?: string | null
          email: string
          email_status?: string | null
          id?: string
          is_read?: boolean
          message: string
          name: string
          sms_status?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          delivery_error?: string | null
          email?: string
          email_status?: string | null
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          sms_status?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      j_cities: {
        Row: {
          country_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state_id: string | null
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state_id?: string | null
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "j_cities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "j_countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "j_cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "j_states"
            referencedColumns: ["id"]
          },
        ]
      }
      j_companies: {
        Row: {
          created_at: string
          description: string | null
          employee_count: string | null
          founding_year: number | null
          headquarter: string | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          employee_count?: string | null
          founding_year?: number | null
          headquarter?: string | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          employee_count?: string | null
          founding_year?: number | null
          headquarter?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      j_company_domains_map: {
        Row: {
          company_id: string
          domain_id: string
        }
        Insert: {
          company_id: string
          domain_id: string
        }
        Update: {
          company_id?: string
          domain_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_company_domains_map_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "j_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "j_company_domains_map_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "j_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      j_countries: {
        Row: {
          created_at: string
          id: string
          iso_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          iso_code: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          iso_code?: string
          name?: string
        }
        Relationships: []
      }
      j_domains: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      j_featured: {
        Row: {
          content_type: Database["public"]["Enums"]["featured_content_type_enum"]
          created_at: string
          display_location: Database["public"]["Enums"]["featured_display_location_enum"]
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          job_id: string | null
          link_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          content_type?: Database["public"]["Enums"]["featured_content_type_enum"]
          created_at?: string
          display_location?: Database["public"]["Enums"]["featured_display_location_enum"]
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          job_id?: string | null
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["featured_content_type_enum"]
          created_at?: string
          display_location?: Database["public"]["Enums"]["featured_display_location_enum"]
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          job_id?: string | null
          link_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_featured_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      j_job_applications: {
        Row: {
          application_email: string | null
          application_type: Database["public"]["Enums"]["application_type_enum"]
          application_url: string | null
          created_at: string
          id: string
          job_id: string
        }
        Insert: {
          application_email?: string | null
          application_type?: Database["public"]["Enums"]["application_type_enum"]
          application_url?: string | null
          created_at?: string
          id?: string
          job_id: string
        }
        Update: {
          application_email?: string | null
          application_type?: Database["public"]["Enums"]["application_type_enum"]
          application_url?: string | null
          created_at?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      j_job_domains_map: {
        Row: {
          domain_id: string
          job_id: string
        }
        Insert: {
          domain_id: string
          job_id: string
        }
        Update: {
          domain_id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_job_domains_map_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "j_domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "j_job_domains_map_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      j_job_locations_map: {
        Row: {
          city_id: string
          job_id: string
        }
        Insert: {
          city_id: string
          job_id: string
        }
        Update: {
          city_id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_job_locations_map_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "j_cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "j_job_locations_map_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      j_job_seo: {
        Row: {
          canonical_url: string | null
          created_at: string
          id: string
          job_id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          robots: string | null
          updated_at: string
        }
        Insert: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          job_id: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          robots?: string | null
          updated_at?: string
        }
        Update: {
          canonical_url?: string | null
          created_at?: string
          id?: string
          job_id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          robots?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_job_seo_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      j_job_skills_map: {
        Row: {
          job_id: string
          skill_id: string
        }
        Insert: {
          job_id: string
          skill_id: string
        }
        Update: {
          job_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_job_skills_map_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "j_job_skills_map_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "j_skills"
            referencedColumns: ["id"]
          },
        ]
      }
      j_job_sources_map: {
        Row: {
          external_job_id: string | null
          job_id: string
          source_id: string
          source_url: string | null
        }
        Insert: {
          external_job_id?: string | null
          job_id: string
          source_id: string
          source_url?: string | null
        }
        Update: {
          external_job_id?: string | null
          job_id?: string
          source_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "j_job_sources_map_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "j_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "j_job_sources_map_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "j_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      j_jobs: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          experience_level: string | null
          experience_max: number | null
          experience_min: number | null
          expires_at: string | null
          id: string
          jd_pdf_url: string | null
          job_number: number
          job_type: string | null
          normalized_hash: string | null
          normalized_title: string | null
          posted_at: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["content_status_enum"]
          title: string
          updated_at: string
          work_mode: string | null
          workflow_stage: Database["public"]["Enums"]["job_workflow_stage_enum"]
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          experience_level?: string | null
          experience_max?: number | null
          experience_min?: number | null
          expires_at?: string | null
          id?: string
          jd_pdf_url?: string | null
          job_number?: number
          job_type?: string | null
          normalized_hash?: string | null
          normalized_title?: string | null
          posted_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["content_status_enum"]
          title: string
          updated_at?: string
          work_mode?: string | null
          workflow_stage?: Database["public"]["Enums"]["job_workflow_stage_enum"]
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          experience_level?: string | null
          experience_max?: number | null
          experience_min?: number | null
          expires_at?: string | null
          id?: string
          jd_pdf_url?: string | null
          job_number?: number
          job_type?: string | null
          normalized_hash?: string | null
          normalized_title?: string | null
          posted_at?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["content_status_enum"]
          title?: string
          updated_at?: string
          work_mode?: string | null
          workflow_stage?: Database["public"]["Enums"]["job_workflow_stage_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "j_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "j_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      j_skills: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      j_sources: {
        Row: {
          base_url: string | null
          company_id: string | null
          created_at: string
          id: string
          name: string
          page_type: Database["public"]["Enums"]["source_page_type_enum"]
          source_type: Database["public"]["Enums"]["source_type_enum"]
          updated_at: string
        }
        Insert: {
          base_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name: string
          page_type?: Database["public"]["Enums"]["source_page_type_enum"]
          source_type?: Database["public"]["Enums"]["source_type_enum"]
          updated_at?: string
        }
        Update: {
          base_url?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          name?: string
          page_type?: Database["public"]["Enums"]["source_page_type_enum"]
          source_type?: Database["public"]["Enums"]["source_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_sources_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "j_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      j_states: {
        Row: {
          country_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "j_states_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "j_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      j_taxonomy: {
        Row: {
          created_at: string
          display_order: number
          id: string
          kind: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          kind: string
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          kind?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      r_categories: {
        Row: {
          created_at: string
          default_view: string
          display_order: number
          field_config: Json
          icon: string | null
          id: string
          is_filled: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          default_view?: string
          display_order?: number
          field_config?: Json
          icon?: string | null
          id?: string
          is_filled?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          default_view?: string
          display_order?: number
          field_config?: Json
          icon?: string | null
          id?: string
          is_filled?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      r_resource_analytics: {
        Row: {
          download_count: number
          id: string
          resource_id: string
          updated_at: string
          view_count: number
        }
        Insert: {
          download_count?: number
          id?: string
          resource_id: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          download_count?: number
          id?: string
          resource_id?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "r_resource_analytics_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "r_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      r_resource_files: {
        Row: {
          created_at: string
          embed_code: string | null
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          is_downloadable: boolean | null
          is_streamable: boolean | null
          mime_type: string | null
          resource_id: string
          storage_type: Database["public"]["Enums"]["storage_type_enum"]
        }
        Insert: {
          created_at?: string
          embed_code?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean | null
          is_streamable?: boolean | null
          mime_type?: string | null
          resource_id: string
          storage_type?: Database["public"]["Enums"]["storage_type_enum"]
        }
        Update: {
          created_at?: string
          embed_code?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_downloadable?: boolean | null
          is_streamable?: boolean | null
          mime_type?: string | null
          resource_id?: string
          storage_type?: Database["public"]["Enums"]["storage_type_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "r_resource_files_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "r_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      r_resource_seo: {
        Row: {
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          resource_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          resource_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          resource_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "r_resource_seo_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "r_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      r_resource_tags_map: {
        Row: {
          resource_id: string
          tag_id: string
        }
        Insert: {
          resource_id: string
          tag_id: string
        }
        Update: {
          resource_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "r_resource_tags_map_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "r_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "r_resource_tags_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "r_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      r_resources: {
        Row: {
          category_id: string | null
          content: string | null
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          notes: string | null
          published_at: string | null
          resource_type: Database["public"]["Enums"]["resource_type_enum"]
          search_vector: unknown
          slug: string
          status: Database["public"]["Enums"]["content_status_enum"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          whats_new: string | null
        }
        Insert: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          notes?: string | null
          published_at?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type_enum"]
          search_vector?: unknown
          slug: string
          status?: Database["public"]["Enums"]["content_status_enum"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
          whats_new?: string | null
        }
        Update: {
          category_id?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          notes?: string | null
          published_at?: string | null
          resource_type?: Database["public"]["Enums"]["resource_type_enum"]
          search_vector?: unknown
          slug?: string
          status?: Database["public"]["Enums"]["content_status_enum"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          whats_new?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "r_resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "r_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      r_tag_groups: {
        Row: {
          category_id: string
          created_at: string
          display_order: number
          id: string
          name: string
          slug: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number
          id?: string
          name: string
          slug: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "r_tag_groups_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "r_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      r_tags: {
        Row: {
          created_at: string
          group_id: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          group_id?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          group_id?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "r_tags_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "r_tag_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          content: string
          created_at: string
          enabled: boolean
          id: string
          slug: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          slug: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          enabled?: boolean
          id?: string
          slug?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      storage_trash: {
        Row: {
          bucket_id: string
          entity_id: string
          entity_type: string
          file_path: string
          id: string
          permanent_delete_after: string
          trashed_at: string
        }
        Insert: {
          bucket_id?: string
          entity_id: string
          entity_type: string
          file_path: string
          id?: string
          permanent_delete_after?: string
          trashed_at?: string
        }
        Update: {
          bucket_id?: string
          entity_id?: string
          entity_type?: string
          file_path?: string
          id?: string
          permanent_delete_after?: string
          trashed_at?: string
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
      b_authors_public: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          profile_image: string | null
          profile_link: string | null
          show_email: boolean | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          name?: string | null
          profile_image?: string | null
          profile_link?: string | null
          show_email?: boolean | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: never
          id?: string | null
          name?: string | null
          profile_image?: string | null
          profile_link?: string | null
          show_email?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      analytics_blog_daily: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          sessions: number
          views: number
        }[]
      }
      analytics_blog_devices: {
        Args: { p_from: string; p_to: string }
        Returns: {
          device: string
          sessions: number
          views: number
        }[]
      }
      analytics_blog_referrers: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          referrer_host: string
          sessions: number
          views: number
        }[]
      }
      analytics_blog_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_views_per_session: number
          total_blog_views: number
          unique_blog_sessions: number
          unique_blogs_viewed: number
        }[]
      }
      analytics_blog_top: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          entity_id: string
          sessions: number
          views: number
        }[]
      }
      analytics_daily_series: {
        Args: { p_from: string; p_to: string }
        Returns: {
          count: number
          day: string
          event_type: string
          sessions: number
        }[]
      }
      analytics_device_breakdown: {
        Args: { p_from: string; p_to: string }
        Returns: {
          device: string
          page_views: number
          sessions_count: number
        }[]
      }
      analytics_featured_breakdown: {
        Args: { p_from: string; p_to: string }
        Returns: {
          bucket: string
          clicks: number
          ctr: number
          group_key: string
          impressions: number
        }[]
      }
      analytics_featured_daily: {
        Args: { p_from: string; p_to: string }
        Returns: {
          clicks: number
          day: string
          impressions: number
        }[]
      }
      analytics_featured_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          ctr: number
          total_clicks: number
          total_impressions: number
          unique_items: number
          unique_sessions: number
        }[]
      }
      analytics_featured_top: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          clicks: number
          content_type: string
          ctr: number
          display_location: string
          entity_id: string
          impressions: number
          title: string
        }[]
      }
      analytics_job_funnel: {
        Args: { p_from: string; p_to: string }
        Returns: {
          apply_clicks: number
          job_card_clicks: number
          job_views: number
          unique_apply_sessions: number
          unique_view_sessions: number
        }[]
      }
      analytics_returning_sessions: {
        Args: { p_from: string; p_to: string }
        Returns: {
          returning_sessions: number
          total_sessions: number
        }[]
      }
      analytics_scroll_distribution: {
        Args: { p_from: string; p_to: string }
        Returns: {
          count: number
          scroll_pct: number
        }[]
      }
      analytics_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          total_apply_clicks: number
          total_job_views: number
          total_page_views: number
          total_searches: number
          total_sessions: number
          total_zero_result_searches: number
        }[]
      }
      analytics_top_entities: {
        Args: {
          p_event_type: string
          p_from: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          count: number
          entity_id: string
          entity_type: string
        }[]
      }
      analytics_top_pages: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          path: string
          sessions: number
          views: number
        }[]
      }
      analytics_top_referrers: {
        Args: { p_from: string; p_limit?: number; p_to: string }
        Returns: {
          page_views: number
          referrer_host: string
          sessions: number
        }[]
      }
      analytics_top_searches: {
        Args: {
          p_from: string
          p_limit?: number
          p_to: string
          p_zero_only?: boolean
        }
        Returns: {
          avg_result_count: number
          count: number
          search_query: string
        }[]
      }
      delete_expired_jobs: { Args: never; Returns: undefined }
      has_module_access: {
        Args: {
          _module: Database["public"]["Enums"]["admin_module"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_resource_download: {
        Args: { p_resource_id: string }
        Returns: undefined
      }
      increment_resource_view: {
        Args: { p_resource_id: string }
        Returns: undefined
      }
      is_admin_or_editor: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_event: {
        Args: {
          p_device?: string
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_metadata?: Json
          p_path?: string
          p_referrer?: string
          p_result_count?: number
          p_scroll_pct?: number
          p_search_query?: string
          p_session_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      admin_module:
        | "analytics"
        | "jobs"
        | "bulk_jobs"
        | "blogs"
        | "resources"
        | "featured_carousel"
        | "taxonomy"
        | "user_management"
      analytics_event_type:
        | "page_view"
        | "job_view"
        | "job_card_click"
        | "apply_click"
        | "apply_email_click"
        | "search"
        | "search_zero_result"
        | "filter_apply"
        | "filter_clear"
        | "scroll_depth"
        | "blog_view"
        | "resource_view"
        | "resource_download"
        | "outbound_click"
        | "featured_impression"
        | "featured_click"
      app_role: "admin" | "editor" | "viewer"
      application_type_enum: "url" | "email"
      content_status_enum: "draft" | "published" | "archived" | "expired"
      experience_level_enum: "entry" | "mid" | "senior" | "lead" | "executive"
      featured_content_type_enum:
        | "poster_static"
        | "poster_clickable"
        | "poster_job_link"
        | "job_card"
      featured_display_location_enum: "home" | "job_detail"
      job_type_enum:
        | "full_time"
        | "part_time"
        | "contract"
        | "internship"
        | "freelance"
        | "temporary"
      job_workflow_stage_enum: "manual_draft" | "bulk_upload"
      media_type_enum: "image" | "video" | "audio" | "document"
      resource_type_enum:
        | "guide"
        | "template"
        | "report"
        | "tool"
        | "video"
        | "article"
      source_page_type_enum: "career" | "portal"
      source_type_enum: "scraper" | "api" | "manual" | "rss"
      storage_type_enum: "uploaded" | "embedded" | "external"
      work_mode_enum: "remote" | "onsite" | "hybrid"
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
      admin_module: [
        "analytics",
        "jobs",
        "bulk_jobs",
        "blogs",
        "resources",
        "featured_carousel",
        "taxonomy",
        "user_management",
      ],
      analytics_event_type: [
        "page_view",
        "job_view",
        "job_card_click",
        "apply_click",
        "apply_email_click",
        "search",
        "search_zero_result",
        "filter_apply",
        "filter_clear",
        "scroll_depth",
        "blog_view",
        "resource_view",
        "resource_download",
        "outbound_click",
        "featured_impression",
        "featured_click",
      ],
      app_role: ["admin", "editor", "viewer"],
      application_type_enum: ["url", "email"],
      content_status_enum: ["draft", "published", "archived", "expired"],
      experience_level_enum: ["entry", "mid", "senior", "lead", "executive"],
      featured_content_type_enum: [
        "poster_static",
        "poster_clickable",
        "poster_job_link",
        "job_card",
      ],
      featured_display_location_enum: ["home", "job_detail"],
      job_type_enum: [
        "full_time",
        "part_time",
        "contract",
        "internship",
        "freelance",
        "temporary",
      ],
      job_workflow_stage_enum: ["manual_draft", "bulk_upload"],
      media_type_enum: ["image", "video", "audio", "document"],
      resource_type_enum: [
        "guide",
        "template",
        "report",
        "tool",
        "video",
        "article",
      ],
      source_page_type_enum: ["career", "portal"],
      source_type_enum: ["scraper", "api", "manual", "rss"],
      storage_type_enum: ["uploaded", "embedded", "external"],
      work_mode_enum: ["remote", "onsite", "hybrid"],
    },
  },
} as const
