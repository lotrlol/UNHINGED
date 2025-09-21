import React, { useState, useCallback, useEffect, useRef } from 'react'
import { X, MapPin, Users, Calendar, Loader2, Filter, History } from 'lucide-react'
import { ImmersiveProfileCard } from './ImmersiveProfileCard'
import { Button } from './ui/Button'
import { useUserDiscovery } from '../hooks/useUserDiscovery'
import { DiscoveryFilters as DiscoveryFiltersComponent } from './DiscoveryFilters'
import { formatDate, getInitials } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useContent } from '../hooks/useContent'
import { UserProfileModal } from './UserProfileModal.clean'
import { UserInteractionsModal } from './UserInteractionsModal'

export function DiscoverTab() {
  console.log('🔍 DiscoverTab: Component mounted');

  const { users, allUsers, filters, loading, error, liking, likeUser, passUser, updateFilters } = useUserDiscovery()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showInteractions, setShowInteractions] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const autoSwipeTimer = useRef<NodeJS.Timeout | null>(null)

  console.log('🔍 DiscoverTab: State initialized - users:', users.length, 'currentIndex:', currentIndex, 'loading:', loading, 'error:', error);

  const currentUser = users[currentIndex]


  // Reset timer on user interaction
 
  
  // Reset timer on any user interaction
  
  
  // Fetch content for the current user
  const { content: userContent = [] } = useContent(currentUser ? { creator_id: currentUser.id } : undefined)

  console.log('🔍 DiscoverTab: Content loaded for user', currentUser?.username, '- content items:', userContent.length);

  // Format content for ImmersiveProfileCard
  const formatContent = useCallback((content: any[]) => {
    return content.map(item => ({
      id: item.id,
      type: (item.content_type === 'video' ? 'video' : 'image') as 'video' | 'image',
      url: item.external_url || item.media_url || '',
      thumbnail: item.thumbnail_url
    }));
  }, []);

  // Format user data for ImmersiveProfileCard
  const formatUser = useCallback((user: any) => ({
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    bio: user.bio || user.tagline,
    location: user.location,
    createdAt: user.created_at,
    avatarUrl: user.avatar_url,
    tags: [...(user.roles || []), ...(user.skills || []), ...(user.looking_for || [])],
    content: formatContent(userContent)
  }), [userContent, formatContent]);

  console.log('🔍 DiscoverTab: Current user data:', currentUser ? '✅ User loaded' : '❌ No user', 'currentIndex:', currentIndex, 'total users:', users.length);

  // Reset current index when filters change (users get re-fetched)
  React.useEffect(() => {
    setCurrentIndex(0)
    console.log('🔄 DiscoverTab: Filters changed, resetting currentIndex to 0. New filters:', filters)
  }, [filters])


  const handleLike = async () => {
    if (!currentUser || liking) return;
    
    // Show the swipe animation
    setSwipeDirection('right');
    
    try {
      // Call the likeUser function and wait for it to complete
      const { error, match } = await likeUser(currentUser.id);
      
      if (error) {
        console.error('Error liking user:', error);
        // Show a more user-friendly error message
        alert('Failed to like user. Please try again.');
        return;
      }
      
      // If it's a match, show a special message
      if (match) {
        console.log('🎉 It\'s a match!');
        // You could show a match modal here if desired
      }
      
      // Move to the next user
      setCurrentIndex(prev => prev + 1);
    } catch (err) {
      console.error('Unexpected error in handleLike:', err);
    } finally {
      // Reset the swipe direction after the animation completes
      setTimeout(() => {
        setSwipeDirection(null);
      }, 300);
    }
  }

  const handlePass = async () => {
    if (!currentUser) return;
    setSwipeDirection('left');
    setTimeout(async () => {
      try {
        const response = await passUser(currentUser.id);

        // Check if response has an error property (Supabase style)
        if (response?.error) {
          console.error('Error passing user:', response.error);
        }

        // Move to next user in all cases
        setCurrentIndex(prev => prev + 1);
      } catch (error) {
        // This should only catch unexpected errors, not Supabase errors
        console.error('Unexpected error in handlePass:', error);
        setCurrentIndex(prev => prev + 1);
      } finally {
        setSwipeDirection(null);
      }
    }, 300);
  }

  const handleStart = (clientX: number, clientY: number) => {
    if (swipeDirection || !currentUser) return
    setIsDragging(true)
    setStartPos({ x: clientX, y: clientY })
    setDragOffset({ x: 0, y: 0 })
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || swipeDirection) return
    const deltaX = clientX - startPos.x
    const deltaY = clientY - startPos.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const handleEnd = () => {
    if (!isDragging || swipeDirection) return
    setIsDragging(false)
    const threshold = 100
    const { x } = dragOffset
    if (Math.abs(x) > threshold) {
      if (x > 0) handleLike()
      else handlePass()
    } else {
      setDragOffset({ x: 0, y: 0 })
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }
  
  const handleTouchEnd = () => handleEnd()

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  React.useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      handleMove(e.clientX, e.clientY)
    }
    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault()
      handleEnd()
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset.x, dragOffset.y])

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (swipeDirection || !currentUser) return
      if (e.key === 'ArrowLeft') handlePass()
      else if (e.key === 'ArrowRight') handleLike()
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentUser, swipeDirection])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error loading users</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!currentUser || currentIndex >= users.length) {
    return (
      <>
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex items-center justify-center p-4">
          {/* Enhanced Header for No Users State */}
          <div className="fixed top-0 left-0 right-0 z-[60] p-4">
            <div className="flex justify-between items-center max-w-6xl mx-auto">
              {/* Spacer */}
              <div />

              {/* Buttons Container */}
              <div className="flex items-center gap-3">
                {/* Interactions History Button */}
                <button
                  onClick={() => {
                    console.log('🔘 History button clicked, setting showInteractions to true')
                    setShowInteractions(true)
                  }}
                  className="relative px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/80 to-indigo-600/80 backdrop-blur-md border border-blue-400/30 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 font-medium"
                  aria-label="Discovery History"
                >
                  <History className="w-4 h-4" />
                  History
                </button>

                {/* Filters Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="relative px-4 py-2 rounded-full bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-md border border-purple-400/30 text-white hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg flex items-center gap-2 font-medium"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {Object.keys(filters).length > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-md">
                      <span className="text-xs text-white font-bold">{Object.keys(filters).length}</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center max-w-md">
            <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-300">
              {users.length === 0 ? '🔍' : '🎉'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              {users.length === 0 ? 'No users match your filters' : 'No more users to discover'}
            </h3>
            <p className="text-gray-300/90 mb-8 leading-relaxed">
              {users.length === 0
                ? 'Try adjusting your filters to see more creators.'
                : 'Check back later for new creators to connect with!'}
            </p>
            <Button
              onClick={() => (users.length === 0 ? updateFilters({}) : setCurrentIndex(0))}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-all duration-300 px-8 py-3 rounded-xl shadow-lg hover:shadow-purple-500/20"
            >
              {users.length === 0 ? 'Clear All Filters' : 'Start Over'}
            </Button>
          </div>

          {/* Filters Slide-out */}
          <AnimatePresence>
            {showFilters && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => setShowFilters(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-gray-900/95 to-gray-900/90 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-white">Filters</h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <DiscoveryFiltersComponent
                      filters={filters}
                      onFiltersChange={(newFilters) => {
                        updateFilters(newFilters)
                        setShowFilters(false)
                      }}
                      userCount={users.length}
                      totalCount={allUsers.length}
                    />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Modal */}
        <AnimatePresence>
          {showUserProfile && currentUser && (
            <UserProfileModal
              isOpen={showUserProfile}
              onClose={() => setShowUserProfile(false)}
              user={currentUser}
            />
          )}
        </AnimatePresence>

      </>
    )
  }

  const likeOpacity = swipeDirection === 'right' ? 1 : isDragging && dragOffset.x > 50 ? Math.min(dragOffset.x / 100, 1) : 0
  const passOpacity = swipeDirection === 'left' ? 1 : isDragging && dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 100, 1) : 0

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 overflow-hidden"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Animated gradient blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-full blur-3xl opacity-25"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-full blur-3xl opacity-20"
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
      />

      {/* Enhanced Header with Better Filter Integration */}
      <div className="fixed top-0 left-0 right-0 z-[60] p-4">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          {/* User Counter */}
          <div className="px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-sm">
            {currentIndex + 1} of {users.length}
          </div>

          {/* Spacer to avoid HeaderNotifications overlap */}
          <div className="flex-1" />

          {/* Interactions History Button */}
          <button
            onClick={() => {
              console.log('🔘 History button clicked, setting showInteractions to true')
              setShowInteractions(true)
            }}
            className="relative px-4 py-2 rounded-full bg-gradient-to-r from-blue-600/80 to-indigo-600/80 backdrop-blur-md border border-blue-400/30 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg flex items-center gap-2 font-medium"
            aria-label="Discovery History"
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          className="relative w-full max-w-sm h-[70vh] max-h-[600px]"
          style={{
            transform: isDragging ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.1}px) rotate(${dragOffset.x * 0.1}deg)` : undefined,
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
          onMouseDown={(e) => {
            handleMouseDown(e)
            resetAutoSwipe()
          }}
          onTouchStart={(e) => {
            handleTouchStart(e)
            resetAutoSwipe()
          }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Like/Pass indicators */}
          <div className="absolute top-8 left-8 z-20 pointer-events-none" style={{ opacity: likeOpacity }}>
            <div className="bg-green-500/90 text-white px-6 py-3 rounded-xl font-bold text-xl border-4 border-green-400 rotate-12 shadow-lg">
              LIKE
            </div>
          </div>
          <div className="absolute top-8 right-8 z-20 pointer-events-none" style={{ opacity: passOpacity }}>
            <div className="bg-red-500/90 text-white px-6 py-3 rounded-xl font-bold text-xl border-4 border-red-400 -rotate-12 shadow-lg">
              PASS
            </div>
          </div>

          {/* User Card */}
          <div
            className={`w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing select-none ${swipeDirection ? 'opacity-0' : ''}`}
          >
            {/* ImmersiveProfileCard Component */}
            {currentUser && formatUser ? (
              <ImmersiveProfileCard
                user={formatUser(currentUser)}
                onLike={handleLike}
                onPass={handlePass}
                onProfileOpen={() => setShowUserProfile(true)}
                isDragging={isDragging}
                dragOffset={dragOffset}
                swipeDirection={swipeDirection}
                liking={liking}
              />
            ) : (
              /* Fallback when no user or formatting issue */
              <div className="w-full h-full bg-gradient-to-br from-purple-600/60 to-pink-600/60 flex items-center justify-center">
                <span className="text-8xl text-white/20 font-bold">
                  {currentUser?.full_name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Swipe hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-center text-xs text-gray-400 z-50">
        Swipe or use buttons • ← Pass • Like →
      </div>

      {/* Combined AnimatePresence for all modals */}
      <AnimatePresence>
        {/* User Profile Modal */}
        {showUserProfile && currentUser && (
          <UserProfileModal
            key="user-profile-modal"
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
            user={currentUser}
          />
        )}
        
        {/* User Interactions Modal */}
        <UserInteractionsModal
          key="interactions-modal"
          isOpen={showInteractions}
          onClose={() => setShowInteractions(false)}
        />

        {/* Filters Slide-out */}
        {showFilters && (
          <>
            <motion.div
              key="filters-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              key="filters-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-gray-900/95 to-gray-900/90 backdrop-blur-xl border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <DiscoveryFiltersComponent
                  filters={filters}
                  onFiltersChange={(newFilters) => {
                    updateFilters(newFilters)
                    setShowFilters(false)
                  }}
                  userCount={users.length}
                  totalCount={allUsers.length}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}