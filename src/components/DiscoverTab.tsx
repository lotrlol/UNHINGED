import React, { useState } from 'react'
import { Heart, X, MapPin, Sparkles, Users, Calendar, Loader2 } from 'lucide-react'
import { FilterGlassCard } from './ui/GlassCard'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useUserDiscovery } from '../hooks/useUserDiscovery'
import { DiscoveryFilters as DiscoveryFiltersComponent } from './DiscoveryFilters'
import { formatDate, getInitials } from '../lib/utils'
import { motion } from 'framer-motion'

export function DiscoverTab() {
  const { users, allUsers, filters, loading, error, liking, likeUser, passUser, updateFilters } = useUserDiscovery()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const currentUser = users[currentIndex]

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
      <div className="p-4 pb-20 relative">
        <DiscoveryFiltersComponent filters={filters} onFiltersChange={updateFilters} userCount={0} totalCount={0} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 pb-20 relative">
        <DiscoveryFiltersComponent filters={filters} onFiltersChange={updateFilters} userCount={0} totalCount={allUsers.length} />
        <FilterGlassCard className="p-8 text-center" variant="elevated">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error loading users</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Try Again
          </Button>
        </FilterGlassCard>
      </div>
    )
  }

  if (!currentUser || currentIndex >= users.length) {
    return (
      <div className="p-4 pb-20 relative">
        <DiscoveryFiltersComponent filters={filters} onFiltersChange={updateFilters} userCount={users.length} totalCount={allUsers.length} />
        <FilterGlassCard className="px-8 py-12 text-center" variant="elevated">
          <div className="flex flex-col items-center">
            <div className="text-7xl mb-6 transform hover:scale-110 transition-transform duration-300">
              {users.length === 0 ? '🔍' : '🎉'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              {users.length === 0 ? 'No users match your filters' : 'No more users to discover'}
            </h3>
            <p className="text-gray-300/90 mb-8 max-w-md mx-auto leading-relaxed">
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
        </FilterGlassCard>
      </div>
    )
  }

  const likeOpacity = swipeDirection === 'right' ? 1 : isDragging && dragOffset.x > 50 ? Math.min(dragOffset.x / 100, 1) : 0
  const passOpacity = swipeDirection === 'left' ? 1 : isDragging && dragOffset.x < -50 ? Math.min(Math.abs(dragOffset.x) / 100, 1) : 0

  return (
    <div className="p-4 pb-24 relative">
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

      <DiscoveryFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        userCount={users.length}
        totalCount={allUsers.length}
      />

      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <h2 className="text-2xl font-bold text-white mb-1">Discover Creators</h2>
        <p className="text-gray-300">Find your next creative collaborator</p>
        <div className="mt-2 text-sm text-gray-400">{currentIndex + 1} of {users.length}</div>
      </div>

      {/* Swipe Card */}
      <motion.div
        className="max-w-sm mx-auto relative z-10"
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
          <div className="bg-green-500/80 text-white px-4 py-2 rounded-lg font-bold text-lg border-4 border-green-400 rotate-12">
            LIKE
          </div>
        </div>
        <div className="absolute top-8 right-8 z-20 pointer-events-none" style={{ opacity: passOpacity }}>
          <div className="bg-red-500/80 text-white px-4 py-2 rounded-lg font-bold text-lg border-4 border-red-400 -rotate-12">
            PASS
          </div>
        </div>

        <FilterGlassCard className={`overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing select-none ${swipeDirection ? 'opacity-0' : ''}`} variant="elevated">
          {/* Image top half with gradient fade */}
          <div className="relative h-72">
            {currentUser.cover_url ? (
              <img src={currentUser.cover_url} alt="cover" className="w-full h-full object-cover" draggable={false} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center text-6xl text-white/30 font-bold">
                {currentUser.full_name.charAt(0)}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            {currentUser.is_verified && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-600/80 text-white border border-green-400">✓ Verified</Badge>
              </div>
            )}
          </div>

          {/* Info bottom half */}
          <div className="p-6">
            <h3 className="text-2xl font-bold text-white">{currentUser.full_name}</h3>
            <p className="text-gray-300 mb-3">@{currentUser.username}</p>
            {currentUser.tagline && <p className="text-gray-400 italic mb-4">"{currentUser.tagline}"</p>}

            {currentUser.roles.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300">Creator roles:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.roles.map(r => (
                    <Badge key={r} className="bg-black/40 border border-white/10 text-white">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {currentUser.looking_for.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-gray-300">Looking to work with:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.looking_for.map(r => (
                    <Badge key={r} className="bg-pink-900/30 text-pink-200 border border-pink-800/40">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {currentUser.skills.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">Skills:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.skills.map(s => (
                    <Badge key={s} className="bg-black/40 border border-white/10 text-white">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              {currentUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {currentUser.location}
                </div>
              )}
              {currentUser.is_remote && <Badge className="bg-blue-900/30 text-blue-200 border border-blue-800/40">🌍 Remote OK</Badge>}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Joined {formatDate(currentUser.created_at)}
              </div>
            </div>
          </div>
        </FilterGlassCard>

        {/* Action buttons */}
        <div className="flex justify-center gap-6 mt-8">
          <Button
            onClick={handlePass}
            disabled={liking || swipeDirection !== null}
            className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md hover:bg-red-600/40 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-red-400" />
          </Button>
          <Button
            onClick={handleLike}
            disabled={liking || swipeDirection !== null}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 flex items-center justify-center"
          >
            {liking ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Heart className="w-6 h-6 text-white" />}
          </Button>
        </div>
      </motion.div>

      <div className="text-center mt-6 text-xs text-gray-400 relative z-10">
        Swipe left to pass, right to like • Or use ← / →
      </div>
    </div>
  )
}
