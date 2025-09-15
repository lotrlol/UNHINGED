import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Comment {
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
  user: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    is_verified: boolean
  }
  user_has_liked?: boolean
  replies?: Comment[]
}

export interface CommentFilters {
  content_id: string
  parent_id?: string | null
  limit?: number
  offset?: number
}

export function useComments(contentId: string) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!contentId) {
      setComments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch top-level comments with user data
      const { data: topLevelComments, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!comments_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .eq('content_id', contentId)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      if (commentsError) throw commentsError

      // Fetch replies for each top-level comment
      const commentsWithReplies = await Promise.all(
        (topLevelComments || []).map(async (comment) => {
          const { data: replies, error: repliesError } = await supabase
            .from('comments')
            .select(`
              *,
              user:profiles!comments_user_id_fkey(
                id,
                username,
                full_name,
                avatar_url,
                is_verified
              )
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true })

          if (repliesError) {
            console.error('Error fetching replies:', repliesError)
            return { ...comment, replies: [] }
          }

          return { ...comment, replies: replies || [] }
        })
      )

      // Check which comments the user has liked
      if (user && commentsWithReplies.length > 0) {
        const allCommentIds = commentsWithReplies.flatMap(comment => [
          comment.id,
          ...(comment.replies?.map(reply => reply.id) || [])
        ])

        const { data: likes, error: likesError } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in('comment_id', allCommentIds)

        if (!likesError) {
          const likedIds = new Set((likes || []).map(like => like.comment_id))
          
          const commentsWithLikes = commentsWithReplies.map(comment => ({
            ...comment,
            user_has_liked: likedIds.has(comment.id),
            replies: comment.replies?.map(reply => ({
              ...reply,
              user_has_liked: likedIds.has(reply.id)
            }))
          }))

          setComments(commentsWithLikes)
        } else {
          setComments(commentsWithReplies)
        }
      } else {
        setComments(commentsWithReplies)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch comments')
    } finally {
      setLoading(false)
    }
  }, [contentId, user])

  const createComment = useCallback(async (
    content: string,
    parentId?: string | null,
    mentionedUsers: string[] = []
  ) => {
    if (!user || !contentId) return { error: 'Must be logged in to comment' }

    try {
      setSubmitting(true)
      setError(null)

      const { data, error } = await supabase
        .from('comments')
        .insert({
          content_id: contentId,
          user_id: user.id,
          parent_id: parentId || null,
          content: content.trim(),
          mentioned_users: mentionedUsers
        })
        .select(`
          id,
          content_id,
          user_id,
          parent_id,
          content,
          mentioned_users,
          like_count,
          reply_count,
          created_at,
          updated_at,
          user:profiles!comments_user_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .single()

      if (error) throw error

      // Refresh comments to get updated counts
      await fetchComments()

      return { data, error: null }
    } catch (err) {
      console.error('Error creating comment:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create comment'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setSubmitting(false)
    }
  }, [user, contentId, fetchComments])

  const likeComment = useCallback(async (commentId: string) => {
    if (!user) return { error: 'Must be logged in to like comments' }

    try {
      // Check if already liked
      const { data: existingLike, error: fetchError } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id
          })

        if (insertError) throw insertError
      }

      // Optimistically update local state
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            like_count: existingLike ? comment.like_count - 1 : comment.like_count + 1,
            user_has_liked: !existingLike
          }
        }
        
        // Check replies
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply.id === commentId) {
              return {
                ...reply,
                like_count: existingLike ? reply.like_count - 1 : reply.like_count + 1,
                user_has_liked: !existingLike
              }
            }
            return reply
          })
          return { ...comment, replies: updatedReplies }
        }
        
        return comment
      }))

      return { error: null }
    } catch (err) {
      console.error('Error liking comment:', err)
      return { error: err instanceof Error ? err.message : 'Failed to like comment' }
    }
  }, [user])

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return { error: 'Must be logged in to delete comments' }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      // Refresh comments
      await fetchComments()

      return { error: null }
    } catch (err) {
      console.error('Error deleting comment:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete comment' }
    }
  }, [user, fetchComments])

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) return []

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .eq('flagged', false)
        .limit(10)

      if (error) throw error

      return data || []
    } catch (err) {
      console.error('Error searching users:', err)
      return []
    }
  }, [])

  // Set up real-time subscription for new comments
  useEffect(() => {
    if (!contentId) return

    const subscription = supabase
      .channel(`comments-${contentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `content_id=eq.${contentId}`
        },
        () => {
          fetchComments()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `content_id=eq.${contentId}`
        },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [contentId, fetchComments])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  return {
    comments,
    loading,
    error,
    submitting,
    createComment,
    likeComment,
    deleteComment,
    searchUsers,
    refetch: fetchComments
  }
}