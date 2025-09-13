import React from 'react'
import { X, ExternalLink, Heart, Eye, Calendar, User } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { ContentPost } from '../hooks/useContent'
import { formatDate, getInitials, extractYouTubeVideoId } from '../lib/utils'

interface ContentModalProps {
  isOpen: boolean
  onClose: () => void
  content: ContentPost | null
  onLike: (contentId: string, isLiked: boolean) => void
}

export function ContentModal({ isOpen, onClose, content, onLike }: ContentModalProps) {
  if (!isOpen || !content) return null

  const handleLike = () => {
    onLike(content.id, content.user_has_liked || false)
  }

  const handleExternalLink = () => {
    if (content.external_url) {
      window.open(content.external_url, '_blank')
    }
  }

  const renderContent = () => {
    switch (content.content_type) {
      case 'video':
        if (content.external_url) {
          const videoId = extractYouTubeVideoId(content.external_url)
          if (videoId) {
            return (
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={content.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )
          }
        }
        // Fallback for non-YouTube videos or if no URL
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-purple-400 to-cyan-400 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-medium">Video Content</p>
              {content.external_url && (
                <Button
                  variant="outline"
                  className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
                  onClick={handleExternalLink}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on {content.platform || 'External Site'}
                </Button>
              )}
            </div>
          </div>
        )

      case 'audio':
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-pink-400 to-orange-400 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-lg font-medium">Audio Content</p>
              {content.external_url && (
                <Button
                  variant="outline"
                  className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
                  onClick={handleExternalLink}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Listen on {content.platform || 'External Site'}
                </Button>
              )}
            </div>
          </div>
        )

      case 'image':
        if (content.thumbnail_url || content.external_url) {
          return (
            <div className="w-full rounded-lg overflow-hidden">
              <img
                src={content.thumbnail_url || content.external_url || ''}
                alt={content.title}
                className="w-full h-auto max-h-96 object-contain bg-gray-100"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <div class="aspect-video w-full bg-gradient-to-br from-cyan-400 to-blue-400 rounded-lg flex items-center justify-center">
                        <div class="text-center text-white">
                          <div class="text-6xl mb-4">🖼️</div>
                          <p class="text-lg font-medium">Image Content</p>
                        </div>
                      </div>
                    `
                  }
                }}
              />
            </div>
          )
        }
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-cyan-400 to-blue-400 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🖼️</div>
              <p className="text-lg font-medium">Image Content</p>
            </div>
          </div>
        )

      case 'article':
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-green-400 to-teal-400 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg font-medium">Article Content</p>
              {content.external_url && (
                <Button
                  variant="outline"
                  className="mt-4 bg-white text-gray-900 hover:bg-gray-100"
                  onClick={handleExternalLink}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Read on {content.platform || 'External Site'}
                </Button>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium">Content</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-white">
              {content.creator_avatar ? (
                <img
                  src={content.creator_avatar}
                  alt={content.creator_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-gray-600">
                  {getInitials(content.creator_name)}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{content.creator_name}</span>
                {content.creator_verified && (
                  <Badge variant="success" size="sm">✓</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(content.created_at)}</span>
                {content.platform && (
                  <>
                    <span>•</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                      {content.platform}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {content.title}
          </h1>

          {/* Media Content */}
          <div className="mb-6">
            {renderContent()}
          </div>

          {/* Description */}
          {content.description && (
            <div className="mb-6">
              <p className="text-gray-700 leading-relaxed">
                {content.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{content.view_count} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className={`w-4 h-4 ${content.user_has_liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{content.like_count} likes</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-2 ${
                  content.user_has_liked
                    ? 'text-red-600 border-red-300 bg-red-50 hover:bg-red-100'
                    : 'hover:text-red-600 hover:border-red-300 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${content.user_has_liked ? 'fill-current' : ''}`} />
                {content.user_has_liked ? 'Liked' : 'Like'}
              </Button>
              
              {content.external_url && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleExternalLink}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Original
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}