import React, { useState } from 'react'
import { Heart, X, MapPin, Sparkles, Users, Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useUserDiscovery, DiscoveryFilters } from '../hooks/useUserDiscovery'
import { DiscoveryFilters as DiscoveryFiltersComponent } from './DiscoveryFilters'
import { formatDate, getInitials } from '../lib/utils'

export function DiscoverTab() {
  const { users, allUsers, filters, loading, error, liking, likeUser, passUser, updateFilters } = useUserDiscovery()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })

  const currentUser = users[currentIndex]

  // Reset current index when filters change
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

  // Touch/Mouse event handlers
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
    
    const threshold = 100 // minimum distance to trigger swipe
    const { x } = dragOffset
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        // Swiped right - like
        handleLike()
      } else {
        // Swiped left - pass
        handlePass()
      }
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 })
    }
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Mouse events (for desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX, e.clientY)
  }

  // Add global mouse event listeners for dragging
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

  // Keyboard support
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (swipeDirection || !currentUser) return
      
      if (e.key === 'ArrowLeft') {
        handlePass()
      } else if (e.key === 'ArrowRight') {
        handleLike()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentUser, swipeDirection])

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <DiscoveryFiltersComponent
          filters={filters}
          onFiltersChange={updateFilters}
          userCount={0}
          totalCount={0}
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <DiscoveryFiltersComponent
          filters={filters}
          onFiltersChange={updateFilters}
          userCount={0}
          totalCount={allUsers.length}
        />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading users
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!currentUser || currentIndex >= users.length) {
    return (
      <div className="p-4 pb-20">
        <DiscoveryFiltersComponent
          filters={filters}
          onFiltersChange={updateFilters}
          userCount={users.length}
          totalCount={allUsers.length}
        />
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{users.length === 0 ? '🔍' : '🎉'}</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {users.length === 0 ? 'No users match your filters' : 'No more users to discover'}
          </h3>
          <p className="text-gray-600 mb-6">
            {users.length === 0 
              ? 'Try adjusting your filters to see more creators.'
              : 'Check back later for new creators to connect with!'
            }
          </p>
          {users.length === 0 ? (
            <Button variant="outline" onClick={() => updateFilters({})}>
              Clear Filters
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setCurrentIndex(0)}>
              Start Over
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Calculate transform and rotation based on drag
  const getCardTransform = () => {
    if (swipeDirection === 'left') {
      return 'translateX(-100%) rotate(-10deg)'
    } else if (swipeDirection === 'right') {
      return 'translateX(100%) rotate(10deg)'
    } else if (isDragging) {
      const rotation = dragOffset.x * 0.1 // subtle rotation while dragging
      return `translateX(${dragOffset.x}px) translateY(${dragOffset.y * 0.1}px) rotate(${rotation}deg)`
    }
    return 'translateX(0) translateY(0) rotate(0deg)'
  }

  // Calculate opacity for like/pass indicators
  const getLikeOpacity = () => {
    if (swipeDirection === 'right') return 1
    if (isDragging && dragOffset.x > 50) return Math.min(dragOffset.x / 100, 1)
    return 0
  }

  const getPassOpacity = () => {
    if (swipeDirection === 'left') return 1
    if (isDragging && dragOffset.x < -50) return Math.min(Math.abs(dragOffset.x) / 100, 1)
    return 0
  }

  return (
    <div className="p-4 pb-20">
      {/* Filters */}
      <DiscoveryFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        userCount={users.length}
        totalCount={allUsers.length}
      />

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Creators</h2>
        <p className="text-gray-600">
          Find your next creative collaborator
        </p>
        <div className="mt-2 text-sm text-gray-500">
          {currentIndex + 1} of {users.length}
        </div>
      </div>

      {/* User Card */}
      <div className="max-w-sm mx-auto relative">
        {/* Like Indicator */}
        <div 
          className="absolute top-8 left-8 z-10 pointer-events-none"
          style={{ opacity: getLikeOpacity() }}
        >
          <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-lg border-4 border-green-400 rotate-12">
            LIKE
          </div>
        </div>

        {/* Pass Indicator */}
        <div 
          className="absolute top-8 right-8 z-10 pointer-events-none"
          style={{ opacity: getPassOpacity() }}
        >
          <div className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg border-4 border-red-400 -rotate-12">
            PASS
          </div>
        </div>

        <Card 
          className={`transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${
            swipeDirection ? 'opacity-0' : ''
          }`}
          style={{
            transform: getCardTransform(),
            transition: isDragging ? 'none' : 'all 0.3s ease-out'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          {/* Cover/Avatar Section */}
          <div className="relative h-64 bg-gradient-to-br from-purple-400 to-cyan-400">
            {currentUser.cover_url ? (
              <img
                src={currentUser.cover_url}
                alt={`${currentUser.full_name}'s cover`}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-white text-8xl font-bold opacity-20">
                  {currentUser.full_name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            
            {/* Avatar */}
            <div className="absolute -bottom-8 left-6">
              <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white">
                {currentUser.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.full_name}
                    className="w-full h-full rounded-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <span className="text-lg font-bold text-gray-600">
                    {getInitials(currentUser.full_name)}
                  </span>
                )}
              </div>
            </div>

            {/* Verified Badge */}
            {currentUser.is_verified && (
              <div className="absolute top-4 right-4">
                <Badge variant="success" className="bg-white text-green-600">
                  ✓ Verified
                </Badge>
              </div>
            )}
          </div>

          <CardContent className="pt-12">
            {/* Basic Info */}
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {currentUser.full_name}
              </h3>
              <p className="text-gray-600">@{currentUser.username}</p>
            </div>

            {/* Tagline */}
            {currentUser.tagline && (
              <p className="text-gray-700 mb-4 italic">
                "{currentUser.tagline}"
              </p>
            )}

            {/* Roles */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Creator roles:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentUser.roles.slice(0, 3).map((role) => (
                  <Badge key={role} variant="default" size="sm">
                    {role}
                  </Badge>
                ))}
                {currentUser.roles.length > 3 && (
                  <Badge variant="secondary" size="sm">
                    +{currentUser.roles.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            {/* Looking For */}
            {currentUser.looking_for.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-pink-600" />
                  <span className="text-sm font-medium text-gray-700">Looking to work with:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.looking_for.slice(0, 3).map((role) => (
                    <Badge key={role} variant="secondary" size="sm">
                      {role}
                    </Badge>
                  ))}
                  {currentUser.looking_for.length > 3 && (
                    <Badge variant="secondary" size="sm">
                      +{currentUser.looking_for.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Skills */}
            {currentUser.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Skills:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.skills.slice(0, 4).map((skill) => (
                    <Badge key={skill} variant="secondary" size="sm">
                      {skill}
                    </Badge>
                  ))}
                  {currentUser.skills.length > 4 && (
                    <Badge variant="secondary" size="sm">
                      +{currentUser.skills.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Vibe Words */}
            {currentUser.vibe_words.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Creative vibe:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentUser.vibe_words.slice(0, 3).map((word) => (
                    <Badge key={word} variant="secondary" size="sm">
                      ✨ {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Details */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
              {currentUser.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{currentUser.location}</span>
                </div>
              )}
              {currentUser.is_remote && (
                <Badge variant="success" size="sm">🌍 Remote OK</Badge>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(currentUser.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6 mt-6">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePass}
            disabled={liking || swipeDirection !== null}
            className="w-16 h-16 rounded-full border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 flex items-center justify-center"
          >
            <X className="w-6 h-6 text-gray-600 hover:text-red-600" />
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            onClick={handleLike}
            disabled={liking || swipeDirection !== null}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 flex items-center justify-center"
          >
            {liking ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Heart className="w-6 h-6 text-white" />
            )}
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="text-center mt-4 text-xs text-gray-500 space-y-1">
          <p>Swipe left to pass, right to like</p>
          <p>Or press ← to pass, → to like</p>
        </div>
      </div>
    </div>
  )
}