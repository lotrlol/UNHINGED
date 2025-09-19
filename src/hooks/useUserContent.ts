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
    if (!userId) {
      setContent([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_user_content_with_stats', { user_id: userId })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Process media URLs
      const processedContent = await Promise.all(
        (data || []).map(async (item: any) => {
          // If we have a thumbnail_url, use it as the main media
          if (item.thumbnail_url) {
            return {
              ...item,
              media_urls: [item.thumbnail_url],
              media_type: item.content_type
            };
          }

          // Otherwise, try to get the first media URL from media_urls
          if (item.media_urls?.length > 0) {
            return {
              ...item,
              media_urls: item.media_urls,
              media_type: item.content_type
            };
          }

          return item;
        })
      );

      setContent(processedContent);
    } catch (err) {
      console.error('Error fetching user content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const likeContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content_likes')
        .insert([{ content_id: contentId, user_id: (await supabase.auth.getUser()).data.user?.id }]);

      if (error) throw error;
      
      // Optimistically update the UI
      setContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { ...item, like_count: (item.like_count || 0) + 1 } 
            : item
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error liking content:', err);
      return { error: err instanceof Error ? err.message : 'Failed to like content' };
    }
  };

  const unlikeContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('content_likes')
        .delete()
        .eq('content_id', contentId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      
      // Optimistically update the UI
      setContent(prev => 
        prev.map(item => 
          item.id === contentId 
            ? { ...item, like_count: Math.max(0, (item.like_count || 1) - 1) } 
            : item
        )
      );
      
      return { success: true };
    } catch (err) {
      console.error('Error unliking content:', err);
      return { error: err instanceof Error ? err.message : 'Failed to unlike content' };
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
