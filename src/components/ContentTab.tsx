import React, { useRef, useEffect } from 'react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ExternalLink, MessageSquare, Share2, MoreHorizontal, Music, Heart, UserPlus, Volume2, VolumeX, Image as ImageIcon, FileText } from 'lucide-react'
import { useContent, ContentFilters } from '../hooks/useContent'
import { formatDate, getInitials } from '../lib/utils'
import { CreateContentModal } from './CreateContentModal'
import { UserProfileModal } from './UserProfileModal'
import { supabase } from '../lib/supabase'
import { useInView } from 'react-intersection-observer'

const getContentEmoji = (type: string) => {
  switch (type) {
    case 'video':
      return '🎬'
    case 'audio':
      return '🎵'
    case 'article':
      return '📝'
    default:
      return '📸'
  }
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Music },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'article', label: 'Article', icon: FileText }
] as const

const getThumbnailUrl = (item: any) => {
  // Handle Supabase storage paths vs full URLs
  if (item.thumbnail_url) {
    // If it's already a full URL, use it
    if (item.thumbnail_url.startsWith('http')) {
      return item.thumbnail_url
    }
    // If it's a storage path, generate public URL
    if (item.thumbnail_url.includes('/')) {
      const { data } = supabase.storage
        .from('content-media')
        .getPublicUrl(item.thumbnail_url)
      return data.publicUrl
    }
  }
  
  // Handle external_url for images
  if (item.content_type === 'image' && item.external_url) {
    // If it's already a full URL, use it
    if (item.external_url.startsWith('http')) {
      return item.external_url
    }
    // If it's a storage path, generate public URL
    if (item.external_url.includes('/')) {
      const { data } = supabase.storage
        .from('content-media')
        .getPublicUrl(item.external_url)
      return data.publicUrl
    }
  }
  
  return null
}

const renderMediaContent = (item: any) => {
  const mediaUrl = getThumbnailUrl(item)
  
  if (!mediaUrl) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-8xl mb-4">{getContentEmoji(item.content_type)}</div>
          <div className="text-4xl font-bold opacity-20">{item.title.charAt(0).toUpperCase()}</div>
        </div>
      </div>
    )
  }

  if (item.content_type === 'video') {
    return (
      <video
        src={mediaUrl}
        className="w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        onError={(e) => {
          const target = e.target as HTMLVideoElement
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent) {
            parent.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
                <div class="text-center text-white">
                  <div class="text-8xl mb-4">🎬</div>
                  <div class="text-4xl font-bold opacity-20">${item.title.charAt(0).toUpperCase()}</div>
                </div>
              </div>
            `
          }
        }}
      />
    )
  }

  // For images
  return (
    <img
      src={mediaUrl}
      alt={item.title}
      className="w-full h-full object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent) {
          parent.innerHTML = `
            <div class="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 flex items-center justify-center">
              <div class="text-center text-white">
                <div class="text-8xl mb-4">${getContentEmoji(item.content_type)}</div>
                <div class="text-4xl font-bold opacity-20">${item.title.charAt(0).toUpperCase()}</div>
              </div>
            </div>
          `
        }
      }}
    />
  )
}

const FeedItem = ({ item, isActive, onLike, onUserClick }) => {
  const [isMuted, setIsMuted] = useState(true)
  const [isLiked, setIsLiked] = useState(item.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(item.likes_count || 0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0.8,
    triggerOnce: false
  })

  useEffect(() => {
    if (!videoRef.current) return
    
    if (inView && isActive) {
      videoRef.current.play().catch(e => console.log('Autoplay prevented:', e))
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [inView, isActive])

  const handleLike = () => {
    const newLikeStatus = !isLiked
    setIsLiked(newLikeStatus)
    setLikeCount(prev => newLikeStatus ? prev + 1 : Math.max(0, prev - 1))
    onLike(item.id, !isLiked)
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <div 
      ref={ref}
      className={`relative w-full h-screen flex items-center justify-center bg-black ${!isActive ? 'opacity-50' : ''}`}
    >
      {/* Video/Image Content */}
      <div className="absolute inset-0 w-full h-full">
        {renderMediaContent(item)}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent" />

      {/* Content Info */}
      <div className="absolute bottom-0 left-0 w-full p-6 text-white z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-4">
            <button 
              onClick={() => onUserClick(item.profiles)}
              className="flex items-center"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold mr-3">
                {getInitials(item.profiles?.username || 'U')}
              </div>
              <span className="font-bold">@{item.profiles?.username || 'user'}</span>
            </button>
            <button className="ml-4 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
              Follow
            </button>
          </div>
          
          <p className="text-lg mb-4 line-clamp-2">{item.description || 'Check out this amazing content!'}</p>
          
          <div className="flex items-center space-x-4 text-sm text-white/80">
            <div className="flex items-center">
              <Music className="w-4 h-4 mr-1" />
              <span>Original Sound</span>
            </div>
            <div>{formatDate(item.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6">
        <div className="flex flex-col items-center">
          <button 
            onClick={handleLike}
            className="flex flex-col items-center group"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Heart 
                className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} 
              />
            </div>
            <span className="text-xs mt-1 text-white">{formatNumber(likeCount)}</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <button className="flex flex-col items-center group">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs mt-1 text-white">{item.comments_count || 0}</span>
          </button>
        </div>

        <div className="flex flex-col items-center">
          <button className="flex flex-col items-center group">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs mt-1 text-white">Share</span>
          </button>
        </div>

        <button 
          onClick={toggleMute}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5 text-white" />
          ) : (
            <Volume2 className="w-5 h-5 text-white" />
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: isPlaying ? '100%' : '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function ContentTab() {
  const [activeFilter, setActiveFilter] = useState<ContentFilters>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const { content, loading, error, likeContent, loadMoreContent } = useContent(activeFilter, 10, page)

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />
      case 'audio':
        return <Music className="w-5 h-5" />
      case 'article':
        return <FileText className="w-5 h-5" />
      default:
        return <ImageIcon className="w-5 h-5" />
    }
  }

  // Handle loading and error states
  if (loading && content.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-4">😕</div>
          <h3 className="text-xl font-bold mb-2">Something went wrong</h3>
          <p className="text-white/70 mb-6">We couldn't load the content. Please try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-white text-black rounded-full font-medium hover:bg-white/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Handle empty state
  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center p-6">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <Plus className="w-12 h-12 text-white/70" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No content yet</h2>
        <p className="text-white/70 mb-6 max-w-md">Be the first to create and share amazing content with the community!</p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center"
        >
          Create your first post
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main Feed */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        <AnimatePresence>
          {content.map((item, index) => (
            <FeedItem
              key={item.id}
              item={item}
              isActive={activeIndex === index}
              onLike={likeContent}
              onUserClick={setSelectedUser}
            />
          ))}
        </AnimatePresence>

        {/* Load more indicator */}
        {hasMore && (
          <div className="h-screen flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="mt-4 text-white/70">Loading more content...</p>
            </div>
          </div>
        )}
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {['For You', 'Following', 'Trending', 'Music', 'Gaming', 'News'].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeFilter === tab.toLowerCase()
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => setActiveFilter(tab.toLowerCase() as ContentFilters)}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <button className="p-2 text-white hover:bg-white/10 rounded-full">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform z-30"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateContentModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          />
        )}

        {selectedUser && (
          <UserProfileModal
            user={selectedUser}
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>

      {/* Scroll indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full z-20">
        Swipe up for more
      </div>
    </div>
  )
}