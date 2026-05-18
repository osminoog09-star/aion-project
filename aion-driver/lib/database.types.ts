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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_kind: string
          client_cookie_id: string | null
          id: number
          ip_address: unknown
          meta: Json
          occurred_at: string
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_kind: string
          client_cookie_id?: string | null
          id?: never
          ip_address?: unknown
          meta?: Json
          occurred_at?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_kind?: string
          client_cookie_id?: string | null
          id?: never
          ip_address?: unknown
          meta?: Json
          occurred_at?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      appointment_services: {
        Row: {
          appointment_id: string
          end_time: string
          id: string
          service_id: string
          staff_id: string
          start_time: string
        }
        Insert: {
          appointment_id: string
          end_time: string
          id?: string
          service_id: string
          staff_id: string
          start_time: string
        }
        Update: {
          appointment_id?: string
          end_time?: string
          id?: string
          service_id?: string
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "appointment_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          created_by_staff_id: string | null
          end_time: string | null
          id: string
          note: string | null
          service_id: string | null
          source: string
          staff_id: string | null
          start_time: string | null
          status: string
        }
        Insert: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          created_by_staff_id?: string | null
          end_time?: string | null
          id?: string
          note?: string | null
          service_id?: string | null
          source?: string
          staff_id?: string | null
          start_time?: string | null
          status?: string
        }
        Update: {
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          created_by_staff_id?: string | null
          end_time?: string | null
          id?: string
          note?: string | null
          service_id?: string | null
          source?: string
          staff_id?: string | null
          start_time?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "appointments_created_by_staff_id_fkey"
            columns: ["created_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      cookie_consents: {
        Row: {
          categories: string[]
          cookie_id: string
          granted_at: string
          id: number
          ip_address: unknown
          policy_version: string
          user_agent: string | null
          withdrawn_at: string | null
        }
        Insert: {
          categories?: string[]
          cookie_id: string
          granted_at?: string
          id?: never
          ip_address?: unknown
          policy_version: string
          user_agent?: string | null
          withdrawn_at?: string | null
        }
        Update: {
          categories?: string[]
          cookie_id?: string
          granted_at?: string
          id?: never
          ip_address?: unknown
          policy_version?: string
          user_agent?: string | null
          withdrawn_at?: string | null
        }
        Relationships: []
      }
      device_activity: {
        Row: {
          created_at: string
          device_id: string
          event_kind: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          event_kind: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          event_kind?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_activity_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          app_version: string | null
          created_at: string
          device_model: string | null
          id: string
          install_id: string
          last_seen_at: string
          payload: Json
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          id?: string
          install_id: string
          last_seen_at?: string
          payload?: Json
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          id?: string
          install_id?: string
          last_seen_at?: string
          payload?: Json
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      driver_bug_reports: {
        Row: {
          app_version: string | null
          category: string
          created_at: string
          description: string
          diagnostics: Json
          id: string
          platform: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          category?: string
          created_at?: string
          description: string
          diagnostics?: Json
          id?: string
          platform?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          category?: string
          created_at?: string
          description?: string
          diagnostics?: Json
          id?: string
          platform?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      driver_cloud_state: {
        Row: {
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ecosystem_changelog_entries: {
        Row: {
          apk_release_id: string | null
          body: string | null
          created_at: string
          id: string
          ota_release_id: string | null
          published: boolean
          released_at: string | null
          semver: string | null
          title: string
          updated_at: string
        }
        Insert: {
          apk_release_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          ota_release_id?: string | null
          published?: boolean
          released_at?: string | null
          semver?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          apk_release_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          ota_release_id?: string | null
          published?: boolean
          released_at?: string | null
          semver?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_changelog_entries_apk_release_id_fkey"
            columns: ["apk_release_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_release_apk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_changelog_entries_ota_release_id_fkey"
            columns: ["ota_release_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_release_ota"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_public_snapshots: {
        Row: {
          id: string
          is_public: boolean
          kind: string
          payload: Json
          updated_at: string
        }
        Insert: {
          id?: string
          is_public?: boolean
          kind: string
          payload?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          is_public?: boolean
          kind?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ecosystem_release_ack: {
        Row: {
          acked_at: string
          apk_release_id: string | null
          id: string
          ota_release_id: string | null
          payload: Json
          user_id: string
        }
        Insert: {
          acked_at?: string
          apk_release_id?: string | null
          id?: string
          ota_release_id?: string | null
          payload?: Json
          user_id: string
        }
        Update: {
          acked_at?: string
          apk_release_id?: string | null
          id?: string
          ota_release_id?: string | null
          payload?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_release_ack_apk_release_id_fkey"
            columns: ["apk_release_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_release_apk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_release_ack_ota_release_id_fkey"
            columns: ["ota_release_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_release_ota"
            referencedColumns: ["id"]
          },
        ]
      }
      ecosystem_release_apk: {
        Row: {
          apk_url: string
          created_at: string
          id: string
          latest_version: string
          minimum_supported: string
          notes: string | null
          payload: Json
          published: boolean
          published_at: string | null
          runtime_version: string | null
          updated_at: string
        }
        Insert: {
          apk_url: string
          created_at?: string
          id?: string
          latest_version: string
          minimum_supported: string
          notes?: string | null
          payload?: Json
          published?: boolean
          published_at?: string | null
          runtime_version?: string | null
          updated_at?: string
        }
        Update: {
          apk_url?: string
          created_at?: string
          id?: string
          latest_version?: string
          minimum_supported?: string
          notes?: string | null
          payload?: Json
          published?: boolean
          published_at?: string | null
          runtime_version?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ecosystem_release_ota: {
        Row: {
          channel: string
          created_at: string
          id: string
          notes: string | null
          payload: Json
          published: boolean
          published_at: string | null
          runtime_version: string | null
          updated_at: string
          version: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          notes?: string | null
          payload?: Json
          published?: boolean
          published_at?: string | null
          runtime_version?: string | null
          updated_at?: string
          version: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          notes?: string | null
          payload?: Json
          published?: boolean
          published_at?: string | null
          runtime_version?: string | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ecosystem_rollout_state: {
        Row: {
          apk_release_id: string | null
          channel: string
          cohort_percentage: number
          created_at: string
          id: string
          ota_release_id: string | null
          payload: Json
          rollout_status: string
          updated_at: string
          visible_public: boolean
        }
        Insert: {
          apk_release_id?: string | null
          channel: string
          cohort_percentage?: number
          created_at?: string
          id?: string
          ota_release_id?: string | null
          payload?: Json
          rollout_status?: string
          updated_at?: string
          visible_public?: boolean
        }
        Update: {
          apk_release_id?: string | null
          channel?: string
          cohort_percentage?: number
          created_at?: string
          id?: string
          ota_release_id?: string | null
          payload?: Json
          rollout_status?: string
          updated_at?: string
          visible_public?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ecosystem_rollout_state_apk_release_id_fkey"
            columns: ["apk_release_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_release_apk"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ecosystem_rollout_state_ota_release_id_fkey"
            columns: ["ota_release_id"]
            isOneToOne: false
            referencedRelation: "ecosystem_release_ota"
            referencedColumns: ["id"]
          },
        ]
      }
      email_jobs: {
        Row: {
          appointment_id: string | null
          attempts: number
          client_id: string | null
          created_at: string
          id: string
          job_type: string
          last_error: string | null
          payload: Json | null
          recipient_email: string
          recipient_name: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number
          client_id?: string | null
          created_at?: string
          id?: string
          job_type: string
          last_error?: string | null
          payload?: Json | null
          recipient_email: string
          recipient_name?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          attempts?: number
          client_id?: string | null
          created_at?: string
          id?: string
          job_type?: string
          last_error?: string | null
          payload?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_jobs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_jobs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_event_links: {
        Row: {
          appointment_id: string | null
          calendar_scope: string
          google_calendar_id: string
          google_event_etag: string | null
          google_event_id: string
          google_event_status: string | null
          google_event_updated_at: string | null
          id: string
          imported_at: string
          provider: string
          raw_event: Json | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          calendar_scope?: string
          google_calendar_id: string
          google_event_etag?: string | null
          google_event_id: string
          google_event_status?: string | null
          google_event_updated_at?: string | null
          id?: string
          imported_at?: string
          provider?: string
          raw_event?: Json | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          calendar_scope?: string
          google_calendar_id?: string
          google_event_etag?: string | null
          google_event_id?: string
          google_event_status?: string | null
          google_event_updated_at?: string | null
          id?: string
          imported_at?: string
          provider?: string
          raw_event?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_event_links_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_event_links_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token: string | null
          account_email: string | null
          created_at: string
          expires_at: string | null
          granted_scope: string | null
          id: string
          refresh_token: string | null
          scope_key: string
          staff_id: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          account_email?: string | null
          created_at?: string
          expires_at?: string | null
          granted_scope?: string | null
          id?: string
          refresh_token?: string | null
          scope_key?: string
          staff_id?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          account_email?: string | null
          created_at?: string
          expires_at?: string | null
          granted_scope?: string | null
          id?: string
          refresh_token?: string | null
          scope_key?: string
          staff_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_oauth_tokens_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "google_oauth_tokens_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_consumption_norms: {
        Row: {
          amount: number
          created_at: string
          id: string
          inventory_item_id: string
          notes: string | null
          service_listing_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          inventory_item_id: string
          notes?: string | null
          service_listing_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          inventory_item_id?: string
          notes?: string | null
          service_listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_consumption_norms_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_norms_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_low_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_consumption_norms_service_listing_id_fkey"
            columns: ["service_listing_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          low_stock_threshold: number | null
          name: string
          notes: string | null
          on_hand: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          low_stock_threshold?: number | null
          name: string
          notes?: string | null
          on_hand?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          low_stock_threshold?: number | null
          name?: string
          notes?: string | null
          on_hand?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          appointment_id: string | null
          cost_cents: number | null
          created_at: string
          delta: number
          id: string
          inventory_item_id: string
          movement_type: string
          notes: string | null
          on_hand_after: number
          staff_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          cost_cents?: number | null
          created_at?: string
          delta: number
          id?: string
          inventory_item_id: string
          movement_type: string
          notes?: string | null
          on_hand_after: number
          staff_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          cost_cents?: number | null
          created_at?: string
          delta?: number
          id?: string
          inventory_item_id?: string
          movement_type?: string
          notes?: string | null
          on_hand_after?: number
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_enriched"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_low_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "inventory_movements_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          body_md: string
          created_at: string
          id: number
          is_active: boolean
          kind: string
          lang: string
          published_at: string | null
          title: string
          version: string
        }
        Insert: {
          body_md: string
          created_at?: string
          id?: never
          is_active?: boolean
          kind: string
          lang: string
          published_at?: string | null
          title: string
          version: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: never
          is_active?: boolean
          kind?: string
          lang?: string
          published_at?: string | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      link_pair_tokens: {
        Row: {
          claimed_at: string | null
          claimed_by_device_id: string | null
          code: string
          created_at: string
          device_a_id: string | null
          expires_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_device_id?: string | null
          code: string
          created_at?: string
          device_a_id?: string | null
          expires_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_device_id?: string | null
          code?: string
          created_at?: string
          device_a_id?: string | null
          expires_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_pair_tokens_claimed_by_device_id_fkey"
            columns: ["claimed_by_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_pair_tokens_device_a_id_fkey"
            columns: ["device_a_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      link_snapshots: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          source_device_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          source_device_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          source_device_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_snapshots_source_device_id_fkey"
            columns: ["source_device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications_outbox: {
        Row: {
          appointment_id: string | null
          attempts: number
          created_at: string
          external_ref: string | null
          id: string
          kind: string
          last_attempt_at: string | null
          last_error: string | null
          payload: Json
          sent_at: string | null
          status: string
          target_scope: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number
          created_at?: string
          external_ref?: string | null
          id?: string
          kind?: string
          last_attempt_at?: string | null
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          target_scope?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          attempts?: number
          created_at?: string
          external_ref?: string | null
          id?: string
          kind?: string
          last_attempt_at?: string | null
          last_error?: string | null
          payload?: Json
          sent_at?: string | null
          status?: string
          target_scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_outbox_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_outbox_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      paired_devices: {
        Row: {
          created_at: string
          device_a_id: string
          device_b_id: string
          id: string
          payload: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_a_id: string
          device_b_id: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_a_id?: string
          device_b_id?: string
          id?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "paired_devices_device_a_id_fkey"
            columns: ["device_a_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paired_devices_device_b_id_fkey"
            columns: ["device_b_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_currency: string
          display_name: string | null
          id: string
          locale: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          display_name?: string | null
          id: string
          locale?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          display_name?: string | null
          id?: string
          locale?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      salon_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      service_listings: {
        Row: {
          buffer_after_min: number
          category_id: string | null
          duration: number | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          sort_order: number
        }
        Insert: {
          buffer_after_min?: number
          category_id?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          sort_order?: number
        }
        Update: {
          buffer_after_min?: number
          category_id?: string | null
          duration?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          buffer_after_min: number
          category: string | null
          created_at: string | null
          duration: number | null
          duration_min: number | null
          id: string
          name: string
          name_et: string | null
          price: number | null
          price_cents: number | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          buffer_after_min?: number
          category?: string | null
          created_at?: string | null
          duration?: number | null
          duration_min?: number | null
          id?: string
          name: string
          name_et?: string | null
          price?: number | null
          price_cents?: number | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          buffer_after_min?: number
          category?: string | null
          created_at?: string | null
          duration?: number | null
          duration_min?: number | null
          id?: string
          name?: string
          name_et?: string | null
          price?: number | null
          price_cents?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      site_blocks: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_id: string
          position: number
          type: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_id: string
          position?: number
          type: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_id?: string
          position?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "site_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      site_pages: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          status: string
          styles: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
          styles?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          styles?: Json
        }
        Relationships: []
      }
      staff: {
        Row: {
          calendar_color_hex: string | null
          calendar_email: string | null
          calendar_foreground_hex: string | null
          created_at: string | null
          google_calendar_account_email: string | null
          google_calendar_id: string | null
          google_calendar_last_error: string | null
          google_calendar_last_sync_at: string | null
          google_calendar_status: string
          id: string
          is_active: boolean
          name: string
          percent_rate: number | null
          phone: string | null
          pin_failed_attempts: number
          pin_hash: string | null
          pin_locked_until: string | null
          pin_set_at: string | null
          rent_per_day: number | null
          role: string
          roles: string[]
          show_on_marketing_site: boolean
          work_type: string
        }
        Insert: {
          calendar_color_hex?: string | null
          calendar_email?: string | null
          calendar_foreground_hex?: string | null
          created_at?: string | null
          google_calendar_account_email?: string | null
          google_calendar_id?: string | null
          google_calendar_last_error?: string | null
          google_calendar_last_sync_at?: string | null
          google_calendar_status?: string
          id?: string
          is_active?: boolean
          name: string
          percent_rate?: number | null
          phone?: string | null
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          pin_set_at?: string | null
          rent_per_day?: number | null
          role?: string
          roles?: string[]
          show_on_marketing_site?: boolean
          work_type?: string
        }
        Update: {
          calendar_color_hex?: string | null
          calendar_email?: string | null
          calendar_foreground_hex?: string | null
          created_at?: string | null
          google_calendar_account_email?: string | null
          google_calendar_id?: string | null
          google_calendar_last_error?: string | null
          google_calendar_last_sync_at?: string | null
          google_calendar_status?: string
          id?: string
          is_active?: boolean
          name?: string
          percent_rate?: number | null
          phone?: string | null
          pin_failed_attempts?: number
          pin_hash?: string | null
          pin_locked_until?: string | null
          pin_set_at?: string | null
          rent_per_day?: number | null
          role?: string
          roles?: string[]
          show_on_marketing_site?: boolean
          work_type?: string
        }
        Relationships: []
      }
      staff_invite_links: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          expires_at: string
          id: string
          last_used_at: string | null
          last_used_ip: unknown
          max_uses: number
          note: string | null
          revoked_at: string | null
          staff_id: string
          token_hash: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          expires_at: string
          id?: string
          last_used_at?: string | null
          last_used_ip?: unknown
          max_uses?: number
          note?: string | null
          revoked_at?: string | null
          staff_id: string
          token_hash: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          expires_at?: string
          id?: string
          last_used_at?: string | null
          last_used_ip?: unknown
          max_uses?: number
          note?: string | null
          revoked_at?: string | null
          staff_id?: string
          token_hash?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_invite_links_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_invite_links_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invite_links_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_invite_links_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invite_submissions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by_admin_id: string | null
          device_kind: string
          device_token_hash: string
          id: string
          invite_id: string
          ip_address: unknown
          linked_staff_id: string | null
          reject_reason: string | null
          status: string
          submitted_name: string
          submitted_phone: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by_admin_id?: string | null
          device_kind: string
          device_token_hash: string
          id?: string
          invite_id: string
          ip_address?: unknown
          linked_staff_id?: string | null
          reject_reason?: string | null
          status?: string
          submitted_name: string
          submitted_phone: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by_admin_id?: string | null
          device_kind?: string
          device_token_hash?: string
          id?: string
          invite_id?: string
          ip_address?: unknown
          linked_staff_id?: string | null
          reject_reason?: string | null
          status?: string
          submitted_name?: string
          submitted_phone?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_invite_submissions_decided_by_admin_id_fkey"
            columns: ["decided_by_admin_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_invite_submissions_decided_by_admin_id_fkey"
            columns: ["decided_by_admin_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invite_submissions_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "staff_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_invite_submissions_linked_staff_id_fkey"
            columns: ["linked_staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_invite_submissions_linked_staff_id_fkey"
            columns: ["linked_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invites: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          expires_at: string
          id: string
          intended_name: string | null
          intended_role: string | null
          max_uses: number
          note: string | null
          revoked_at: string | null
          token_hash: string
          uses_count: number
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          expires_at: string
          id?: string
          intended_name?: string | null
          intended_role?: string | null
          max_uses?: number
          note?: string | null
          revoked_at?: string | null
          token_hash: string
          uses_count?: number
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          expires_at?: string
          id?: string
          intended_name?: string | null
          intended_role?: string | null
          max_uses?: number
          note?: string | null
          revoked_at?: string | null
          token_hash?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_invites_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_invites_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_schedule: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          staff_id: string
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          staff_id: string
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_schedule_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_schedule_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_services: {
        Row: {
          created_at: string | null
          id: string
          service_id: string
          show_on_site: boolean
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_id: string
          show_on_site?: boolean
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_id?: string
          show_on_site?: boolean
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_time_off: {
        Row: {
          end_time: string
          id: string
          reason: string | null
          staff_id: string
          start_time: string
          time_off_type: string
        }
        Insert: {
          end_time: string
          id?: string
          reason?: string | null
          staff_id: string
          start_time: string
          time_off_type?: string
        }
        Update: {
          end_time?: string
          id?: string
          reason?: string | null
          staff_id?: string
          start_time?: string
          time_off_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_trusted_devices: {
        Row: {
          claimed_at: string | null
          claimed_by_admin_id: string | null
          created_at: string
          device_token_hash: string
          id: string
          ip_address: unknown
          is_salon_device: boolean
          label: string
          last_seen_at: string
          revoked_at: string | null
          staff_id: string
          user_agent: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_admin_id?: string | null
          created_at?: string
          device_token_hash: string
          id?: string
          ip_address?: unknown
          is_salon_device?: boolean
          label?: string
          last_seen_at?: string
          revoked_at?: string | null
          staff_id: string
          user_agent?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by_admin_id?: string | null
          created_at?: string
          device_token_hash?: string
          id?: string
          ip_address?: unknown
          is_salon_device?: boolean
          label?: string
          last_seen_at?: string
          revoked_at?: string | null
          staff_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_trusted_devices_claimed_by_admin_id_fkey"
            columns: ["claimed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_trusted_devices_claimed_by_admin_id_fkey"
            columns: ["claimed_by_admin_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_trusted_devices_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_trusted_devices_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_work_days: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_working: boolean
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_working?: boolean
          staff_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_working?: boolean
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_work_days_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "staff_work_days_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_size_bytes: number | null
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          sender_staff_id: string | null
          sender_type: string
          thread_id: string
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_size_bytes?: number | null
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          sender_staff_id?: string | null
          sender_type: string
          thread_id: string
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_size_bytes?: number | null
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          sender_staff_id?: string | null
          sender_type?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_sender_staff_id_fkey"
            columns: ["sender_staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "support_messages_sender_staff_id_fkey"
            columns: ["sender_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          archived_at: string | null
          archived_by_staff_id: string | null
          assigned_at: string | null
          assigned_by_staff_id: string | null
          assigned_staff_id: string | null
          client_ip: unknown
          client_ip_set_at: string | null
          created_at: string
          device_fingerprint: string | null
          display_id: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          last_sender_type: string | null
          staff_author_id: string | null
          status: string
          topic: string
          unread_for_staff: boolean
          unread_for_visitor: boolean
          updated_at: string
          visitor_email: string | null
          visitor_name: string
          visitor_origin_url: string | null
          visitor_session_token: string
          visitor_user_agent: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by_staff_id?: string | null
          assigned_at?: string | null
          assigned_by_staff_id?: string | null
          assigned_staff_id?: string | null
          client_ip?: unknown
          client_ip_set_at?: string | null
          created_at?: string
          device_fingerprint?: string | null
          display_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sender_type?: string | null
          staff_author_id?: string | null
          status?: string
          topic?: string
          unread_for_staff?: boolean
          unread_for_visitor?: boolean
          updated_at?: string
          visitor_email?: string | null
          visitor_name: string
          visitor_origin_url?: string | null
          visitor_session_token: string
          visitor_user_agent?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by_staff_id?: string | null
          assigned_at?: string | null
          assigned_by_staff_id?: string | null
          assigned_staff_id?: string | null
          client_ip?: unknown
          client_ip_set_at?: string | null
          created_at?: string
          device_fingerprint?: string | null
          display_id?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_sender_type?: string | null
          staff_author_id?: string | null
          status?: string
          topic?: string
          unread_for_staff?: boolean
          unread_for_visitor?: boolean
          updated_at?: string
          visitor_email?: string | null
          visitor_name?: string
          visitor_origin_url?: string | null
          visitor_session_token?: string
          visitor_user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_archived_by_staff_id_fkey"
            columns: ["archived_by_staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "support_threads_archived_by_staff_id_fkey"
            columns: ["archived_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_threads_assigned_by_staff_id_fkey"
            columns: ["assigned_by_staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "support_threads_assigned_by_staff_id_fkey"
            columns: ["assigned_by_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_threads_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "support_threads_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_threads_staff_author_id_fkey"
            columns: ["staff_author_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "support_threads_staff_author_id_fkey"
            columns: ["staff_author_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          client_ref: string | null
          created_at: string
          distance_km: number | null
          duration_seconds: number | null
          earnings: number | null
          ended_at: string | null
          expenses_total: number | null
          fuel_liters_equivalent: number | null
          id: string
          payload: Json
          profit_per_hour: number | null
          profit_per_km: number | null
          started_at: string
          user_id: string
          vehicle_id: string | null
        }
        Insert: {
          client_ref?: string | null
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number | null
          earnings?: number | null
          ended_at?: string | null
          expenses_total?: number | null
          fuel_liters_equivalent?: number | null
          id?: string
          payload: Json
          profit_per_hour?: number | null
          profit_per_km?: number | null
          started_at: string
          user_id: string
          vehicle_id?: string | null
        }
        Update: {
          client_ref?: string | null
          created_at?: string
          distance_km?: number | null
          duration_seconds?: number | null
          earnings?: number | null
          ended_at?: string | null
          expenses_total?: number | null
          fuel_liters_equivalent?: number | null
          id?: string
          payload?: Json
          profit_per_hour?: number | null
          profit_per_km?: number | null
          started_at?: string
          user_id?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          catalog_id: string | null
          created_at: string
          id: string
          is_primary: boolean
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          catalog_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          payload: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          catalog_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      analytics_daily: {
        Row: {
          appointments_count: number | null
          avg_check_cents: number | null
          cancellations_count: number | null
          day: string | null
          revenue_cents: number | null
        }
        Relationships: []
      }
      analytics_kpi_now: {
        Row: {
          email_due: number | null
          email_failed: number | null
          low_stock_count: number | null
          month_avg_check_cents: number | null
          month_cancelled: number | null
          month_count: number | null
          month_revenue_cents: number | null
          today_count: number | null
          today_revenue_cents: number | null
          week_count: number | null
          week_revenue_cents: number | null
        }
        Relationships: []
      }
      analytics_staff_load_30d: {
        Row: {
          appointments_count: number | null
          billed_hours: number | null
          revenue_cents: number | null
          staff_id: string | null
          staff_name: string | null
        }
        Relationships: []
      }
      analytics_top_services_30d: {
        Row: {
          bookings: number | null
          revenue_cents: number | null
          service_id: string | null
          service_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_top_services_90d: {
        Row: {
          bookings: number | null
          revenue_cents: number | null
          service_id: string | null
          service_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments_enriched: {
        Row: {
          buffer_after_min: number | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          duration_min: number | null
          end_time: string | null
          id: string | null
          note: string | null
          price_cents: number | null
          service_id: string | null
          service_name: string | null
          staff_id: string | null
          start_time: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "analytics_staff_load_30d"
            referencedColumns: ["staff_id"]
          },
          {
            foreignKeyName: "appointments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_low_stock: {
        Row: {
          category: string | null
          deficit: number | null
          id: string | null
          low_stock_threshold: number | null
          name: string | null
          on_hand: number | null
          unit: string | null
        }
        Insert: {
          category?: string | null
          deficit?: never
          id?: string | null
          low_stock_threshold?: number | null
          name?: string | null
          on_hand?: number | null
          unit?: string | null
        }
        Update: {
          category?: string | null
          deficit?: never
          id?: string | null
          low_stock_threshold?: number | null
          name?: string | null
          on_hand?: number | null
          unit?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _log_activity: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_kind: string
          p_client_cookie_id: string
          p_meta: Json
          p_resource_id: string
          p_resource_type: string
        }
        Returns: number
      }
      _staff_assert_admin: { Args: { actor_id: string }; Returns: undefined }
      _staff_assert_manage: { Args: { actor_id: string }; Returns: undefined }
      _staff_normalize_phone: { Args: { phone_input: string }; Returns: string }
      _staff_request_client_ip: { Args: never; Returns: unknown }
      _staff_resolve_by_phone: {
        Args: { phone_input: string }
        Returns: {
          calendar_color_hex: string | null
          calendar_email: string | null
          calendar_foreground_hex: string | null
          created_at: string | null
          google_calendar_account_email: string | null
          google_calendar_id: string | null
          google_calendar_last_error: string | null
          google_calendar_last_sync_at: string | null
          google_calendar_status: string
          id: string
          is_active: boolean
          name: string
          percent_rate: number | null
          phone: string | null
          pin_failed_attempts: number
          pin_hash: string | null
          pin_locked_until: string | null
          pin_set_at: string | null
          rent_per_day: number | null
          role: string
          roles: string[]
          show_on_marketing_site: boolean
          work_type: string
        }
        SetofOptions: {
          from: "*"
          to: "staff"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      _staff_to_public_json: {
        Args: { s: Database["public"]["Tables"]["staff"]["Row"] }
        Returns: Json
      }
      _staff_token_hash: { Args: { token_input: string }; Returns: string }
      _support_request_ip: { Args: never; Returns: unknown }
      _support_staff_context: {
        Args: { p_staff_id: string }
        Returns: {
          is_admin: boolean
          is_manager: boolean
          staff_id: string
          staff_name: string
        }[]
      }
      _support_topic_prefix: { Args: { p_topic: string }; Returns: string }
      client_log_activity: {
        Args: { p_action: string; p_cookie_id: string; p_meta?: Json }
        Returns: Json
      }
      client_record_consent: {
        Args: {
          p_categories: string[]
          p_cookie_id: string
          p_policy_version: string
        }
        Returns: Json
      }
      email_jobs_retry: { Args: { job_id: string }; Returns: Json }
      inventory_consume_for_appointment: {
        Args: { appointment_id_input: string }
        Returns: Json
      }
      legal_get_active: {
        Args: { p_kind: string; p_lang: string }
        Returns: Json
      }
      outbox_resume_skipped:
        | { Args: never; Returns: number }
        | { Args: { p_scope?: string }; Returns: number }
      outbox_retry: { Args: { p_id: string }; Returns: undefined }
      public_book_chain: {
        Args: {
          p_client_name: string
          p_client_note: string
          p_client_phone: string
          p_created_by_staff_id?: string
          p_items: Json
          p_source?: string
          p_start_at: string
        }
        Returns: Json
      }
      public_site_booking_panel_enabled: { Args: never; Returns: boolean }
      public_staff_busy_during: {
        Args: { p_end: string; p_staff_id: string; p_start: string }
        Returns: boolean
      }
      public_staff_does_service: {
        Args: { p_service_id: string; p_staff_id: string }
        Returns: boolean
      }
      staff_active_devices_count: {
        Args: { staff_id_input: string }
        Returns: number
      }
      staff_admin_activity: {
        Args: {
          p_actor_id: string
          p_before_at?: string
          p_limit?: number
          p_target_actor_id?: string
          p_target_cookie_id?: string
        }
        Returns: Json[]
      }
      staff_admin_claim_device_for_salon: {
        Args: { actor_id: string; device_id_input: string }
        Returns: Json
      }
      staff_admin_create_invite: {
        Args: {
          actor_id: string
          expires_in_minutes?: number
          max_uses_input?: number
          note_input?: string
          target_staff_id: string
        }
        Returns: Json
      }
      staff_admin_list_all_devices: {
        Args: { actor_id: string }
        Returns: Json[]
      }
      staff_admin_list_invites: { Args: { actor_id: string }; Returns: Json[] }
      staff_admin_release_device_to_owner: {
        Args: { actor_id: string; device_id_input: string }
        Returns: Json
      }
      staff_admin_revoke_device: {
        Args: { actor_id: string; device_id_input: string }
        Returns: Json
      }
      staff_admin_revoke_invite: {
        Args: { actor_id: string; invite_id_input: string }
        Returns: Json
      }
      staff_consume_invite: {
        Args: {
          device_label?: string
          token_input: string
          user_agent_input?: string
        }
        Returns: Json
      }
      staff_google_calendar_disconnect: {
        Args: { p_staff_id: string }
        Returns: undefined
      }
      staff_invite_approve_submission: {
        Args: {
          action_input: string
          actor_id: string
          submission_id_input: string
          target_staff_id_input?: string
        }
        Returns: Json
      }
      staff_invite_create: {
        Args: {
          actor_id: string
          expires_in_hours?: number
          intended_name_input?: string
          intended_role_input?: string
          max_uses_input?: number
          note_input?: string
        }
        Returns: Json
      }
      staff_invite_list: { Args: { actor_id: string }; Returns: Json[] }
      staff_invite_lookup: { Args: { token_input: string }; Returns: Json }
      staff_invite_reject_submission: {
        Args: {
          actor_id: string
          reason_input?: string
          submission_id_input: string
        }
        Returns: Json
      }
      staff_invite_revoke: {
        Args: { actor_id: string; invite_id_input: string }
        Returns: Json
      }
      staff_invite_submission_status: {
        Args: { device_token_input: string; submission_id_input: string }
        Returns: Json
      }
      staff_invite_submissions_list: {
        Args: { actor_id: string }
        Returns: Json[]
      }
      staff_invite_submit: {
        Args: {
          device_kind_input: string
          name_input: string
          phone_input: string
          token_input: string
          user_agent_input?: string
        }
        Returns: Json
      }
      staff_invite_suggest_matches: {
        Args: { actor_id: string; submission_id_input: string }
        Returns: Json[]
      }
      staff_list_trusted_devices: {
        Args: { staff_id_input: string }
        Returns: Json[]
      }
      staff_login: {
        Args: {
          device_label?: string
          device_token?: string
          phone_input: string
          pin_input?: string
          trust_this_device?: boolean
          user_agent_input?: string
        }
        Returns: Json
      }
      staff_login_by_device: {
        Args: { device_token: string; user_agent_input?: string }
        Returns: Json
      }
      staff_manage_list_all_devices: {
        Args: { actor_id: string }
        Returns: Json[]
      }
      staff_my_activity: {
        Args: { p_actor_id: string; p_before_at?: string; p_limit?: number }
        Returns: Json[]
      }
      staff_revoke_trusted_device: {
        Args: { device_id_input: string; staff_id_input: string }
        Returns: Json
      }
      staff_set_pin: {
        Args: { current_pin: string; new_pin: string; staff_id_input: string }
        Returns: Json
      }
      support_staff_archive_thread: {
        Args: { p_archive?: boolean; p_staff_id: string; p_thread_id: string }
        Returns: Json
      }
      support_staff_fetch_messages: {
        Args: { p_staff_id: string; p_thread_id: string }
        Returns: Json
      }
      support_staff_list_threads: {
        Args: {
          p_include_archived?: boolean
          p_limit?: number
          p_staff_id: string
          p_status_filter?: string
          p_topic_filter?: string
        }
        Returns: Json
      }
      support_staff_post_message: {
        Args: {
          p_attachment_mime?: string
          p_attachment_name?: string
          p_attachment_size_bytes?: number
          p_attachment_url?: string
          p_body: string
          p_staff_id: string
          p_thread_id: string
        }
        Returns: Json
      }
      support_staff_self_fetch: {
        Args: { p_staff_id: string; p_thread_id: string }
        Returns: Json
      }
      support_staff_self_list: { Args: { p_staff_id: string }; Returns: Json }
      support_staff_self_mark_read: {
        Args: { p_staff_id: string; p_thread_id: string }
        Returns: undefined
      }
      support_staff_self_open: {
        Args: {
          p_attachment_mime?: string
          p_attachment_name?: string
          p_attachment_size_bytes?: number
          p_attachment_url?: string
          p_body: string
          p_staff_id: string
        }
        Returns: Json
      }
      support_staff_self_post: {
        Args: {
          p_attachment_mime?: string
          p_attachment_name?: string
          p_attachment_size_bytes?: number
          p_attachment_url?: string
          p_body: string
          p_staff_id: string
          p_thread_id: string
        }
        Returns: Json
      }
      support_staff_self_unread_count: {
        Args: { p_staff_id: string }
        Returns: number
      }
      support_staff_stats: {
        Args: { p_staff_id: string; p_topic_filter?: string }
        Returns: Json
      }
      support_staff_unread_count: {
        Args: { p_staff_id: string }
        Returns: number
      }
      support_staff_update_thread: {
        Args: {
          p_assigned_staff_id?: string
          p_clear_assignee?: boolean
          p_clear_unread?: boolean
          p_staff_id: string
          p_status?: string
          p_thread_id: string
        }
        Returns: Json
      }
      support_visitor_fetch: {
        Args: { p_session_token: string; p_since_iso?: string }
        Returns: Json
      }
      support_visitor_mark_read: {
        Args: { p_session_token: string }
        Returns: undefined
      }
      support_visitor_post_message: {
        Args: {
          p_attachment_mime?: string
          p_attachment_name?: string
          p_attachment_size_bytes?: number
          p_attachment_url?: string
          p_body: string
          p_session_token: string
        }
        Returns: Json
      }
      support_visitor_start_thread: {
        Args: {
          p_attachment_mime?: string
          p_attachment_name?: string
          p_attachment_size_bytes?: number
          p_attachment_url?: string
          p_email: string
          p_message: string
          p_name: string
          p_origin_url?: string
          p_session_token: string
          p_topic: string
          p_user_agent?: string
        }
        Returns: Json
      }
      verify_staff_phone: { Args: { phone_input: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
