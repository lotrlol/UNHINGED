import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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

// Database types
interface UserLike {
  id: string
  liker_id: string
  liked_id: string
  created_at: string
}

interface UserPass {
  id: string
  user_id: string
  passed_user_id: string
  created_at: string
}

interface UserBlock {
  id: string
  blocker_id: string
  blocked_id: string
  created_at: string
}

// Profile type from the database
interface DatabaseProfile {
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
  avatar_path: string | null
  cover_url: string | null
  cover_path: string | null
  is_verified: boolean
  created_at: string
  flagged: boolean
}

// Extend the Supabase client with our table types
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        user_likes: {
          Row: UserLike
          Insert: Omit<UserLike, 'id' | 'created_at'>
          Update: Partial<Omit<UserLike, 'id' | 'created_at'>>
        }
        user_passes: {
          Row: UserPass
          Insert: Omit<UserPass, 'id' | 'created_at'>
          Update: Partial<Omit<UserPass, 'id' | 'created_at'>>
        }
        user_blocks: {
          Row: UserBlock
          Insert: Omit<UserBlock, 'id' | 'created_at'>
          Update: Partial<Omit<UserBlock, 'id' | 'created_at'>>
        }
        user_matches: {
          Row: UserMatch
          Insert: Omit<UserMatch, 'id' | 'created_at'>
          Update: Partial<Omit<UserMatch, 'id' | 'created_at'>>
        }
      }
    }
  }
}

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
  // Track if a like operation is in progress
  const [liking, setLiking] = useState(false)

  const fetchDiscoverableUsers = useCallback(async (newFilters: DiscoveryFilters = {}, includePassed = false) => {
    if (!user) {
      setUsers([])
      setAllUsers([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get users that current user hasn't liked/blocked yet
      const [
        { data: alreadyLiked },
        { data: blockedUsers },
        { data: passedUsers }
      ] = await Promise.all([
        supabase
          .from('user_likes')
          .select('liked_id')
          .eq('liker_id', user.id),
        supabase
          .from('user_blocks')
          .select('blocked_id')
          .eq('blocker_id', user.id),
        includePassed 
          ? Promise.resolve({ data: [] }) // Don't exclude passed users
          : supabase
              .from('user_passes')
              .select('passed_user_id')
              .eq('user_id', user.id)
      ]) as [
        { data: { liked_id: string }[] | null },
        { data: { blocked_id: string }[] | null },
        { data: { passed_user_id: string }[] | null }
      ]

      const likedUserIds = alreadyLiked?.map(like => like.liked_id) || []
      const blockedUserIds = blockedUsers?.map(block => block.blocked_id) || []
      const passedUserIds = includePassed ? [] : passedUsers?.map(pass => pass.passed_user_id) || []

      // Combine excluded user IDs
      const excludedIds = [...new Set([...likedUserIds, ...blockedUserIds, ...passedUserIds, user.id])]

      // Fetch discoverable users
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('flagged', false)
        .not('id', 'in', `(${excludedIds.join(',')})`)
        .limit(100) // Get more users for better filtering

      if (error) throw error

      // Process user data to format avatar and cover URLs
      const processedUsers = (data as DatabaseProfile[] || []).map(user => ({
        ...user,
        // Format avatar URL if it exists
        avatar_url: user.avatar_path 
          ? getPublicUrl(user.avatar_path, 'avatars') 
          : user.avatar_url,
        // Format cover URL if it exists
        cover_url: user.cover_path 
          ? getPublicUrl(user.cover_path, 'covers')
          : user.cover_url
      }));

      setAllUsers(processedUsers);
      
      // Apply filters and sorting
      const filteredUsers = applyFiltersAndSorting(processedUsers, newFilters)
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
    // If we're clearing all filters, include passed users
    const includePassed = Object.keys(newFilters).length === 0
    if (includePassed) {
      fetchDiscoverableUsers(newFilters, true)
    } else {
      const filteredUsers = applyFiltersAndSorting(allUsers, newFilters)
      setUsers(filteredUsers)
      setFilters(newFilters)
    }
  }, [allUsers, applyFiltersAndSorting, fetchDiscoverableUsers])

  const likeUser = useCallback(async (userId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      // Check if there's a match first
      const { data: existingLike, error: checkError } = await supabase
        .from('user_likes')
        .select('*')
        .eq('liked_id', user.id)
        .eq('liker_id', userId)
        .single()

      // If there's a match, create a match record
      if (existingLike && !checkError) {
        const { data: match, error: matchError } = await supabase
          .from('user_matches')
          .insert({
            user1_id: user.id,
            user2_id: userId,
            chat_id: null // Will be set when first message is sent
          } as never)
          .select()
          .single()

        if (matchError) throw matchError

        // Get the other user's profile for the match notification
        const { data: otherUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        return { 
          match: true, 
          matchData: { 
            ...match, 
            other_user: otherUser 
          } 
        }
      }

      // If no match, just record the like
      const { error } = await supabase
        .from('user_likes')
        .insert({
          liker_id: user.id,
          liked_id: userId
        } as never)

      if (error) throw error
      return { match: false }
    } catch (err) {
      console.error('Error liking user:', err)
      return { error: err instanceof Error ? err.message : 'Failed to like user' }
    }
  }, [user])

  const passUser = useCallback(async (userId: string) => {
    if (!user) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_passes')
        .insert({
          user_id: user.id,
          passed_user_id: userId
        } as never)

      if (error) throw error
      return { success: true }
    } catch (err) {
      console.error('Error passing user:', err)
      return { error: err instanceof Error ? err.message : 'Failed to pass user' }
    }
  }, [user])

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

  // Fetch discoverable users when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDiscoverableUsers(filters)
    }
  }, [user, fetchDiscoverableUsers])

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