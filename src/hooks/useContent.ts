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
      console.log('useContent - Query creator_id:', query?.creator_id);
      
      // First, get the basic content posts with the creator filter if provided
      let queryBuilder = supabase
        .from('content_posts')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply creator filter if provided
      if (query?.creator_id) {
        console.log('Filtering content by creator_id:', query.creator_id);
        queryBuilder = queryBuilder.eq('creator_id', query.creator_id);
      } else {
        console.log('No creator_id filter applied - showing all content');
      }

      // Execute the initial query
      const { data: contentData, error: contentError } = await queryBuilder;

      if (contentError) throw contentError;
      if (!contentData || contentData.length === 0) {
        console.log('No content found for the given query');
        setContent([]);
        return;
      }

      // Type assertion to fix TypeScript issues
      const data = contentData as any[];
      
      console.log('useContent - Raw content data from database (before any filtering):', data.map((item: any) => ({
        id: item.id,
        title: item.title,
        creator_id: item.creator_id,
        content_type: item.content_type
      })));

      // If a creator_id filter was applied, log the expected vs actual results
      if (query?.creator_id) {
        const filteredCount = data.filter((item: any) => item.creator_id === query.creator_id).length;
        console.log(`useContent - Expected to filter for creator_id: ${query.creator_id}`);
        console.log(`useContent - Actual content items matching filter: ${filteredCount}/${data.length}`);
        if (filteredCount === 0) {
          console.log('useContent - WARNING: No content matches the creator_id filter!');
        }
      }

      // Get all unique creator IDs to fetch their profile data
      const creatorIds = [...new Set(data.map((item: any) => item.creator_id))] as string[];
      
      // Fetch profiles for all creators in one go
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, roles, is_verified')
        .in('id', creatorIds);

      if (profilesError) throw profilesError;

      // Create a map of profile ID to profile data
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Process the content with the fetched profiles
      const processedContent = contentData.map(item => {

      // Process the content with the fetched profiles
        // Process media_urls into the MediaContent format
        const media: MediaContent[] = Array.isArray(item.media_urls) 
          ? item.media_urls.map((url: string) => ({
              type: item.content_type as 'image' | 'video' | 'audio',
              url,
              thumbnail: item.thumbnail_url || null
            }))
          : [];

        const profile = profilesMap.get(item.creator_id);
        const creator: User = {
          id: item.creator_id,
          username: profile?.username || 'unknown',
          name: profile?.full_name || 'Unknown User',
          avatar: profile?.avatar_url || null,
          roles: Array.isArray(profile?.roles) ? profile.roles : [],
          verified: Boolean(profile?.is_verified)
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

  const createContent = async (contentData: {
    title: string;
    description?: string;
    content_type: ContentType;
    platform?: string;
    external_url?: string;
    thumbnail_url?: string;
    tags: string[];
  }) => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error(authError?.message || 'User not authenticated');

      console.log('createContent - Creating content with data:', contentData);

      const { data, error } = await supabase
        .from('content_posts')
        .insert([
          {
            creator_id: user.id,
            title: contentData.title,
            description: contentData.description || null,
            content_type: contentData.content_type,
            platform: contentData.platform || null,
            external_url: contentData.external_url || null,
            thumbnail_url: contentData.thumbnail_url || null,
            tags: contentData.tags,
            is_featured: false,
            view_count: 0,
            like_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ] as any)
        .select()
        .single();

      if (error) {
        console.error('createContent - Database error:', error);
        throw new Error(error.message || 'Failed to create content');
      }

      console.log('createContent - Successfully created content:', data);
      return { data, error: null };
    } catch (error) {
      console.error('createContent - Error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create content'
      };
    }
  };

  return { 
    content, 
    loading, 
    error, 
    refetch: fetchContent,
    likeContent,
    createContent 
  };
}
