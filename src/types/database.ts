/**
 * Typed mirror of supabase/migrations. Once you have the Supabase CLI
 * linked you can regenerate this file with:
 *   supabase gen types typescript --linked > src/types/database.ts
 * Until then it is maintained by hand — keep it in lockstep with SQL.
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
          display_name: string;
          avatar_url: string | null;
          together_since: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          together_since?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          together_since?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      albums: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          cover_image: string | null;
          location: string | null;
          latitude: number | null;
          longitude: number | null;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          cover_image?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          cover_image?: string | null;
          location?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          album_id: string;
          user_id: string;
          storage_path: string;
          url: string;
          width: number;
          height: number;
          is_favorite: boolean;
          note: string | null;
          size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          album_id: string;
          user_id: string;
          storage_path: string;
          url: string;
          width: number;
          height: number;
          is_favorite?: boolean;
          note?: string | null;
          size_bytes?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_favorite?: boolean;
          note?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
        Relationships: [];
      };
      album_tags: {
        Row: {
          album_id: string;
          tag_id: string;
        };
        Insert: {
          album_id: string;
          tag_id: string;
        };
        Update: {
          album_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "album_tags_album_id_fkey";
            columns: ["album_id"];
            isOneToOne: false;
            referencedRelation: "albums";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "album_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: {
          user_id: string;
          album_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          album_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          album_id?: string;
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

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
