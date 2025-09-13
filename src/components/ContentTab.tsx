import React from 'react'
import { useState } from 'react'
import { Card, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ExternalLink, Play, Music, Image as ImageIcon, Heart, Eye, Filter, Plus, FileText, Loader2 } from 'lucide-react'
import { useContent, ContentFilters } from '../hooks/useContent'
import { formatDate, getInitials } from '../lib/utils'
import { CreateContentModal } from './CreateContentModal'
import { UserProfileModal } from './UserProfileModal'
import { supabase } from '../lib/supabase'

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
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Play },
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'article', label: 'Article', icon: FileText }
] as const

export function ContentTab() {
  const [filters, setFilters] = useState<ContentFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const { content, loading, error, likeContent, unlikeContent, recordView, refetch } = useContent(filters)

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


  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const handleLike = async (contentId: string, isLiked: boolean) => {
    if (isLiked) {
      await unlikeContent(contentId)
    } else {
      await likeContent(contentId)
    }
  }

  const handleView = async (contentId: string, creator: any) => {
    await recordView(contentId)
    // Show user profile modal
    if (creator) {
      setSelectedUser({
        id: creator.creator_id,
        username: creator.creator_username,
        full_name: creator.creator_name,
        roles: creator.creator_roles || [],
        tagline: null, // Not available in content view
        location: null, // Not available in content view
        avatar_url: creator.creator_avatar,
        is_verified: creator.creator_verified,
        created_at: new Date().toISOString() // Fallback
      })
      setShowUserModal(true)
    }
  }

  const updateFilter = (key: keyof ContentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({})
  }

  const activeFilterCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ).length

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Feed</h2>
          <p className="text-gray-600">
            Discover content from creators in your network
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Share Content
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="default" size="sm">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500"
              >
                Clear all
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CONTENT_TYPES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateFilter('content_type', filters.content_type === value ? undefined : value)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      filters.content_type === value
                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading content
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="primary" onClick={refetch}>
            Try Again
          </Button>
        </div>
      )}

      {/* Content List */}
      {!loading && !error && (
        <div className="space-y-6">
          {content.map((item) => (
            <Card key={item.id} className="overflow-hidden bg-black rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardContent className="p-0 relative">
                {/* Main Content Area - Full Width Visual */}
                <div 
                  className="relative w-full aspect-[9/16] max-h-[600px] bg-gradient-to-br from-purple-900 to-black cursor-pointer group overflow-hidden" 
                  onClick={() => handleView(item.id, item)}
                >
                  {/* Background Content */}
                  {renderMediaContent(item)}
                  
                  {/* Dark Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Content Type Icon - Top Left */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full p-3">
                    <div className="text-white text-xl">
                      {getIcon(item.content_type)}
                    </div>
                  </div>
                  
                  {/* Platform Badge - Top Right */}
                  {item.platform && (
                    <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-sm font-medium">{item.platform}</span>
                    </div>
                  )}

                  {/* Bottom Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    {/* Creator Info */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-3 border-white overflow-hidden">
                        {item.creator_avatar ? (
                          <img
                            src={item.creator_avatar}
                            alt={item.creator_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-bold text-gray-800">
                            {getInitials(item.creator_name)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-lg drop-shadow-lg">{item.creator_name}</span>
                        {item.creator_verified && (
                          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-white text-xl mb-2 line-clamp-2 drop-shadow-lg">
                      {item.title}
                    </h3>
                    
                    {/* Description */}
                    {item.description && (
                      <p className="text-white/90 text-base mb-4 line-clamp-3 drop-shadow-md">
                        {item.description}
                      </p>
                    )}

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
                            #{tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-medium">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Bar - Outside the main content */}
                <div className="bg-black/90 backdrop-blur-sm p-4">
                  <div className="flex items-center justify-between">
                    {/* Stats - Left Side */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-white">
                        <Eye className="w-5 h-5 text-gray-300" />
                        <span className="font-bold text-lg">{formatNumber(item.view_count)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white">
                        <Heart className={`w-5 h-5 ${item.user_has_liked ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
                        <span className="font-bold text-lg">{formatNumber(item.like_count)}</span>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatDate(item.created_at)}
                      </div>
                    </div>
                    
                    {/* Action Buttons - Right Side */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleLike(item.id, item.user_has_liked || false)
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105 ${
                          item.user_has_liked
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${item.user_has_liked ? 'fill-current' : ''}`} />
                        <span>{item.user_has_liked ? 'Liked' : 'Like'}</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleView(item.id, item)
                        }}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && content.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📱</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No content yet
          </h3>
          <p className="text-gray-600 mb-6">
            {activeFilterCount > 0 
              ? 'No content matches your current filters. Try adjusting them or clearing all filters.'
              : 'Be the first to share content! Click the "Share Content" button to get started.'
            }
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              Share Your First Content
            </Button>
          )}
        </div>
      )}

      {/* Create Content Modal */}
      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onContentCreated={() => {
          refetch()
          setShowCreateModal(false)
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        user={selectedUser}
      />
    </div>
  )
}