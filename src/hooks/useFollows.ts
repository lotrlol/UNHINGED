import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface UserFollow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
  follower?: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  }
  following?: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  }
}

export interface FollowStats {
  followers_count: number
  following_count: number
  is_following: boolean
  is_followed_by: boolean
}

export function useFollows(targetUserId?: string) {
  const { user } = useAuth()
  const [followers, setFollowers] = useState<UserFollow[]>([])
  const [following, setFollowing] = useState<UserFollow[]>([])
  const [stats, setStats] = useState<FollowStats>({
    followers_count: 0,
    following_count: 0,
    is_following: false,
    is_followed_by: false
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchFollowData = useCallback(async () => {
    const userId = targetUserId || user?.id
    if (!userId) {
      setFollowers([])
      setFollowing([])
      setStats({
        followers_count: 0,
        following_count: 0,
        is_following: false,
        is_followed_by: false
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch followers
      const { data: followersData, error: followersError } = await supabase
        .from('user_follows')
        .select(`
          *,
          follower:profiles!user_follows_follower_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })

      if (followersError) throw followersError

      // Fetch following
      const { data: followingData, error: followingError } = await supabase
        .from('user_follows')
        .select(`
          *,
          following:profiles!user_follows_following_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      if (followingError) throw followingError

      setFollowers(followersData || [])
      setFollowing(followingData || [])

      // Calculate stats
      const followersCount = followersData?.length || 0
      const followingCount = followingData?.length || 0
      
      let isFollowing = false
      let isFollowedBy = false

      if (user && targetUserId && user.id !== targetUserId) {
        // Check if current user is following the target user
        const { data: followingCheck } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .maybeSingle()

        isFollowing = !!followingCheck

        // Check if target user is following current user
        const { data: followerCheck } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', targetUserId)
          .eq('following_id', user.id)
          .maybeSingle()

        isFollowedBy = !!followerCheck
      }

      setStats({
        followers_count: followersCount,
        following_count: followingCount,
        is_following: isFollowing,
        is_followed_by: isFollowedBy
      })

    } catch (err) {
      console.error('Error fetching follow data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch follow data')
    } finally {
      setLoading(false)
    }
  }, [user, targetUserId])

  const followUser = useCallback(async (userIdToFollow: string) => {
    if (!user) return { error: 'Must be logged in to follow users' }
    if (user.id === userIdToFollow) return { error: 'Cannot follow yourself' }

    try {
      setActionLoading(true)
      setError(null)

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userIdToFollow)
        .maybeSingle()

      if (existingFollow) {
        return { error: 'Already following this user' }
      }

      // Create follow relationship
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: userIdToFollow
        })

      if (error) throw error

      // Refresh data
      await fetchFollowData()

      return { error: null }
    } catch (err) {
      console.error('Error following user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to follow user'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setActionLoading(false)
    }
  }, [user, fetchFollowData])

  const unfollowUser = useCallback(async (userIdToUnfollow: string) => {
    if (!user) return { error: 'Must be logged in to unfollow users' }

    try {
      setActionLoading(true)
      setError(null)

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userIdToUnfollow)

      if (error) throw error

      // Refresh data
      await fetchFollowData()

      return { error: null }
    } catch (err) {
      console.error('Error unfollowing user:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to unfollow user'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setActionLoading(false)
    }
  }, [user, fetchFollowData])

  const toggleFollow = useCallback(async (userIdToToggle: string) => {
    if (stats.is_following) {
      return await unfollowUser(userIdToToggle)
    } else {
      return await followUser(userIdToToggle)
    }
  }, [stats.is_following, followUser, unfollowUser])

  // Set up real-time subscription for follow changes
  useEffect(() => {
    const userId = targetUserId || user?.id
    if (!userId) return

    const subscription = supabase
      .channel('user_follows')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_follows',
          filter: `or(follower_id.eq.${userId},following_id.eq.${userId})`
        },
        () => {
          fetchFollowData()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, targetUserId, fetchFollowData])

  useEffect(() => {
    fetchFollowData()
  }, [fetchFollowData])

  return {
    followers,
    following,
    stats,
    loading,
    error,
    actionLoading,
    followUser,
    unfollowUser,
    toggleFollow,
    refetch: fetchFollowData
  }
}