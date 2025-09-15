import React, { useState } from 'react'
import { Heart, X, MapPin, Sparkles, Users, Calendar, Loader2, Filter, ChevronDown } from 'lucide-react'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useUserDiscovery } from '../hooks/useUserDiscovery'
import { DiscoveryFilters as DiscoveryFiltersComponent } from './DiscoveryFilters'
import { formatDate, getInitials } from '../lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useContent } from '../hooks/useContent'

export function DiscoverTab() {
  const { users, allUsers, filters, loading, error, liking, likeUser, passUser, updateFilters } = useUserDiscovery()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [showFilters, setShowFilters] = useState(false)

  const currentUser = users[currentIndex]
  
  // Fetch content for the current user
  const { content: userContent } = useContent(currentUser ? { creator_id: currentUser.id } : undefined)

  React.useEffect(() => {
    setCurrentIndex(0)
  }, [filters])

  const handleLike = async () => {
    if (!currentUser || liking) return
    setSwipeDirection('right')
    setTimeout(async () => {
      const { error } = await likeUser(currentUser.id)
      if (error) {
        console.error('Error liking user:', error)
        alert('Failed to like user: ' + error)
      }
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }

  const handlePass = async () => {
    if (!currentUser) return
    setSwipeDirection('left')
    setTimeout(async () => {
      const { error } = await passUser(currentUser.id)
      if (error) {
        console.error('Error passing user:', error)
      }
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
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
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex items-center justify-center p-4">
        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(true)}
          className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          <Filter className="w-5 h-5" />
        </button>

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
    )
  }

  const likeOpacity = swipeDirection === 'right' ? 1 : isDragging && dragOffset.x > 50 ? Math.min(dragOffset.x / 100, 1) : 0
  const passOpacity = swipeDirection === 'left' ? 1 : isDragging && dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 100, 1) : 0

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 overflow-hidden">
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

      {/* Filter Button */}
      <button
        onClick={() => setShowFilters(true)}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-lg"
      >
        <Filter className="w-5 h-5" />
        {Object.keys(filters).length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">{Object.keys(filters).length}</span>
          </div>
        )}
      </button>

      {/* User Counter */}
      <div className="fixed top-6 left-6 z-50 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white text-sm">
        {currentIndex + 1} of {users.length}
      </div>

      {/* Main Card Container */}
      <div className="flex items-center justify-center h-full p-4">
        <motion.div
          className="relative w-full max-w-sm h-[70vh] max-h-[600px]"
          style={{
            transform: isDragging ? `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.1}px) rotate(${dragOffset.x * 0.1}deg)` : undefined,
            transition: isDragging ? 'none' : 'all 0.3s ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
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
          <div className={`w-full h-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900/90 to-gray-900/70 backdrop-blur-xl border border-white/10 shadow-2xl cursor-grab active:cursor-grabbing select-none ${swipeDirection ? 'opacity-0' : ''}`}>
            {/* Content Slider Background */}
            <div className="relative w-full h-full">
              {userContent && userContent.length > 0 ? (
                <div className="w-full h-full">
                  {/* Content slides */}
                  <div className="relative w-full h-full overflow-hidden">
                    {userContent.slice(0, 3).map((content, index) => (
                      <div
                        key={content.id}
                        className="absolute inset-0 w-full h-full"
                        style={{
                          transform: `translateX(${index * 100}%)`,
                          transition: 'transform 0.5s ease-in-out'
                        }}
                      >
                        {content.content_type === 'video' && content.external_url ? (
                          <video
                            src={content.external_url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                        ) : content.thumbnail_url ? (
                          <img
                            src={content.thumbnail_url}
                            alt={content.title}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/60 to-pink-600/60 flex items-center justify-center">
                            <span className="text-8xl text-white/20">
                              {content.content_type === 'video' ? '🎥' : 
                               content.content_type === 'image' ? '📸' : 
                               content.content_type === 'audio' ? '🎵' : '📝'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Content indicators */}
                  {userContent.length > 1 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
                      {userContent.slice(0, 3).map((_, index) => (
                        <div
                          key={index}
                          className="w-8 h-1 bg-white/30 rounded-full overflow-hidden"
                        >
                          <div className="w-full h-full bg-white rounded-full" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback when no content */
                <div className="w-full h-full bg-gradient-to-br from-purple-600/60 to-pink-600/60 flex items-center justify-center">
                  <span className="text-8xl text-white/20 font-bold">
                    {currentUser.full_name.charAt(0)}
                  </span>
                </div>
              )}
              
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
              
              {/* Verification badge */}
              {currentUser.is_verified && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge className="bg-green-600/90 text-white border border-green-400 backdrop-blur-sm">
                    ✓ Verified
                  </Badge>
                </div>
              )}

              {/* User Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                {/* Name and username */}
                <div className="mb-4">
                  <h3 className="text-3xl font-bold text-white drop-shadow-lg">{currentUser.full_name}</h3>
                  <p className="text-gray-200 text-lg drop-shadow-md">@{currentUser.username}</p>
                  {currentUser.tagline && (
                    <p className="text-gray-300 italic mt-2 drop-shadow-md">"{currentUser.tagline}"</p>
                  )}
                </div>

                {/* Quick info chips */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Top role */}
                  {currentUser.roles.length > 0 && (
                    <Badge className="bg-black/50 text-white border border-white/20 backdrop-blur-sm">
                      {currentUser.roles[0]}
                    </Badge>
                  )}
                  
                  {/* Location */}
                  {currentUser.location && (
                    <Badge className="bg-black/50 text-white border border-white/20 backdrop-blur-sm">
                      📍 {currentUser.location}
                    </Badge>
                  )}
                  
                  {/* Remote */}
                  {currentUser.is_remote && (
                    <Badge className="bg-black/50 text-white border border-white/20 backdrop-blur-sm">
                      🌍 Remote
                    </Badge>
                  )}
                  
                  {/* Content count */}
                  {userContent && userContent.length > 0 && (
                    <Badge className="bg-black/50 text-white border border-white/20 backdrop-blur-sm">
                      {userContent.length} {userContent.length === 1 ? 'post' : 'posts'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>


      {/* Swipe hint */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-center text-xs text-gray-400 z-50">
        Swipe or use buttons • ← Pass • Like →
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
            {/* Integrated Action Buttons */}
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={handlePass}
                disabled={liking || swipeDirection !== null}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500/90 to-red-600/90 backdrop-blur-md border border-red-400/30 shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
              
              <motion.button
                onClick={handleLike}
                disabled={liking || swipeDirection !== null}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-md border border-pink-400/30 shadow-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {liking ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Heart className="w-7 h-7" />
                )}
              </motion.button>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}