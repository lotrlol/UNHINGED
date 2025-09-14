import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Paperclip, Image, Video } from 'lucide-react'
import { Button } from './ui/Button'
import { useChat } from '../hooks/useChat'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { ChatGlassCard, ChatBubbleGlassCard } from './ui/GlassCard'

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  chatId: string | null
}

export function ChatModal({ isOpen, onClose, chatId }: ChatModalProps) {
  const { user } = useAuth()
  const { messages, chat, loading, error, sending, sendMessage } = useChat(chatId)
  const [newMessage, setNewMessage] = useState('')
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    const messageToSend = newMessage.trim()
    setNewMessage('')

    console.log('Sending message:', messageToSend)
    const { error } = await sendMessage(messageToSend)
    if (error) {
      console.error('Failed to send message:', error)
      // Restore message if sending failed
      setNewMessage(messageToSend)
      alert('Failed to send message: ' + error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as any)
    }
  }

  const handleMediaUpload = async (file: File) => {
    if (!user || !chatId) return

    try {
      setUploadingMedia(true)
      setShowMediaMenu(false)

      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        alert('File size must be less than 50MB')
        return
      }

      // Validate file type
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (!isImage && !isVideo) {
        alert('Please select an image or video file')
        return
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${chatId}/${user.id}/${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file)

      if (error) {
        console.error('Upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(data.path)

      // Send message with media
      const mediaType = isImage ? 'image' : 'video'
      const mediaMessage = `[${mediaType}]${publicUrl}`
      
      await sendMessage(mediaMessage)

    } catch (err) {
      console.error('Error uploading media:', err)
      alert('Failed to upload media: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setUploadingMedia(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleMediaUpload(file)
    }
    // Reset input
    e.target.value = ''
  }

  const renderMessageContent = (content: string) => {
    // Check if message contains media
    const imageMatch = content.match(/^\[image\](.+)$/)
    const videoMatch = content.match(/^\[video\](.+)$/)
    
    if (imageMatch) {
      const imageUrl = imageMatch[1]
      return (
        <div className="max-w-xs">
          <img
            src={imageUrl}
            alt="Shared image"
            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(imageUrl, '_blank')}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-lg">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span>Image failed to load</span>
                  </div>
                `
              }
            }}
          />
        </div>
      )
    }
    
    if (videoMatch) {
      const videoUrl = videoMatch[1]
      return (
        <div className="max-w-xs">
          <video
            src={videoUrl}
            controls
            className="rounded-lg max-w-full h-auto"
            onError={(e) => {
              const target = e.target as HTMLVideoElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `
                  <div class="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded-lg">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <span>Video failed to load</span>
                  </div>
                `
              }
            }}
          />
        </div>
      )
    }
    
    // Regular text message
    return <p className="text-sm whitespace-pre-wrap">{content}</p>
  }

  // Get the chat title from the chat object
  const chatTitle = chat?.project?.title || 'Chat';

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !chatId) return;
    
    const messageToSend = newMessage.trim();
    setNewMessage('');
    
    try {
      await sendMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      setNewMessage(messageToSend);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col p-0 w-full h-full">
      {/* Full-width overlay */}
      {/* Overlay removed to show through to content */}

      {/* Full-width container with glass effect */}
      <div className="relative w-full h-full">
        <div 
          className="absolute inset-0 -z-10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
        <ChatGlassCard 
          className="w-full h-full flex flex-col bg-gradient-to-br from-gray-900/70 to-gray-800/70 backdrop-blur-xl"
          onClose={onClose}
          title={chatTitle}
          borderRadius={0}
        >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 w-full">
          <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 lg:py-20">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-medium text-gray-900 mb-2 text-lg lg:text-xl">Start the conversation!</h3>
              <p className="text-gray-600 text-sm lg:text-base max-w-md mx-auto">
                Say hello and discuss your collaboration ideas.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.sender_id === user?.id
              
              return (
                <div key={message.id} className="w-full">
                  <ChatBubbleGlassCard 
                    isCurrentUser={isMyMessage}
                    timestamp={formatDate(message.created_at)}
                    className={isMyMessage ? 'ml-auto' : 'mr-auto'}
                  >
                    <div className="flex items-center gap-2">
                      {!isMyMessage && message.sender.avatar_url && (
                        <img
                          src={message.sender.avatar_url}
                          alt={message.sender.full_name}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      {!isMyMessage && message.sender.full_name && (
                        <span className="font-medium text-sm">
                          {message.sender.full_name}
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      {renderMessageContent(message.content)}
                    </div>
                  </ChatBubbleGlassCard>
                </div>
              )
            })
          )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="relative z-10 p-4 sm:p-6 border-t border-white/10 mt-auto max-w-4xl mx-auto w-full">
          {!chatId && (
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs text-center">No chat ID provided</p>
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3 w-full">
              {/* Media Upload Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMediaMenu(!showMediaMenu)}
                  disabled={uploadingMedia || !chatId}
                  className="p-2 lg:p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {uploadingMedia ? (
                    <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
                  ) : (
                    <Paperclip className="w-5 h-5 lg:w-6 lg:h-6" />
                  )}
                </button>
                
                {/* Media Menu */}
                {showMediaMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMediaMenu(false)}
                    />
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 lg:p-3 z-50">
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click()
                          setShowMediaMenu(false)
                        }}
                        className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Image className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
                        <span className="text-sm lg:text-base">Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          fileInputRef.current?.click()
                          setShowMediaMenu(false)
                        }}
                        className="flex items-center gap-2 w-full p-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Video className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                        <span className="text-sm lg:text-base">Video</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                disabled={sending || !chatId}
                maxLength={1000}
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={(!newMessage.trim() && !uploadingMedia) || sending || !chatId || uploadingMedia}
                className="flex items-center gap-2"
              >
                {sending || uploadingMedia ? (
                  <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 lg:w-5 lg:h-5" />
                )}
              </Button>
            </div>
          </form>
          <p className="text-xs lg:text-sm text-gray-500 mt-2 lg:mt-3">
            {uploadingMedia ? 'Uploading media...' : `${newMessage.length}/1000 characters`}
          </p>
        </div>
      </ChatGlassCard>
      </div>
    </div>
  )
}