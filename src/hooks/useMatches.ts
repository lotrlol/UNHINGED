import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Match {
  id: string
  project_id: string | null
  creator_id: string
  user_id: string
  chat_id: string | null
  created_at: string
  projects: Array<{
    id: string
    title: string
    description: string
    cover_url: string | null
  }>
  other_user: {
    id: string
    full_name: string
    username: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  }
  match_type: 'project' | 'direct' | 'both'
  latest_match_date: string
}

export function useMatches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    if (!user) {
      setMatches([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching matches for user:', user.id)

      // Fetch project-based matches
      const { data: projectMatches, error: projectError } = await supabase
        .from('matches')
        .select(`
          *,
          project:projects(
            title,
            description,
            cover_url
          ),
          creator_profile:profiles!matches_creator_id_fkey(
            full_name,
            username,
            avatar_url,
            roles
          ),
          user_profile:profiles!matches_user_id_fkey(
            full_name,
            username,
            avatar_url,
            roles
          )
        `)
        .or(`creator_id.eq.${user.id},user_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (projectError) {
        console.error('Error fetching project matches:', projectError)
        throw projectError
      }

      // Fetch user-based matches
      const { data: userMatches, error: userError } = await supabase
        .from('user_matches')
        .select(`
          id,
          user1_id:user1_id,
          user2_id:user2_id,
          chat_id,
          created_at,
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

      if (userError) {
        console.error('Error fetching user matches:', userError)
        throw userError
      }


      // Create a map to consolidate matches by user
      const userMatchMap = new Map<string, Match>()

      // Process project matches
      ;(projectMatches || []).forEach(match => {
        const isCreator = match.creator_id === user.id
        const otherUserId = isCreator ? match.user_id : match.creator_id
        const otherProfile = isCreator ? match.user_profile : match.creator_profile

        if (!otherProfile || !otherUserId) return

        const key = otherUserId
        const existingMatch = userMatchMap.get(key)

        if (existingMatch) {
          // Add this project to existing match
          if (match.project) {
            existingMatch.projects.push({
              id: match.project_id!,
              title: match.project.title,
              description: match.project.description,
              cover_url: match.project.cover_url
            })
          }
          existingMatch.match_type = 'both'
          // Use the most recent chat_id if available
          if (match.chat_id && !existingMatch.chat_id) {
            existingMatch.chat_id = match.chat_id
          }
          // Update to latest match date
          if (new Date(match.created_at) > new Date(existingMatch.latest_match_date)) {
            existingMatch.latest_match_date = match.created_at
          }
        } else {
          // Create new consolidated match
          userMatchMap.set(key, {
            id: match.id,
            project_id: match.project_id,
            creator_id: match.creator_id,
            user_id: match.user_id,
            chat_id: match.chat_id,
            created_at: match.created_at,
            projects: match.project ? [{
              id: match.project_id!,
              title: match.project.title,
              description: match.project.description,
              cover_url: match.project.cover_url
            }] : [],
            other_user: {
              id: otherUserId,
              full_name: otherProfile.full_name,
              username: otherProfile.username,
              avatar_url: otherProfile.avatar_url,
              roles: otherProfile.roles,
              is_verified: false // Project matches don't have this field
            },
            match_type: 'project',
            latest_match_date: match.created_at
          })
        }
      })

      // Process user matches
      ;(userMatches || []).forEach(match => {
        const isUser1 = match.user1_id === user.id
        const otherUserId = isUser1 ? match.user2_id : match.user1_id
        const otherProfile = isUser1 ? match.user2_profile : match.user1_profile

        if (!otherProfile || !otherUserId) return

        const key = otherUserId
        const existingMatch = userMatchMap.get(key)

        if (existingMatch) {
          // Update existing match to include direct match
          existingMatch.match_type = 'both'
          // Use the user match chat_id if project match doesn't have one
          if (match.chat_id && !existingMatch.chat_id) {
            existingMatch.chat_id = match.chat_id
          }
          // Update to latest match date
          if (new Date(match.created_at) > new Date(existingMatch.latest_match_date)) {
            existingMatch.latest_match_date = match.created_at
          }
        } else {
          // Create new direct match
          userMatchMap.set(key, {
            id: match.id,
            project_id: null,
            creator_id: match.user1_id,
            user_id: match.user2_id,
            chat_id: match.chat_id,
            created_at: match.created_at,
            projects: [],
            other_user: {
              id: otherUserId,
              full_name: otherProfile.full_name,
              username: otherProfile.username,
              avatar_url: otherProfile.avatar_url,
              roles: otherProfile.roles,
              is_verified: otherProfile.is_verified
            },
            match_type: 'direct',
            latest_match_date: match.created_at
          })
        }
      })

      // Convert map to array and sort by latest match date
      const consolidatedMatches = Array.from(userMatchMap.values())
        .sort((a, b) => new Date(b.latest_match_date).getTime() - new Date(a.latest_match_date).getTime())
      
      console.log('Consolidated matches:', consolidatedMatches?.map(m => ({ 
        id: m.id, 
        chat_id: m.chat_id, 
        type: m.match_type,
        user: m.other_user.full_name,
        projects: m.projects.length
      })))
      
      setMatches(consolidatedMatches)
    } catch (err) {
      console.error('Error fetching matches:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch matches')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  // Set up real-time subscription for new matches
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `or(creator_id.eq.${user.id},user_id.eq.${user.id})`
        },
        (payload) => {
          console.log('New match received:', payload.new)
          fetchMatches() // Refetch to get complete data with joins
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchMatches])

  return {
    matches,
    loading,
    error,
    refetch: fetchMatches
  }
}