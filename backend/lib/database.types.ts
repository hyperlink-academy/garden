export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      communities: {
        Row: {
          id: number
          name: string
          spaceID: string
        }
        Insert: {
          id?: number
          name: string
          spaceID: string
        }
        Update: {
          id?: number
          name?: string
          spaceID?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          created_at: string
          deleted: boolean
          hash: string
          id: string
          space: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted?: boolean
          hash: string
          id?: string
          space: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted?: boolean
          hash?: string
          id?: string
          space?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      identity_data: {
        Row: {
          id: string
          studio: string
          username: string
        }
        Insert: {
          id: string
          studio: string
          username: string
        }
        Update: {
          id?: string
          studio?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "identity_data_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      members_in_spaces: {
        Row: {
          member: string
          space_do_id: string
        }
        Insert: {
          member: string
          space_do_id: string
        }
        Update: {
          member?: string
          space_do_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_in_spaces_member_fkey"
            columns: ["member"]
            referencedRelation: "identity_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_in_spaces_space_do_id_fkey"
            columns: ["space_do_id"]
            referencedRelation: "space_data"
            referencedColumns: ["do_id"]
          }
        ]
      }
      members_in_studios: {
        Row: {
          member: string
          studio: string
        }
        Insert: {
          member: string
          studio: string
        }
        Update: {
          member?: string
          studio?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_in_studios_member_fkey"
            columns: ["member"]
            referencedRelation: "identity_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_in_studios_studio_fkey"
            columns: ["studio"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          }
        ]
      }
      old_identities: {
        Row: {
          email: string
          hashed_password: string
          studio: string
          username: string
        }
        Insert: {
          email: string
          hashed_password: string
          studio: string
          username: string
        }
        Update: {
          email?: string
          hashed_password?: string
          studio?: string
          username?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          endpoint: string
          id: number
          push_subscription: Json
          user_id: string
        }
        Insert: {
          endpoint: string
          id?: number
          push_subscription: Json
          user_id: string
        }
        Update: {
          endpoint?: string
          id?: number
          push_subscription?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "identity_data"
            referencedColumns: ["id"]
          }
        ]
      }
      space_data: {
        Row: {
          archived: boolean
          default_space_image: string | null
          description: string | null
          display_name: string | null
          do_id: string
          end_date: string | null
          id: string
          image: string | null
          lastUpdated: string | null
          name: string | null
          owner: string
          start_date: string | null
        }
        Insert: {
          archived?: boolean
          default_space_image?: string | null
          description?: string | null
          display_name?: string | null
          do_id: string
          end_date?: string | null
          id?: string
          image?: string | null
          lastUpdated?: string | null
          name?: string | null
          owner: string
          start_date?: string | null
        }
        Update: {
          archived?: boolean
          default_space_image?: string | null
          description?: string | null
          display_name?: string | null
          do_id?: string
          end_date?: string | null
          id?: string
          image?: string | null
          lastUpdated?: string | null
          name?: string | null
          owner?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_data_owner_fkey"
            columns: ["owner"]
            referencedRelation: "identity_data"
            referencedColumns: ["id"]
          }
        ]
      }
      spaces_in_studios: {
        Row: {
          space: string
          studio: string
        }
        Insert: {
          space: string
          studio: string
        }
        Update: {
          space?: string
          studio?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_in_studios_space_fkey"
            columns: ["space"]
            referencedRelation: "space_data"
            referencedColumns: ["do_id"]
          },
          {
            foreignKeyName: "spaces_in_studios_studio_fkey"
            columns: ["studio"]
            referencedRelation: "studios"
            referencedColumns: ["id"]
          }
        ]
      }
      studios: {
        Row: {
          creator: string
          description: string | null
          do_id: string
          id: string
          name: string
        }
        Insert: {
          creator: string
          description?: string | null
          do_id: string
          id?: string
          name: string
        }
        Update: {
          creator?: string
          description?: string | null
          do_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "studios_creator_fkey"
            columns: ["creator"]
            referencedRelation: "identity_data"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buckets_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "objects_owner_fkey"
            columns: ["owner"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

