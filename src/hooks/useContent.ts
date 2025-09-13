import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface ContentPost {
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
  user_has_liked?: boolean
}

export interface ContentFilters {
  content_type?: 'video' | 'audio' | 'image' | 'article'
  tags?: string[]
  search?: string
  creator_id?: string
  is_featured?: boolean
}

export function useContent(filters: ContentFilters = {}) {
  const { user } = useAuth()
  const [content, setContent] = useState<ContentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('content_with_creators')
        .select('*')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.content_type) {
        query = query.eq('content_type', filters.content_type)
      }

      if (filters.creator_id) {
        query = query.eq('creator_id', filters.creator_id)
      }

      if (filters.is_featured) {
        query = query.eq('is_featured', true)
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags)
      }

      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // If user is authenticated, check which content they've liked
      let contentWithLikes = data || []
      if (user && data && data.length > 0) {
        const contentIds = data.map(c => c.id)
        const { data: likes } = await supabase
          .from('content_likes')
          .select('content_id')
          .eq('user_id', user.id)
          .in('content_id', contentIds)

        const likedContentIds = new Set(likes?.map(l => l.content_id) || [])
        
        contentWithLikes = data.map(content => ({
          ...content,
          user_has_liked: likedContentIds.has(content.id)
        }))
      }

      setContent(contentWithLikes)
    } catch (err) {
      console.error('Error fetching content:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch content')
    } finally {
      setLoading(false)
    }
  }, [filters, user])

  const likeContent = async (contentId: string) => {
    if (!user) return { error: 'Must be logged in to like content' }

    try {
      const { error } = await supabase
        .from('content_likes')
        .insert({ content_id: contentId, user_id: user.id })

      if (error) throw error

      // Update local state
      setContent(prev => prev.map(c => 
        c.id === contentId 
          ? { ...c, like_count: c.like_count + 1, user_has_liked: true }
          : c
      ))

      return { error: null }
    } catch (err) {
      console.error('Error liking content:', err)
      return { error: err instanceof Error ? err.message : 'Failed to like content' }
    }
  }

  const unlikeContent = async (contentId: string) => {
    if (!user) return { error: 'Must be logged in to unlike content' }

    try {
      const { error } = await supabase
        .from('content_likes')
        .delete()
        .eq('content_id', contentId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setContent(prev => prev.map(c => 
        c.id === contentId 
          ? { ...c, like_count: c.like_count - 1, user_has_liked: false }
          : c
      ))

      return { error: null }
    } catch (err) {
      console.error('Error unliking content:', err)
      return { error: err instanceof Error ? err.message : 'Failed to unlike content' }
    }
  }

  const recordView = async (contentId: string) => {
    try {
      await supabase
        .from('content_views')
        .insert({ 
          content_id: contentId, 
          user_id: user?.id || null 
        })
    } catch (err) {
      // Silently fail for view tracking
      console.warn('Failed to record view:', err)
    }
  }

  const createContent = async (contentData: {
    title: string
    description?: string
    content_type: 'video' | 'audio' | 'image' | 'article'
    platform?: string
    external_url?: string
    thumbnail_url?: string
    tags?: string[]
  }) => {
    if (!user) return { data: null, error: 'Must be logged in to create content' }

    try {
      const { data, error } = await supabase
        .from('content_posts')
        .insert({
          ...contentData,
          creator_id: user.id,
          tags: contentData.tags || []
        })
        .select()
        .single()

      if (error) throw error

      // Refresh content list
      fetchContent()

      return { data, error: null }
    } catch (err) {
      console.error('Error creating content:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create content' }
    }
  }

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  return {
    content,
    loading,
    error,
    refetch: fetchContent,
    likeContent,
    unlikeContent,
    recordView,
    createContent
  }
}