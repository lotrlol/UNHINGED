import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  responded_at: string | null
  sender: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  }
  receiver: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  }
}

export function useFriendRequests() {
  const { user } = useAuth()
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const fetchFriendRequests = useCallback(async () => {
    if (!user) {
      setSentRequests([])
      setReceivedRequests([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Fetch sent requests
      const { data: sentData, error: sentError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          receiver:profiles!friend_requests_receiver_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false })

      if (sentError) throw sentError

      // Fetch received requests
      const { data: receivedData, error: receivedError } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:profiles!friend_requests_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })

      if (receivedError) throw receivedError

      setSentRequests(sentData || [])
      setReceivedRequests(receivedData || [])
    } catch (err) {
      console.error('Error fetching friend requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch friend requests')
    } finally {
      setLoading(false)
    }
  }, [user])

  const sendFriendRequest = useCallback(async (receiverId: string, message?: string) => {
    if (!user) return { error: 'Must be logged in to send friend requests' }

    try {
      setSending(true)
      setError(null)

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('sender_id', user.id)
        .eq('receiver_id', receiverId)
        .maybeSingle()

      if (existingRequest) {
        return { 
          error: existingRequest.status === 'pending' 
            ? 'Friend request already sent' 
            : `You have already ${existingRequest.status} a request to this user`
        }
      }

      // Check if they're already matched
      const { data: existingMatch } = await supabase
        .from('user_matches')
        .select('id')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${receiverId}),and(user1_id.eq.${receiverId},user2_id.eq.${user.id})`)
        .maybeSingle()

      if (existingMatch) {
        return { error: 'You are already connected with this user' }
      }

      // Send friend request
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message: message || null,
          status: 'pending'
        })
        .select(`
          *,
          receiver:profiles!friend_requests_receiver_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .single()

      if (error) throw error

      // Update local state
      setSentRequests(prev => [data, ...prev])

      return { error: null }
    } catch (err) {
      console.error('Error sending friend request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send friend request'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setSending(false)
    }
  }, [user])

  const respondToFriendRequest = useCallback(async (
    requestId: string, 
    status: 'accepted' | 'rejected'
  ) => {
    if (!user) return { error: 'Must be logged in to respond to friend requests' }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('friend_requests')
        .update({
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('receiver_id', user.id) // Ensure user can only update their own received requests
        .select(`
          *,
          sender:profiles!friend_requests_sender_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            roles,
            is_verified
          )
        `)
        .single()

      if (error) throw error

      // Update local state
      setReceivedRequests(prev => 
        prev.map(req => req.id === requestId ? data : req)
      )

      return { error: null }
    } catch (err) {
      console.error('Error responding to friend request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to respond to friend request'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const cancelFriendRequest = useCallback(async (requestId: string) => {
    if (!user) return { error: 'Must be logged in to cancel friend requests' }

    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId)
        .eq('sender_id', user.id) // Ensure user can only cancel their own sent requests
        .eq('status', 'pending') // Can only cancel pending requests

      if (error) throw error

      // Update local state
      setSentRequests(prev => prev.filter(req => req.id !== requestId))

      return { error: null }
    } catch (err) {
      console.error('Error canceling friend request:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel friend request'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  // Set up real-time subscription for new friend requests
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('friend_requests')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          fetchFriendRequests() // Refetch to get complete data with joins
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friend_requests',
          filter: `sender_id=eq.${user.id}`
        },
        () => {
          fetchFriendRequests() // Refetch when sent requests are updated
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, fetchFriendRequests])

  useEffect(() => {
    fetchFriendRequests()
  }, [fetchFriendRequests])

  return {
    sentRequests,
    receivedRequests,
    loading,
    error,
    sending,
    sendFriendRequest,
    respondToFriendRequest,
    cancelFriendRequest,
    refetch: fetchFriendRequests
  }
}