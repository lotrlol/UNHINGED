import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserContent {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'audio' | 'image' | 'article';
  media_urls: string[];
  thumbnail_url: string | null;
  external_url: string | null;
  tags: string[];
  is_featured: boolean;
  is_nsfw: boolean;
  created_at: string;
  updated_at: string;
  creator_username: string | null;
  creator_avatar: string | null;
  creator_roles: string[] | null;
  like_count: number;
  comment_count: number;
  view_count: number;
}

export function useUserContent(userId?: string) {
  const [content, setContent] = useState<UserContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useUserContent - Fetching content for userId:', userId || 'all users');

      let query = supabase
        .from('content_posts')
        .select(`
          *,
          profiles!inner(username, avatar_url, roles)
        `)
        .eq('profiles.flagged', false)
        .order('created_at', { ascending: false });

      // Only filter by user ID if provided
      if (userId) {
        query = query.eq('creator_id', userId);
      }

      const { data, error: fetchError } = await query;

      console.log('useUserContent - Raw data from query:', data);
      console.log('useUserContent - Query error:', fetchError);

      if (fetchError) throw fetchError;
      if (!data) {
        console.log('useUserContent - No data returned from query');
        setContent([]);
        return;
      }

      // Transform the data to match the expected interface
      const processedContent = data.map((item: any) => {
        const processedItem = {
          id: item.id,
          creator_id: item.creator_id,
          title: item.title,
          description: item.description,
          content_type: item.content_type,
          media_urls: Array.isArray(item.media_urls) ? item.media_urls : [],
          thumbnail_url: item.thumbnail_url,
          external_url: item.external_url,
          tags: Array.isArray(item.tags) ? item.tags : [],
          is_featured: Boolean(item.is_featured),
          is_nsfw: Boolean(item.is_nsfw),
          created_at: item.created_at,
          updated_at: item.updated_at,
          creator_username: item.profiles?.username || null,
          creator_avatar: item.profiles?.avatar_url || null,
          creator_roles: Array.isArray(item.profiles?.roles) ? item.profiles.roles : [],
          like_count: Number(item.like_count) || 0,
          comment_count: Number(item.comment_count) || 0,
          view_count: Number(item.view_count) || 0
        } as UserContent;
        
        console.log('Processed item:', processedItem);
        return processedItem;
      });

      setContent(processedContent);
    } catch (err) {
      console.error('Error fetching user content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Debug log when content changes
  useEffect(() => {
    console.log('useUserContent - Content updated:', {
      content,
      loading,
      error,
      contentCount: content.length,
      hasUserId: !!userId
    });
  }, [content, loading, error, userId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const likeContent = async (contentId: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'User not authenticated');

      // Type-safe insert
      const { error } = await supabase
        .from('content_likes')
        .insert([{ 
          content_id: contentId, 
          user_id: user.id 
        }] as never[]);

      if (error) throw error;
      
      // Optimistically update the UI with type safety
      setContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { 
                ...item, 
                like_count: (item.like_count || 0) + 1 
              } 
            : item
        )
      );
    } catch (err) {
      console.error('Error liking content:', err);
      throw err;
    }
  };

  const unlikeContent = async (contentId: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'User not authenticated');

      // Type-safe delete
      const { error } = await supabase
        .from('content_likes')
        .delete()
        .eq('content_id', contentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Optimistically update the UI with type safety
      setContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { 
                ...item, 
                like_count: Math.max(0, (item.like_count || 1) - 1) 
              } 
            : item
        )
      );
    } catch (err) {
      console.error('Error unliking content:', err);
      throw err;
    }
  };

  return {
    content,
    loading,
    error,
    refresh: fetchContent,
    likeContent,
    unlikeContent
  };
}
