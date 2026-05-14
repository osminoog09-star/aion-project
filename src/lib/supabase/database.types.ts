export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
