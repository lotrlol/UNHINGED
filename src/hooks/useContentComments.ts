import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ContentComment {
  id: string;
  content_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
  like_count: number;
  user_has_liked?: boolean;
}

export function useContentComments(contentId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ContentComment[]>([]);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    if (!contentId) {
      setComments([]);
      setCommentCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: contentData, error: contentError } = await supabase
        .from('content_posts')
        .select('comment_count')
        .eq('id', contentId)
        .single();

      if (contentError) throw contentError;
      setCommentCount(contentData?.comment_count || 0);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!comments_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      // Check which comments the user has liked
      if (user && commentsData && commentsData.length > 0) {
        const commentIds = commentsData.map(comment => comment.id);
        
        const { data: likes, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', commentIds);

        if (!likesError && likes) {
          const likedIds = new Set(likes.map(like => like.comment_id));
          const commentsWithLikes = commentsData.map(comment => ({
            ...comment,
            user_has_liked: likedIds.has(comment.id)
          }));
          setComments(commentsWithLikes);
          return;
        }
      }

      setComments(commentsData || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load comments');
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [contentId, user?.id]);

  const createComment = useCallback(async (content: string) => {
    if (!user || !contentId) return { error: 'Must be logged in to comment' };

    try {
      setSubmitting(true);
      setError(null);

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content_id: contentId,
          user_id: user.id,
          content,
        } as any)
        .select(`
          *,
          user:profiles!comments_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update local state with the new comment
      setComments(prev => [data, ...prev]);
      setCommentCount(prev => prev + 1);

      return { data, error: null };
    } catch (err) {
      console.error('Error creating comment:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create comment';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setSubmitting(false);
    }
  }, [contentId, user]);

  const likeComment = useCallback(async (commentId: string) => {
    if (!user) return { error: 'Must be logged in to like comments' };

    try {
      // Check if already liked
      const { data: existingLike, error: fetchError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking like status:', fetchError);
        throw fetchError;
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;

        // Update local state
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  like_count: Math.max(0, comment.like_count - 1),
                  user_has_liked: false,
                }
              : comment
          )
        );
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });

        if (insertError) throw insertError;

        // Update local state
        setComments(prev =>
          prev.map(comment =>
            comment.id === commentId
              ? {
                  ...comment,
                  like_count: comment.like_count + 1,
                  user_has_liked: true,
                }
              : comment
          )
        );
      }

      return { error: null };
    } catch (err) {
      console.error('Error toggling comment like:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle like';
      return { error: errorMessage };
    }
  }, [user]);

  return {
    comments,
    commentCount,
    loading,
    error,
    createComment,
    likeComment,
    fetchComments,
    refresh: fetchComments,
  };
}
