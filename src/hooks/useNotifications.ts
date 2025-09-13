import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Notification {
  id: string
  user_id: string
  type: 'application' | 'match' | 'message' | 'project_update' | 'system'
  title: string
  content: string
  data: any
  read: boolean
  created_at: string
}

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching notifications for user:', user.id)
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error)
        throw error
      }

      console.log('Fetched notifications:', data)
      
      setNotifications(data || [])
      setUnreadCount((data || []).filter(n => !n.read).length)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [user])

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return { error: 'Must be logged in' }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))

      return { error: null }
    } catch (err) {
      console.error('Error marking notification as read:', err)
      return { error: err instanceof Error ? err.message : 'Failed to mark as read' }
    }
  }, [user])

  const markAllAsRead = useCallback(async () => {
    if (!user) return { error: 'Must be logged in' }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)

      return { error: null }
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
      return { error: err instanceof Error ? err.message : 'Failed to mark all as read' }
    }
  }, [user])

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return { error: 'Must be logged in' }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

      return { error: null }
    } catch (err) {
      console.error('Error deleting notification:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete notification' }
    }
  }, [user, notifications])

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload.new)
          const newNotification = payload.new as Notification
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  }
}