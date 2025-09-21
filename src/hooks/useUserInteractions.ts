import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface UserInteraction {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
  interaction_type: 'liked' | 'passed' | 'matched'
  interaction_date: string
  is_mutual?: boolean
}

export function useUserInteractions() {
  const { user } = useAuth()
  const [interactions, setInteractions] = useState<UserInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('🔍 useUserInteractions - user:', user?.id, 'loading:', loading, 'error:', error, 'interactions:', interactions.length)

  const fetchUserInteractions = useCallback(async () => {
    if (!user || !user.id) {
      console.log('❌ useUserInteractions - no user or user.id, returning early')
      setInteractions([])
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Fetching user interactions for user:', user.id)

      // Fetch liked users with explicit join to profiles
      const { data: likedUsers, error: likesError } = await supabase
        .from('user_likes')
        .select(`
          id,
          created_at,
          profiles!liked_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('liker_id', user.id)
        .order('created_at', { ascending: false })

      if (likesError) {
        console.error('Error fetching liked users:', likesError)
        throw likesError
      }

      // Fetch passed users with explicit join to profiles
      const { data: passedUsers, error: passesError } = await supabase
        .from('user_passes')
        .select(`
          id,
          created_at,
          profiles!passed_user_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (passesError) {
        console.error('Error fetching passed users:', passesError)
        throw passesError
      }

      // Fetch matches with explicit joins to profiles
      const { data: matches, error: matchesError } = await supabase
        .from('user_matches')
        .select(`
          id,
          created_at,
          user1_id,
          user2_id,
          user1:profiles!user1_id(
            id,
            username,
            full_name,
            avatar_url
          ),
          user2:profiles!user2_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (matchesError) {
        console.error('Error fetching matches:', matchesError)
        throw matchesError
      }

      console.log('📊 Query results:', {
        liked: likedUsers?.length || 0,
        passed: passedUsers?.length || 0,
        matches: matches?.length || 0
      })

      // Process and combine all interactions
      const processedLikes = (likedUsers || []).map(like => ({
        id: like.id,
        username: like.profiles?.username || 'Unknown',
        full_name: like.profiles?.full_name || 'Unknown User',
        avatar_url: like.profiles?.avatar_url,
        interaction_type: 'liked' as const,
        interaction_date: like.created_at
      }))

      const processedPasses = (passedUsers || []).map(pass => ({
        id: pass.id,
        username: pass.profiles?.username || 'Unknown',
        full_name: pass.profiles?.full_name || 'Unknown User',
        avatar_url: pass.profiles?.avatar_url,
        interaction_type: 'passed' as const,
        interaction_date: pass.created_at
      }))

      const processedMatches = (matches || []).map(match => {
        // Determine the other user in the match
        const otherUser = match.user1_id === user?.id ? match.user2 : match.user1
        return {
          id: match.id,
          username: otherUser?.username || 'Unknown',
          full_name: otherUser?.full_name || 'Unknown User',
          avatar_url: otherUser?.avatar_url,
          interaction_type: 'matched' as const,
          interaction_date: match.created_at,
          is_mutual: true
        }
      })

      // Sort by most recent interaction first
      const allInteractions = [...processedLikes, ...processedPasses, ...processedMatches].sort((a, b) => new Date(b.interaction_date).getTime() - new Date(a.interaction_date).getTime())

      console.log('✅ Setting interactions:', allInteractions.length)
      setInteractions(allInteractions)
    } catch (err) {
      console.error('❌ Error fetching user interactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch interactions')
      setInteractions([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Use a ref to track if we're already fetching to prevent duplicate fetches
  const isFetching = useRef(false);

  // Fetch interactions when component mounts or user changes
  useEffect(() => {
    if (!user?.id) return;
    
    console.log('🚀 Setting up real-time subscriptions for user:', user.id);
    
    // Initial fetch
    const fetchInitialData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      try {
        await fetchUserInteractions();
      } finally {
        isFetching.current = false;
      }
    };
    
    fetchInitialData();
    
    // Set up a realtime subscription to listen for changes
    const channel = supabase
      .channel(`user_interactions_${user.id}`) // Unique channel per user
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'user_likes',
          filter: `liker_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Change in user_likes:', payload.eventType, 'for user:', user.id, 'Payload:', payload);
          // Debounce the refetch to prevent too many rapid updates
          if (!isFetching.current) {
            fetchUserInteractions();
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_passes',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Change in user_passes:', payload.eventType, 'for user:', user.id, 'Payload:', payload);
          if (!isFetching.current) {
            fetchUserInteractions();
          }
        }
      )
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_matches',
          filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 Change in user_matches:', payload.eventType, 'for user:', user.id, 'Payload:', payload);
          if (!isFetching.current) {
            fetchUserInteractions();
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('❌ Error subscribing to changes:', err);
          return;
        }
        console.log('✅ Subscribed to real-time updates. Status:', status);
      });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up subscriptions for user:', user.id);
      supabase.removeChannel(channel);
      isFetching.current = false; // Reset the flag when unmounting
    };
  }, [user?.id, fetchUserInteractions]);

  // Add a refetch interval to ensure we don't miss any updates
  useEffect(() => {
    if (!user?.id) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && !isFetching.current) {
        console.log('🔄 Periodic refetch of interactions');
        fetchUserInteractions();
      }
    }, 30000); // Refetch every 30 seconds when tab is active

    return () => clearInterval(intervalId);
  }, [user?.id, fetchUserInteractions]);

  const deleteLike = useCallback(async (likeId: string) => {
    if (!user?.id) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_likes')
        .delete()
        .eq('id', likeId)

      if (error) throw error

      // Update local state to remove the deleted interaction
      setInteractions(prev => prev.filter(interaction => interaction.id !== likeId))

      return { success: true }
    } catch (err) {
      console.error('Error deleting like:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete like' }
    }
  }, [user])

  const deletePass = useCallback(async (passId: string) => {
    if (!user?.id) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_passes')
        .delete()
        .eq('id', passId)

      if (error) throw error

      // Update local state to remove the deleted interaction
      setInteractions(prev => prev.filter(interaction => interaction.id !== passId))

      return { success: true }
    } catch (err) {
      console.error('Error deleting pass:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete pass' }
    }
  }, [user])

  const deleteMatch = useCallback(async (matchId: string) => {
    if (!user?.id) return { error: 'Not authenticated' }

    try {
      const { error } = await supabase
        .from('user_matches')
        .delete()
        .eq('id', matchId)

      if (error) throw error

      // Update local state to remove the deleted interaction
      setInteractions(prev => prev.filter(interaction => interaction.id !== matchId))

      return { success: true }
    } catch (err) {
      console.error('Error deleting match:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete match' }
    }
  }, [user])

  const deleteInteraction = useCallback(async (interaction: UserInteraction) => {
    switch (interaction.interaction_type) {
      case 'liked':
        return deleteLike(interaction.id)
      case 'passed':
        return deletePass(interaction.id)
      case 'matched':
        return deleteMatch(interaction.id)
      default:
        return { error: 'Unknown interaction type' }
    }
  }, [deleteLike, deletePass, deleteMatch])

  return {
    interactions,
    loading,
    error,
    refetch: fetchUserInteractions,
    deleteInteraction
  }
}
