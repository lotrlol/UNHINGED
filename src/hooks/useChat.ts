import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
  sender: {
    full_name: string
    username: string
    avatar_url: string | null
  }
}

export interface Chat {
  id: string
  project_id: string | null
  created_at: string
  project?: {
    title: string
  }
}

export function useChat(chatId: string | null) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const fetchMessages = useCallback(async () => {
    if (!chatId || !user) {
      setMessages([])
      setChat(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('Fetching chat and messages for chatId:', chatId)

      // Fetch chat details
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          project:projects(title)
        `)
        .eq('id', chatId)
        .single()

      if (chatError) {
        console.error('Error fetching chat:', chatError)
        throw chatError
      }
      
      console.log('Chat data:', chatData)
      setChat(chatData)

      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(
            full_name,
            username,
            avatar_url
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
        throw messagesError
      }

      console.log('Fetched messages:', messagesData)
      setMessages(messagesData || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }, [chatId, user])

  const sendMessage = useCallback(async (content: string) => {
    if (!chatId || !user || !content.trim()) {
      return { error: 'Invalid message data' }
    }

    try {
      setSending(true)
      setError(null)

      console.log('Sending message to chat:', chatId, 'content:', content)

      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: content.trim()
        })
        .select(`
          *,
          sender:profiles(
            full_name,
            username,
            avatar_url
          )
        `)
        .single()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      console.log('Message sent:', data)
      
      // Optimistically add the message to local state
      setMessages(prev => [...prev, data])
      
      return { error: null }
    } catch (err) {
      console.error('Error sending message:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setSending(false)
    }
  }, [chatId, user])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!chatId || !user) return

    console.log('Setting up real-time subscription for chat:', chatId)

    const subscription = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message received:', payload.new)
          // Only refetch if the message is from someone else
          if (payload.new.sender_id !== user.id) {
            fetchMessages()
          }
        }
      )
      .subscribe()

    console.log('Real-time subscription created for chat:', chatId)

    return () => {
      console.log('Unsubscribing from chat:', chatId)
      subscription.unsubscribe()
    }
  }, [chatId, user, fetchMessages])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  return {
    messages,
    chat,
    loading,
    error,
    sending,
    sendMessage,
    refetch: fetchMessages
  }
}