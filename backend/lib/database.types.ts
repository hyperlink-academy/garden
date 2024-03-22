export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
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
      debug_logs: {
        Row: {
          data: Json | null
          id: number
          time: string | null
        }
        Insert: {
          data?: Json | null
          id?: number
          time?: string | null
        }
        Update: {
          data?: Json | null
          id?: number
          time?: string | null
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
          where_did_you_find_us: string | null
        }
        Insert: {
          id: string
          studio: string
          username: string
          where_did_you_find_us?: string | null
        }
        Update: {
          id?: string
          studio?: string
          username?: string
          where_did_you_find_us?: string | null
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
          joined_at: string | null
          member: string
          space_id: string
        }
        Insert: {
          joined_at?: string | null
          member: string
          space_id: string
        }
        Update: {
          joined_at?: string | null
          member?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_in_spaces_member_fkey"
            columns: ["member"]
            referencedRelation: "identity_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_in_spaces_space_id_fkey"
            columns: ["space_id"]
            referencedRelation: "space_data"
            referencedColumns: ["id"]
          }
        ]
      }
      members_in_studios: {
        Row: {
          joined_at: string | null
          member: string
          studio: string
        }
        Insert: {
          joined_at?: string | null
          member: string
          studio: string
        }
        Update: {
          joined_at?: string | null
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
          created_at: string | null
          endpoint: string
          id: number
          push_subscription: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: number
          push_subscription: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
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
          created_at: string | null
          default_space_image: string | null
          description: string | null
          display_name: string | null
          do_id: string
          end_date: string | null
          id: string
          image: string | null
          join_code: string | null
          lastUpdated: string | null
          name: string | null
          owner: string
          start_date: string | null
        }
        Insert: {
          archived?: boolean
          created_at?: string | null
          default_space_image?: string | null
          description?: string | null
          display_name?: string | null
          do_id: string
          end_date?: string | null
          id?: string
          image?: string | null
          join_code?: string | null
          lastUpdated?: string | null
          name?: string | null
          owner: string
          start_date?: string | null
        }
        Update: {
          archived?: boolean
          created_at?: string | null
          default_space_image?: string | null
          description?: string | null
          display_name?: string | null
          do_id?: string
          end_date?: string | null
          id?: string
          image?: string | null
          join_code?: string | null
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
      space_events: {
        Row: {
          at: string
          event: string
          id: number
          space_id: string
          user: string
        }
        Insert: {
          at?: string
          event: string
          id?: number
          space_id: string
          user: string
        }
        Update: {
          at?: string
          event?: string
          id?: number
          space_id?: string
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_events_space_id_fkey"
            columns: ["space_id"]
            referencedRelation: "space_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_events_user_fkey"
            columns: ["user"]
            referencedRelation: "identity_data"
            referencedColumns: ["id"]
          }
        ]
      }
      spaces_in_studios: {
        Row: {
          created_at: string | null
          space_id: string
          studio: string
        }
        Insert: {
          created_at?: string | null
          space_id: string
          studio: string
        }
        Update: {
          created_at?: string | null
          space_id?: string
          studio?: string
        }
        Relationships: [
          {
            foreignKeyName: "spaces_in_studios_space_id_fkey"
            columns: ["space_id"]
            referencedRelation: "space_data"
            referencedColumns: ["id"]
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
          allow_members_to_join_spaces: boolean
          created_at: string | null
          creator: string
          description: string | null
          do_id: string
          id: string
          join_code: string | null
          name: string
          welcome_message: string
        }
        Insert: {
          allow_members_to_join_spaces?: boolean
          created_at?: string | null
          creator: string
          description?: string | null
          do_id: string
          id?: string
          join_code?: string | null
          name: string
          welcome_message?: string
        }
        Update: {
          allow_members_to_join_spaces?: boolean
          created_at?: string | null
          creator?: string
          description?: string | null
          do_id?: string
          id?: string
          join_code?: string | null
          name?: string
          welcome_message?: string
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
      user_space_unreads: {
        Row: {
          space_id: string
          unreads: number
          user: string
        }
        Insert: {
          space_id: string
          unreads: number
          user: string
        }
        Update: {
          space_id?: string
          unreads?: number
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_space_unreads_space_id_fkey"
            columns: ["space_id"]
            referencedRelation: "space_data"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_space_unreads_user_fkey"
            columns: ["user"]
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

