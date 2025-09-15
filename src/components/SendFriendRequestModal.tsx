import React, { useState } from 'react'
import { X, Send, Heart, MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthGlassCard } from './ui/GlassCard'
import { Button } from './ui/Button'
import { useFriendRequests } from '../hooks/useFriendRequests'
import { getInitials } from '../lib/utils'

interface SendFriendRequestModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    username: string
    full_name: string
    avatar_url: string | null
    roles: string[]
    is_verified: boolean
  } | null
  onSuccess?: () => void
}

export function SendFriendRequestModal({ 
  isOpen, 
  onClose, 
  user, 
  onSuccess 
}: SendFriendRequestModalProps) {
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const { sendFriendRequest, sending } = useFriendRequests()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || sending) return

    setError('')
    setSuccess('')

    const { error: requestError } = await sendFriendRequest(user.id, message.trim() || undefined)
    
    if (requestError) {
      setError(requestError)
    } else {
      setSuccess('Friend request sent! 🎉')
      setMessage('')
      setTimeout(() => {
        onSuccess?.()
        onClose()
        setSuccess('')
      }, 1500)
    }
  }

  const handleClose = () => {
    setMessage('')
    setError('')
    setSuccess('')
    onClose()
  }

  if (!isOpen || !user) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <AuthGlassCard 
            title="Send Friend Request"
            onClose={handleClose}
            className="relative overflow-visible"
          >
            {/* User Preview */}
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold">
                    {getInitials(user.full_name)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{user.full_name}</h3>
                  {user.is_verified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-300 text-sm">@{user.username}</p>
                {user.roles.length > 0 && (
                  <p className="text-purple-300 text-xs mt-1">
                    {user.roles.slice(0, 2).join(', ')}
                    {user.roles.length > 2 && ` +${user.roles.length - 2}`}
                  </p>
                )}
              </div>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  <MessageCircle className="w-4 h-4 inline mr-2" />
                  Add a message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                  placeholder="Hi! I'd love to connect and explore potential collaborations..."
                  maxLength={500}
                  disabled={sending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {message.length}/500 characters
                </p>
              </div>

              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={sending}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending request...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4" />
                      Send Friend Request
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10">
              <p className="text-center text-xs text-gray-400">
                They'll be able to see your message and decide whether to connect with you.
              </p>
            </div>
          </AuthGlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}