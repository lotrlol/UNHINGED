// src/hooks/useContent.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Database } from '../types/database';

type Tables = Database['public']['Tables'];
type Profile = Tables['profiles']['Row'];

type ContentPostBase = {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'audio' | 'image' | 'article';
  platform: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string | null;
};

export type ContentPost = ContentPostBase & {
  creator_username: string;
  creator_name: string;
  creator_avatar: string | null;
  creator_roles: string[];
  creator_verified: boolean;
  user_has_liked?: boolean;
};

export interface ContentFilters {
  content_type?: 'video' | 'audio' | 'image' | 'article';
  tags?: string[];
  search?: string;
  creator_id?: string;
  is_featured?: boolean;
}

/**
 * Custom hook to load and interact with content posts from Supabase.
 * Accepts optional filters and returns the content feed along with helpers.
 */
export function useContent(filters?: ContentFilters) {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Destructure filters with defaults; this keeps dependencies stable.
  const {
    content_type,
    tags,
    search,
    creator_id,
    is_featured,
  } = filters || {};

  // Stable key for tags so dependency array doesn’t change if tags order changes.
  const tagsKey = tags && tags.length > 0 ? [...tags].sort().join(',') : '';

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Base query with profile join.
      let query = supabase
        .from('content_posts')
        .select(
          `
          *,
          profiles:profiles!content_posts_creator_id_fkey (
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `,
        )
        .order('created_at', { ascending: false });

      // Apply each filter if it exists.
      if (content_type) {
        query = query.eq('content_type', content_type);
      }
      if (creator_id) {
        query = query.eq('creator_id', creator_id);
      }
      if (typeof is_featured === 'boolean') {
        query = query.eq('is_featured', is_featured);
      }
      if (tags && tags.length > 0) {
        query = query.overlaps('tags', tags);
      }
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,description.ilike.%${search}%`,
        );
      }

      // Execute the query.
      const { data, error: fetchError } = await query;
      if (fetchError) {
      throw fetchError;
      }

      // Convert rows into ContentPost objects.
      const formattedData: ContentPost[] = (data || []).map((item) => {
        const post = item as ContentPostBase & { profiles: Profile | null };
        const profile = post.profiles;
        return {
          ...post,
          creator_username: profile?.username || 'unknown',
          creator_name: profile?.full_name || 'Unknown User',
          creator_avatar: profile?.avatar_url || null,
          creator_roles: profile?.roles || [],
          creator_verified: profile?.is_verified || false,
        };
      });

      // Mark posts as liked if the user has liked them.
      let contentWithLikes = formattedData;
      if (user && formattedData.length > 0) {
        const contentIds = formattedData.map((c) => c.id);
        const { data: likes, error: likesError } = await supabase
          .from('content_likes')
          .select('content_id')
          .eq('user_id', user.id)
          .in('content_id', contentIds);

        if (likesError) {
          throw likesError;
        }

        const likedIds = new Set(
          (likes || []).map(
            (l) => (l as { content_id: string }).content_id,
          ),
        );
        contentWithLikes = formattedData.map((post) => ({
          ...post,
          user_has_liked: likedIds.has(post.id),
        }));
      }

      setContent(contentWithLikes);
    } catch (err: any) {
      // Store error in state instead of logging to console.
      setError(err?.message ?? 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [content_type, creator_id, is_featured, tagsKey, search, user?.id]);

  // Run the fetch on mount and whenever the dependencies change.
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Helpers for liking/unliking, recording views, and creating content.
  const likeContent = async (contentId: string) => {
    if (!user) return { error: 'Must be logged in to like content' };
    try {
      // See if the user already liked this post.
      const { data: existingLike, error: fetchError } = await supabase
        .from('content_likes')
        .select('id')
        .eq('content_id', contentId)
        .eq('user_id', user.id)
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingLike) {
        // Unlike the post.
        const { error: deleteError } = await supabase
          .from('content_likes')
          .delete()
          .match({ content_id: contentId, user_id: user.id });
        if (deleteError) throw deleteError;
        await supabase.rpc('decrement', {
          table_name: 'content_posts',
          column_name: 'like_count',
          id: contentId,
        } as any);
      } else {
        // Like the post.
        const { error: insertError } = await supabase
          .from('content_likes')
          .insert({ content_id: contentId, user_id: user.id } as any);
        if (insertError) throw insertError;
        await supabase.rpc('increment', {
          table_name: 'content_posts',
          column_name: 'like_count',
          id: contentId,
        } as any);
      }

      // Refresh the list.
      fetchContent();
      return { error: null };
    } catch (err: any) {
      return { error: err?.message ?? 'Failed to toggle like' };
    }
  };

  const unlikeContent = async (contentId: string) => {
    if (!user) return { error: 'Must be logged in to unlike content' };
    try {
      const { error: deleteError } = await supabase
        .from('content_likes')
        .delete()
        .eq('content_id', contentId)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      // Optimistically update local state.
      setContent((prev) =>
        prev.map((c) =>
          c.id === contentId
            ? {
                ...c,
                like_count: c.like_count - 1,
                user_has_liked: false,
              }
            : c,
        ),
      );
      return { error: null };
    } catch (err: any) {
      return { error: err?.message ?? 'Failed to unlike content' };
    }
  };

  const recordView = async (contentId: string) => {
    try {
      await supabase.from('content_views').insert({
        content_id: contentId,
        user_id: user?.id || null,
      } as any);
    } catch {
      // Silently ignore view tracking errors.
    }
  };

  const createContent = async (contentData: {
    title: string;
    description?: string;
    content_type: 'video' | 'audio' | 'image' | 'article';
    platform?: string;
    external_url?: string;
    thumbnail_url?: string;
    tags?: string[];
  }) => {
    if (!user)
      return { data: null, error: 'Must be logged in to create content' };
    try {
      const { data, error: insertError } = await supabase
        .from('content_posts')
        .insert({
          ...contentData,
          creator_id: user.id,
          tags: contentData.tags || [],
          view_count: 0,
          like_count: 0,
          is_featured: false,
        } as any)
        .select()
        .single();
      if (insertError) throw insertError;

      // Refresh after insertion.
      fetchContent();
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err?.message ?? 'Failed to create content' };
    }
  };

  return {
    content,
    loading,
    error,
    refetch: fetchContent,
    likeContent,
    unlikeContent,
    recordView,
    createContent,
  };
}
