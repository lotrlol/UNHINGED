import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X, Users, Loader2, UserCheck, RefreshCw, Trash2 } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useUserInteractions } from '../hooks/useUserInteractions'

interface UserInteractionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function UserInteractionsModal({ isOpen, onClose }: UserInteractionsModalProps) {
  const { interactions, loading, error, refetch, deleteInteraction } = useUserInteractions()
  const [lastRefreshed, setLastRefreshed] = React.useState<Date | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  console.log('🔍 UserInteractionsModal - isOpen:', isOpen, 'loading:', loading, 'error:', error, 'interactions:', interactions.length, 'interactions data:', interactions)
  
  // Debug: Check if Trash2 icon is imported correctly
  console.log('Trash2 icon:', Trash2 ? '✅ Loaded' : '❌ Not loaded')

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // Handle delete interaction
  const handleDelete = async (interaction: any) => {
    console.log('🗑️ Attempting to delete interaction:', interaction.id, interaction.interaction_type)
    setDeletingId(interaction.id)

    try {
      const result = await deleteInteraction(interaction)
      if (result.error) {
        console.error('❌ Failed to delete interaction:', result.error)
      } else {
        console.log('✅ Interaction deleted successfully')
        setLastRefreshed(new Date())
      }
    } catch (err) {
      console.error('❌ Error deleting interaction:', err)
    } finally {
      setDeletingId(null)
    }
  }

  // Handle manual refresh
  const handleRefresh = async () => {
    console.log('🔄 Manually refreshing interactions...')
    try {
      await refetch()
      setLastRefreshed(new Date())
    } catch (err) {
      console.error('Failed to refresh interactions:', err)
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'liked':
        return <Heart className="w-4 h-4 text-pink-500" />
      case 'passed':
        return <X className="w-4 h-4 text-red-500" />
      case 'matched':
        return <UserCheck className="w-4 h-4 text-green-500" />
      default:
        return <Users className="w-4 h-4 text-gray-500" />
    }
  }

  const getInteractionBadge = (type: string) => {
    switch (type) {
      case 'liked':
        return <Badge className="bg-pink-600/90 text-white">Liked</Badge>
      case 'passed':
        return <Badge className="bg-red-600/90 text-white">Passed</Badge>
      case 'matched':
        return <Badge className="bg-green-600/90 text-white">Matched</Badge>
      default:
        return <Badge className="bg-gray-600/90 text-white">Unknown</Badge>
    }
  }

  if (!isOpen) {
    console.log('🚫 UserInteractionsModal - isOpen is false, returning null')
    return null
  }

  console.log('✅ UserInteractionsModal - isOpen is true, rendering modal')
  
  // Handle error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Error</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-red-400 mb-6">
            Failed to load interactions. {error}
          </div>
          <Button
            onClick={refetch}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-gray-900/95 to-gray-900/90 backdrop-blur-xl border-l border-white/10 z-[60] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Discovery History</h3>
              {lastRefreshed && (
                <p className="text-xs text-gray-400 mt-1">
                  Last updated: {formatDate(lastRefreshed.toISOString())}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className={`p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
              <p className="text-gray-400 text-sm">Loading your interactions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">Error loading interactions</div>
              <p className="text-gray-300 text-sm">{error}</p>
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h4 className="text-lg font-semibold text-white mb-2">No interactions yet</h4>
              <p className="text-gray-300 text-sm">
                Start swiping to see your discovery history here!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {interactions.map((interaction) => (
                <motion.div
                  key={`${interaction.id}-${interaction.interaction_type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/60 to-pink-600/60 flex items-center justify-center text-white font-semibold text-lg overflow-hidden">
                    {interaction.avatar_url ? (
                      <img
                        src={interaction.avatar_url}
                        alt={interaction.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      interaction.full_name.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-medium truncate">
                        {interaction.full_name}
                      </h4>
                      {getInteractionIcon(interaction.interaction_type)}
                    </div>
                    <p className="text-gray-300 text-sm truncate">
                      @{interaction.username}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {formatDate(interaction.interaction_date)}
                    </p>
                  </div>

                  {/* Status Badge & Delete Button */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1">
                        {getInteractionIcon(interaction.interaction_type)}
                        {getInteractionBadge(interaction.interaction_type)}
                      </div>
                      {interaction.is_mutual && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs">
                          Mutual Match
                        </Badge>
                      )}
                    </div>
                    
                    {/* Delete Button - Made more prominent */}
                    <button
                      onClick={(e) => {
                        console.log('Delete button clicked for interaction:', interaction.id);
                        e.stopPropagation();
                        handleDelete(interaction);
                      }}
                      disabled={deletingId === interaction.id}
                      className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex-shrink-0"
                      title="Delete interaction"
                      style={{
                        minWidth: '32px',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white', // Add border for better visibility
                        boxShadow: '0 0 0 2px rgba(255, 0, 0, 0.5)' // Add glow effect
                      }}
                    >
                      {deletingId === interaction.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Summary */}
          {interactions.length > 0 ? (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 p-3 rounded-xl border border-white/5">
                  <div className="text-2xl font-bold text-white">
                    {interactions.length}
                  </div>
                  <div className="text-xs text-gray-400">Total Interactions</div>
                </div>
                <div className="bg-gradient-to-br from-green-900/50 to-emerald-900/50 p-3 rounded-xl border border-white/5">
                  <div className="text-2xl font-bold text-green-400">
                    {interactions.filter(i => i.interaction_type === 'matched').length}
                  </div>
                  <div className="text-xs text-gray-400">Matches</div>
                </div>
              </div>
              <Button 
                onClick={refetch}
                variant="outline"
                className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👋</div>
              <h4 className="text-lg font-semibold text-white mb-2">No interactions yet</h4>
              <p className="text-gray-300 text-sm mb-6">
                Start swiping to see your discovery history here!
              </p>
              <Button 
                onClick={onClose}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
              >
                Start Swiping
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}