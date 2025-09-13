import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface DiscoverableUser {
  id: string
  username: string
  full_name: string
  roles: string[]
  skills: string[]
  looking_for: string[]
  tagline: string | null
  vibe_words: string[]
  location: string | null
  is_remote: boolean
  avatar_url: string | null
  cover_url: string | null
  is_verified: boolean
  created_at: string
}

export interface DiscoveryFilters {
  search?: string
  roles?: string[]
  looking_for?: string[]
  skills?: string[]
  vibe_words?: string[]
  location?: string
  is_remote?: boolean
  is_verified?: boolean
  sort_by?: 'newest' | 'oldest' | 'verified' | 'name'
  radius?: number // in km, for future location-based filtering
}

export interface UserMatch {
  id: string
  user1_id: string
  user2_id: string
  chat_id: string | null
  created_at: string
  other_user: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  }
}

export function useUserDiscovery() {
  const { user } = useAuth()
  const [users, setUsers] = useState<DiscoverableUser[]>([])
  const [allUsers, setAllUsers] = useState<DiscoverableUser[]>([]) // Store all users for filtering
  const [filters, setFilters] = useState<DiscoveryFilters>({})
  const [matches, setMatches] = useState<UserMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [liking, setLiking] = useState(false)

  const fetchDiscoverableUsers = useCallback(async (newFilters: DiscoveryFilters = {}) => {
    if (!user) {
      setUsers([])
      setAllUsers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get users that current user hasn't liked/disliked yet
      const { data: alreadyLiked } = await supabase
        .from('user_likes')
        .select('liked_id')
        .eq('liker_id', user.id)

      const likedUserIds = alreadyLiked?.map(like => like.liked_id) || []

      // Get users that haven't been blocked
      const { data: blockedUsers } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      const blockedUserIds = blockedUsers?.map(block => block.blocked_id) || []

      // Combine excluded user IDs
      const excludedIds = [...likedUserIds, ...blockedUserIds, user.id]

      // Fetch discoverable users
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('flagged', false)
        .not('id', 'in', `(${excludedIds.join(',')})`)
        .limit(100) // Get more users for better filtering

      const { data, error } = await query

      if (error) throw error

      const fetchedUsers = data || []
      setAllUsers(fetchedUsers)
      
      // Apply filters and sorting
      const filteredUsers = applyFiltersAndSorting(fetchedUsers, newFilters)
      setUsers(filteredUsers)
      setFilters(newFilters)
    } catch (err) {
      console.error('Error fetching discoverable users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [user])

  const applyFiltersAndSorting = useCallback((userList: DiscoverableUser[], filterOptions: DiscoveryFilters) => {
    let filtered = [...userList]

    // Text search
    if (filterOptions.search) {
      const searchTerm = filterOptions.search.toLowerCase()
      filtered = filtered.filter(u => 
        u.full_name.toLowerCase().includes(searchTerm) ||
        u.username.toLowerCase().includes(searchTerm) ||
        u.tagline?.toLowerCase().includes(searchTerm) ||
        u.roles.some(role => role.toLowerCase().includes(searchTerm)) ||
        u.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
        u.vibe_words.some(word => word.toLowerCase().includes(searchTerm))
      )
    }

    // Role filters
    if (filterOptions.roles && filterOptions.roles.length > 0) {
      filtered = filtered.filter(u => 
        filterOptions.roles!.some(role => u.roles.includes(role))
      )
    }

    // Looking for filters
    if (filterOptions.looking_for && filterOptions.looking_for.length > 0) {
      filtered = filtered.filter(u => 
        filterOptions.looking_for!.some(role => u.looking_for.includes(role))
      )
    }

    // Skills filters
    if (filterOptions.skills && filterOptions.skills.length > 0) {
      filtered = filtered.filter(u => 
        filterOptions.skills!.some(skill => u.skills.includes(skill))
      )
    }

    // Vibe words filters
    if (filterOptions.vibe_words && filterOptions.vibe_words.length > 0) {
      filtered = filtered.filter(u => 
        filterOptions.vibe_words!.some(word => u.vibe_words.includes(word))
      )
    }

    // Location filter
    if (filterOptions.location) {
      const locationTerm = filterOptions.location.toLowerCase()
      filtered = filtered.filter(u => 
        u.location?.toLowerCase().includes(locationTerm)
      )
    }

    // Remote filter
    if (filterOptions.is_remote !== undefined) {
      filtered = filtered.filter(u => u.is_remote === filterOptions.is_remote)
    }

    // Verified filter
    if (filterOptions.is_verified !== undefined) {
      filtered = filtered.filter(u => u.is_verified === filterOptions.is_verified)
    }

    // Sorting
    switch (filterOptions.sort_by) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'verified':
        filtered.sort((a, b) => {
          if (a.is_verified && !b.is_verified) return -1
          if (!a.is_verified && b.is_verified) return 1
          return 0
        })
        break
      case 'name':
        filtered.sort((a, b) => a.full_name.localeCompare(b.full_name))
        break
      default:
        // Default: newest first
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return filtered
  }, [])

  const updateFilters = useCallback((newFilters: DiscoveryFilters) => {
    const filteredUsers = applyFiltersAndSorting(allUsers, newFilters)
    setUsers(filteredUsers)
    setFilters(newFilters)
  }, [allUsers, applyFiltersAndSorting])
  const fetchUserMatches = useCallback(async () => {
    if (!user) {
      setMatches([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_matches')
        .select(`
          *,
          user1_id:user1_id,
          user2_id:user2_id,
          user1_profile:profiles!user_matches_user1_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            roles,
            is_verified
          ),
          user2_profile:profiles!user_matches_user2_id_fkey(
            id,
            full_name,
            username,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform matches to include the "other" user
      const transformedMatches: UserMatch[] = (data || []).map(match => {
        const isUser1 = match.user1_id === user.id
        const otherProfile = isUser1 ? match.user2_profile : match.user1_profile
        
        return {
          id: match.id,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
          chat_id: match.chat_id,
          created_at: match.created_at,
          other_user: {
            id: otherProfile?.id || 'unknown',
            full_name: otherProfile?.full_name || 'Unknown User',
            username: otherProfile?.username || 'unknown',
            avatar_url: otherProfile?.avatar_url || null,
            roles: otherProfile?.roles || [],
            is_verified: otherProfile?.is_verified || false
          }
        }
      })

      setMatches(transformedMatches)
    } catch (err) {
      console.error('Error fetching user matches:', err)
    }
  }, [user])

  const likeUser = useCallback(async (likedUserId: string) => {
    if (!user || liking) return { error: 'Cannot like user' }

    try {
      setLiking(true)

      const { error } = await supabase
        .from('user_likes')
        .insert({
          liker_id: user.id,
          liked_id: likedUserId
        })

      if (error) throw error

      // Remove the liked user from the discovery list
      setUsers(prev => prev.filter(u => u.id !== likedUserId))
      setAllUsers(prev => prev.filter(u => u.id !== likedUserId))

      // Refresh matches in case a new match was created
      await fetchUserMatches()

      return { error: null }
    } catch (err) {
      console.error('Error liking user:', err)
      return { error: err instanceof Error ? err.message : 'Failed to like user' }
    } finally {
      setLiking(false)
    }
  }, [user, liking, fetchUserMatches])

  const passUser = useCallback(async (passedUserId: string) => {
    if (!user) return { error: 'Cannot pass user' }

    try {
      // For now, we'll just remove them from the list
      // Later you could implement a "passes" table to track this
      setUsers(prev => prev.filter(u => u.id !== passedUserId))
      setAllUsers(prev => prev.filter(u => u.id !== passedUserId))
      return { error: null }
    } catch (err) {
      console.error('Error passing user:', err)
      return { error: err instanceof Error ? err.message : 'Failed to pass user' }
    }
  }, [user])

  useEffect(() => {
    fetchDiscoverableUsers(filters)
    fetchUserMatches()
  }, [user])

  // Set up real-time subscription for new matches
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('user_matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_matches',
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        },
        () => {
          fetchUserMatches()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchUserMatches])

  return {
    users,
    allUsers,
    filters,
    matches,
    loading,
    error,
    liking,
    likeUser,
    passUser,
    updateFilters,
    refetch: fetchDiscoverableUsers,
    refetchMatches: fetchUserMatches
  }
}