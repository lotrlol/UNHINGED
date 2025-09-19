export interface Database {
  public: {
    Functions: {
      increment: {
        Args: {
          table_name: string;
          column_name: string;
          id_value: string;
          amount?: number;
        };
        Returns: void;
      };
      decrement: {
        Args: {
          table_name: string;
          column_name: string;
          id_value: string;
          amount?: number;
        };
        Returns: void;
      };
    };
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          roles: string[]
          skills: string[]
          looking_for: string[]
          tagline: string | null
          bio: string | null
          vibe_words: string[]
          location: string | null
          is_remote: boolean
          nsfw_preference: boolean
          avatar_url: string | null
          cover_url: string | null
          banner_url: string | null
          banner_path: string | null
          is_verified: boolean
          phone_verified: boolean
          flagged: boolean
          onboarding_completed: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name: string
          roles: string[]
          skills?: string[]
          looking_for?: string[]
          tagline?: string | null
          bio?: string | null
          vibe_words?: string[]
          location?: string | null
          is_remote?: boolean
          nsfw_preference?: boolean
          avatar_url?: string | null
          cover_url?: string | null
          banner_url?: string | null
          banner_path?: string | null
          is_verified?: boolean
          phone_verified?: boolean
          flagged?: boolean
          onboarding_completed?: boolean
          created_at?: string
        }
        Update: {
          username?: string
          full_name?: string
          roles?: string[]
          skills?: string[]
          looking_for?: string[]
          tagline?: string | null
          bio?: string | null
          vibe_words?: string[]
          location?: string | null
          is_remote?: boolean
          nsfw_preference?: boolean
          avatar_url?: string | null
          cover_url?: string | null
          is_verified?: boolean
          phone_verified?: boolean
          flagged?: boolean
          onboarding_completed?: boolean
        }
      }
      projects: {
        Row: {
          id: string
          creator_id: string
          creator_type: 'profile' | 'group'
          title: string
          description: string
          roles_needed: string[]
          collab_type: 'Paid' | 'Unpaid' | 'Revenue Split'
          tags: string[]
          location: string | null
          is_remote: boolean
          nsfw: boolean
          cover_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          creator_type: 'profile' | 'group'
          title: string
          description: string
          roles_needed: string[]
          collab_type: 'Paid' | 'Unpaid' | 'Revenue Split'
          tags?: string[]
          location?: string | null
          is_remote?: boolean
          nsfw?: boolean
          cover_url?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          roles_needed?: string[]
          collab_type?: 'Paid' | 'Unpaid' | 'Revenue Split'
          tags?: string[]
          location?: string | null
          is_remote?: boolean
          nsfw?: boolean
          cover_url?: string | null
        }
      }
      project_applications: {
        Row: {
          id: string
          project_id: string
          applicant_id: string
          status: 'pending' | 'accepted' | 'rejected'
          applied_at: string
          decided_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          applicant_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          applied_at?: string
          decided_at?: string | null
        }
        Update: {
          status?: 'pending' | 'accepted' | 'rejected'
          decided_at?: string | null
        }
      }
      matches: {
        Row: {
          id: string
          project_id: string
          creator_id: string
          user_id: string
          chat_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          creator_id: string
          user_id: string
          chat_id?: string | null
          created_at?: string
        }
        Update: {
          project_id?: string
          creator_id?: string
          user_id?: string
          chat_id?: string | null
          created_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          project_id: string | null
          group_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          group_id?: string | null
          created_at?: string
        }
        Update: {}
      }
      chat_members: {
        Row: {
          chat_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          chat_id: string
          user_id: string
          joined_at?: string
        }
        Update: {}
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {}
      }
      content_posts: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          content_type: 'video' | 'audio' | 'image' | 'article'
          platform: string | null
          external_url: string | null
          thumbnail_url: string | null
          tags: string[]
          is_featured: boolean
          view_count: number
          like_count: number
          comment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          content_type: 'video' | 'audio' | 'image' | 'article'
          platform?: string | null
          external_url?: string | null
          thumbnail_url?: string | null
          tags?: string[]
          is_featured?: boolean
          view_count?: number
          like_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          content_type?: 'video' | 'audio' | 'image' | 'article'
          platform?: string | null
          external_url?: string | null
          thumbnail_url?: string | null
          tags?: string[]
          is_featured?: boolean
          view_count?: number
          like_count?: number
          comment_count?: number
          updated_at?: string
        }
      }
      content_likes: {
        Row: {
          id: string
          content_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string
          created_at?: string
        }
        Update: {}
      }
      content_views: {
        Row: {
          id: string
          content_id: string
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          content_id: string
          user_id?: string | null
          created_at?: string
        }
        Update: {}
      }
      comments: {
        Row: {
          id: string
          content_id: string
          user_id: string
          parent_id: string | null
          content: string
          mentioned_users: string[]
          like_count: number
          reply_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content_id: string
          user_id: string
          parent_id?: string | null
          content: string
          mentioned_users?: string[]
          like_count?: number
          reply_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          mentioned_users?: string[]
          updated_at?: string
        }
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {}
      }
      comment_mentions: {
        Row: {
          id: string
          comment_id: string
          mentioned_user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          mentioned_user_id: string
          created_at?: string
        }
        Update: {}
      }
      user_likes: {
        Row: {
          id: string
          liker_id: string
          liked_id: string
          created_at: string
        }
        Insert: {
          id?: string
          liker_id: string
          liked_id: string
          created_at?: string
        }
        Update: {}
      }
      user_matches: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          chat_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          chat_id?: string | null
          created_at?: string
        }
        Update: {
          chat_id?: string | null
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          bio: string
          avatar_url: string | null
          cover_url: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          bio: string
          avatar_url?: string | null
          cover_url?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          bio?: string
          avatar_url?: string | null
          cover_url?: string | null
          is_verified?: boolean
        }
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          role: string
          is_admin: boolean
        }
        Insert: {
          group_id: string
          user_id: string
          role: string
          is_admin?: boolean
        }
        Update: {
          role?: string
          is_admin?: boolean
        }
      }
    }
    Views: {
      public_profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          roles: string[]
          skills: string[]
          tagline: string | null
          vibe_words: string[]
          avatar_url: string | null
          cover_url: string | null
        }
      }
      projects_with_profiles: {
        Row: {
          id: string
          creator_id: string
          creator_type: 'profile' | 'group'
          title: string
          description: string
          roles_needed: string[]
          collab_type: 'Paid' | 'Unpaid' | 'Revenue Split'
          tags: string[]
          location: string | null
          is_remote: boolean
          nsfw: boolean
          cover_url: string | null
          created_at: string
          creator_name: string
          creator_avatar: string | null
          creator_roles: string[]
        }
      }
      content_with_creators: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          content_type: 'video' | 'audio' | 'image' | 'article'
          platform: string | null
          external_url: string | null
          thumbnail_url: string | null
          tags: string[]
          is_featured: boolean
          view_count: number
          like_count: number
          created_at: string
          updated_at: string
          creator_username: string
          creator_name: string
          creator_avatar: string | null
          creator_roles: string[]
          creator_verified: boolean
        }
      }
    }
  }
}