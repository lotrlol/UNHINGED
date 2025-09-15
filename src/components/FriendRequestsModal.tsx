import React, { useState } from 'react'
import { X, Check, MessageCircle, Clock, User, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthGlassCard } from './ui/GlassCard'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { useFriendRequests } from '../hooks/useFriendRequests'
import { formatDate, getInitials } from '../lib/utils'

interface FriendRequestsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FriendRequestsModal({ isOpen, onClose }: FriendRequestsModalProps) {
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received')
  const { 
    sentRequests, 
    receivedRequests, 
    loading, 
    error, 
    respondToFriendRequest, 
    cancelFriendRequest 
  } = useFriendRequests()

  const handleAccept = async (requestId: string) => {
    const { error } = await respondToFriendRequest(requestId, 'accepted')
    if (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleReject = async (requestId: string) => {
    const { error } = await respondToFriendRequest(requestId, 'rejected')
    if (error) {
      console.error('Error rejecting friend request:', error)
    }
  }

  const handleCancel = async (requestId: string) => {
    const { error } = await cancelFriendRequest(requestId)
    if (error) {
      console.error('Error canceling friend request:', error)
    }
  }

  const pendingReceived = receivedRequests.filter(req => req.status === 'pending')
  const pendingSent = sentRequests.filter(req => req.status === 'pending')

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <AuthGlassCard 
            title="Friend Requests"
            onClose={onClose}
            className="relative overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-6">
              <button
                onClick={() => setActiveTab('received')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === 'received' 
                    ? 'text-white border-b-2 border-purple-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Heart className="w-4 h-4" />
                Received ({pendingReceived.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                  activeTab === 'sent' 
                    ? 'text-white border-b-2 border-purple-500' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4" />
                Sent ({pendingSent.length})
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm mb-4">
                {error}
              </div>
            )}

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : activeTab === 'received' ? (
                pendingReceived.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💌</div>
                    <h3 className="text-lg font-semibold text-white mb-2">No pending requests</h3>
                    <p className="text-gray-300">You'll see friend requests from other creators here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReceived.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                          {request.sender.avatar_url ? (
                            <img
                              src={request.sender.avatar_url}
                              alt={request.sender.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold">
                              {getInitials(request.sender.full_name)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{request.sender.full_name}</h4>
                            {request.sender.is_verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-2">@{request.sender.username}</p>
                          
                          {request.message && (
                            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-3">
                              <p className="text-purple-200 text-sm italic">"{request.message}"</p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleAccept(request.id)}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-2 px-3 rounded-lg text-sm"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              onClick={() => handleReject(request.id)}
                              disabled={loading}
                              className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-2 px-3 rounded-lg text-sm"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Sent Requests Tab */
                pendingSent.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📤</div>
                    <h3 className="text-lg font-semibold text-white mb-2">No pending requests</h3>
                    <p className="text-gray-300">Friend requests you send will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingSent.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-start gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
                          {request.receiver.avatar_url ? (
                            <img
                              src={request.receiver.avatar_url}
                              alt={request.receiver.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold">
                              {getInitials(request.receiver.full_name)}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">{request.receiver.full_name}</h4>
                            {request.receiver.is_verified && (
                              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-2">@{request.receiver.username}</p>
                          
                          {request.message && (
                            <div className="p-3 bg-gray-500/10 border border-gray-500/20 rounded-lg mb-3">
                              <p className="text-gray-200 text-sm italic">"{request.message}"</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>Sent {formatDate(request.created_at)}</span>
                            </div>
                            
                            <Button
                              onClick={() => handleCancel(request.id)}
                              disabled={loading}
                              variant="ghost"
                              className="text-gray-400 hover:text-red-300 bg-transparent hover:bg-red-900/30 px-3 py-1 rounded-lg text-sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </AuthGlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}