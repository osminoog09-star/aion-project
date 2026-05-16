/**
 * Типы public-схемы Supabase для typed client.
 * Синхронизируйте с миграциями в supabase/migrations/.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          default_currency: string;
          region: string | null;
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          default_currency?: string;
          region?: string | null;
          locale?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          default_currency?: string;
          region?: string | null;
          locale?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      vehicles: {
        Row: {
          id: string;
          user_id: string;
          catalog_id: string | null;
          payload: Json;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          catalog_id?: string | null;
          payload: Json;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          catalog_id?: string | null;
          payload?: Json;
          is_primary?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string | null;
          client_ref: string | null;
          payload: Json;
          started_at: string;
          ended_at: string | null;
          earnings: number | null;
          expenses_total: number | null;
          distance_km: number | null;
          duration_seconds: number | null;
          fuel_liters_equivalent: number | null;
          profit_per_hour: number | null;
          profit_per_km: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id?: string | null;
          client_ref?: string | null;
          payload: Json;
          started_at: string;
          ended_at?: string | null;
          earnings?: number | null;
          expenses_total?: number | null;
          distance_km?: number | null;
          duration_seconds?: number | null;
          fuel_liters_equivalent?: number | null;
          profit_per_hour?: number | null;
          profit_per_km?: number | null;
          created_at?: string;
        };
        Update: {
          vehicle_id?: string | null;
          client_ref?: string | null;
          payload?: Json;
          started_at?: string;
          ended_at?: string | null;
          earnings?: number | null;
          expenses_total?: number | null;
          distance_km?: number | null;
          duration_seconds?: number | null;
          fuel_liters_equivalent?: number | null;
          profit_per_hour?: number | null;
          profit_per_km?: number | null;
        };
        Relationships: [];
      };
      fuel_entries: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string | null;
          station_id: string | null;
          fuel_kind: string;
          volume: number | null;
          price_per_unit: number | null;
          total_amount: number | null;
          currency: string;
          odometer_km: number | null;
          note: string | null;
          occurred_at: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id?: string | null;
          station_id?: string | null;
          fuel_kind: string;
          volume?: number | null;
          price_per_unit?: number | null;
          total_amount?: number | null;
          currency?: string;
          odometer_km?: number | null;
          note?: string | null;
          occurred_at: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          vehicle_id?: string | null;
          station_id?: string | null;
          fuel_kind?: string;
          volume?: number | null;
          price_per_unit?: number | null;
          total_amount?: number | null;
          currency?: string;
          odometer_km?: number | null;
          note?: string | null;
          occurred_at?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          vehicle_id: string | null;
          category: string;
          amount: number;
          currency: string;
          occurred_at: string;
          note: string | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vehicle_id?: string | null;
          category: string;
          amount: number;
          currency?: string;
          occurred_at: string;
          note?: string | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          vehicle_id?: string | null;
          category?: string;
          amount?: number;
          currency?: string;
          occurred_at?: string;
          note?: string | null;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      stations: {
        Row: {
          id: string;
          external_ref: string | null;
          name: string;
          lat: number;
          lng: number;
          country_code: string | null;
          provider: string;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          external_ref?: string | null;
          name: string;
          lat: number;
          lng: number;
          country_code?: string | null;
          provider?: string;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          external_ref?: string | null;
          name?: string;
          lat?: number;
          lng?: number;
          country_code?: string | null;
          provider?: string;
          meta?: Json;
        };
        Relationships: [];
      };
      favourite_stations: {
        Row: {
          user_id: string;
          station_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          station_id: string;
          created_at?: string;
        };
        Update: {
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_snapshots: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          kind: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          kind: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          payload?: Json;
        };
        Relationships: [];
      };
      driver_cloud_state: {
        Row: {
          user_id: string;
          payload: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          payload?: Json;
          updated_at?: string;
        };
        Update: {
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          body: string | null;
          read_at: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          title: string;
          body?: string | null;
          read_at?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
          payload?: Json;
        };
        Relationships: [];
      };
      ecosystem_public_snapshots: {
        Row: {
          id: string;
          kind: string;
          payload: Json;
          is_public: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          kind: string;
          payload?: Json;
          is_public?: boolean;
          updated_at?: string;
        };
        Update: {
          kind?: string;
          payload?: Json;
          is_public?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          install_id: string;
          platform: string;
          device_model: string | null;
          app_version: string | null;
          last_seen_at: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          install_id: string;
          platform: string;
          device_model?: string | null;
          app_version?: string | null;
          last_seen_at?: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          install_id?: string;
          platform?: string;
          device_model?: string | null;
          app_version?: string | null;
          last_seen_at?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      paired_devices: {
        Row: {
          id: string;
          user_id: string;
          device_a_id: string;
          device_b_id: string;
          status: string;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_a_id: string;
          device_b_id: string;
          status?: string;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          device_a_id?: string;
          device_b_id?: string;
          status?: string;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      device_activity: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          event_kind: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          event_kind: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          payload?: Json;
        };
        Relationships: [];
      };
      ecosystem_release_ota: {
        Row: {
          id: string;
          channel: string;
          version: string;
          runtime_version: string | null;
          notes: string | null;
          payload: Json;
          published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel: string;
          version: string;
          runtime_version?: string | null;
          notes?: string | null;
          payload?: Json;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          channel?: string;
          version?: string;
          runtime_version?: string | null;
          notes?: string | null;
          payload?: Json;
          published?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecosystem_release_apk: {
        Row: {
          id: string;
          latest_version: string;
          minimum_supported: string;
          apk_url: string;
          runtime_version: string | null;
          notes: string | null;
          payload: Json;
          published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          latest_version: string;
          minimum_supported: string;
          apk_url: string;
          runtime_version?: string | null;
          notes?: string | null;
          payload?: Json;
          published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          latest_version?: string;
          minimum_supported?: string;
          apk_url?: string;
          runtime_version?: string | null;
          notes?: string | null;
          payload?: Json;
          published?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecosystem_rollout_state: {
        Row: {
          id: string;
          ota_release_id: string | null;
          apk_release_id: string | null;
          channel: string;
          rollout_status: string;
          cohort_percentage: number;
          visible_public: boolean;
          payload: Json;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ota_release_id?: string | null;
          apk_release_id?: string | null;
          channel: string;
          rollout_status?: string;
          cohort_percentage?: number;
          visible_public?: boolean;
          payload?: Json;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          ota_release_id?: string | null;
          apk_release_id?: string | null;
          channel?: string;
          rollout_status?: string;
          cohort_percentage?: number;
          visible_public?: boolean;
          payload?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecosystem_changelog_entries: {
        Row: {
          id: string;
          title: string;
          body: string | null;
          semver: string | null;
          released_at: string | null;
          ota_release_id: string | null;
          apk_release_id: string | null;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body?: string | null;
          semver?: string | null;
          released_at?: string | null;
          ota_release_id?: string | null;
          apk_release_id?: string | null;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          body?: string | null;
          semver?: string | null;
          released_at?: string | null;
          ota_release_id?: string | null;
          apk_release_id?: string | null;
          published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      ecosystem_release_ack: {
        Row: {
          id: string;
          user_id: string;
          ota_release_id: string | null;
          apk_release_id: string | null;
          acked_at: string;
          payload: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          ota_release_id?: string | null;
          apk_release_id?: string | null;
          acked_at?: string;
          payload?: Json;
        };
        Update: {
          ota_release_id?: string | null;
          apk_release_id?: string | null;
          acked_at?: string;
          payload?: Json;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
