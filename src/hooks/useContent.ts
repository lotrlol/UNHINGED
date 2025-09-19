import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ContentQuery {
  creator_id?: string;
  // Add other query parameters as needed
}

export function useContent(query?: ContentQuery) {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!query?.creator_id) {
        setContent([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let queryBuilder = supabase.from('content').select('*');

        if (query.creator_id) {
          queryBuilder = queryBuilder.eq('creator_id', query.creator_id);
        }

        const { data, error } = await queryBuilder;

        if (error) throw error;

        setContent(data || []);
      } catch (err) {
        console.error('Error fetching content:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [query?.creator_id]);

  return { content, loading, error };
}
