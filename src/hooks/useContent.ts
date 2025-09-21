import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Types to match ContentTab.clean.tsx
type ContentType = 'image' | 'video' | 'audio' | 'article';

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  roles: string[];
  verified: boolean;
}

interface MediaContent {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  aspectRatio?: number;
}

export interface ContentPost {
  id: string;
  creator: User;
  title: string;
  description: string | null;
  content_type: ContentType;
  media: MediaContent[];
  platform: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
  user_has_liked?: boolean;
}

interface ContentQuery {
  creator_id?: string;
  // Add other query parameters as needed
}

// Helper function to get public URL with cache busting
const getPublicUrl = (path: string | null | undefined, bucket: string) => {
  if (!path) return null;
  
  // If it's already a full URL, return it as-is
  if (path.startsWith('http')) {
    return path;
  }
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  // Add a cache-busting timestamp
  return `${data.publicUrl}?t=${new Date().getTime()}`;
};

export function useContent(query?: ContentQuery) {
  const [content, setContent] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('useContent - Fetching content with query:', query);
      
      // Use the query builder's object syntax for better column alias handling
      let queryBuilder = supabase
        .from('content_posts')
        .select(`
          *,
          profiles:profiles!inner(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (query?.creator_id) {
        queryBuilder = queryBuilder.eq('creator_id', query.creator_id);
      }

      const { data, error } = await queryBuilder;

      console.log('useContent - Raw data from query:', data);
      console.log('useContent - Query error:', error);

      if (error) throw error;
      if (!data) {
        console.log('useContent - No data returned from query');
        setContent([]);
        return;
      }

      // Transform the data to match the ContentPost interface
      const processedContent: ContentPost[] = (data || []).map((item: any) => {
        // Process media_urls into the MediaContent format
        const media: MediaContent[] = Array.isArray(item.media_urls) 
          ? item.media_urls.map((url: string) => ({
              type: item.content_type as 'image' | 'video' | 'audio',
              url,
              thumbnail: item.thumbnail_url || null
            }))
          : [];

        const creator: User = {
          id: item.creator_id,
          username: item.profiles?.username || 'unknown',
          name: item.profiles?.full_name || 'Unknown User',
          avatar: item.profiles?.avatar_url || null,
          roles: Array.isArray(item.profiles?.roles) ? item.profiles.roles : [],
          verified: Boolean(item.profiles?.is_verified)
        };

        return {
          id: item.id,
          creator,
          title: item.title || 'Untitled',
          description: item.description || null,
          content_type: item.content_type || 'article',
          media,
          platform: item.platform || null,
          external_url: item.external_url || null,
          thumbnail_url: item.thumbnail_url || null,
          tags: Array.isArray(item.tags) ? item.tags : [],
          view_count: Number(item.view_count) || 0,
          like_count: Number(item.like_count) || 0,
          comment_count: Number(item.comment_count) || 0,
          is_featured: Boolean(item.is_featured),
          is_liked: Boolean(item.is_liked),
          is_saved: Boolean(item.is_saved),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || null,
          published_at: item.published_at || null,
          user_has_liked: Boolean(item.user_has_liked)
        };
      });

      console.log('useContent - Processed content:', processedContent);
      setContent(processedContent);
    } catch (err) {
      console.error('Error in useContent:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch content'));
    } finally {
      setLoading(false);
    }
  }, [query?.creator_id]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const likeContent = async (contentId: string) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'User not authenticated');

      // Optimistic update
      setContent(prevContent => 
        prevContent.map(item => 
          item.id === contentId 
            ? { 
                ...item, 
                like_count: item.like_count + (item.user_has_liked ? -1 : 1),
                user_has_liked: !item.user_has_liked
              } 
            : item
        )
      );

      // Make the API call
      const { error } = await supabase
        .from('content_likes')
        .upsert(
          { 
            content_id: contentId, 
            user_id: user.id,
            created_at: new Date().toISOString()
          },
          { onConflict: 'content_id,user_id' }
        )
        .select();

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Error in likeContent:', error);
      // Revert optimistic update on error
      fetchContent();
      return { 
        error: error instanceof Error ? error.message : 'Failed to like content' 
      };
    }
  };

  const refetch = () => {
    return fetchContent();
  };

  return { 
    content, 
    loading, 
    error, 
    refetch,
    likeContent 
  };
}
