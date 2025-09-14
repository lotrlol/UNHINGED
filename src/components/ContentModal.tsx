import React from 'react'
import { X, ExternalLink, Heart, Eye, Calendar } from 'lucide-react'
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
      case 'video': {
        if (content.external_url) {
          const videoId = extractYouTubeVideoId(content.external_url)
          if (videoId) {
            return (
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black/40 backdrop-blur-md">
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
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-purple-600/50 to-pink-500/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-medium">Video Content</p>
              {content.external_url && (
                <Button
                  variant="outline"
                  className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={handleExternalLink}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on {content.platform || 'External Site'}
                </Button>
              )}
            </div>
          </div>
        )
      }

      case 'audio':
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-pink-600/50 to-orange-500/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-lg font-medium">Audio Content</p>
              {content.external_url && (
                <Button
                  variant="outline"
                  className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
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
        return (
          <div className="w-full rounded-xl overflow-hidden bg-black/40 backdrop-blur-md">
            {content.thumbnail_url || content.external_url ? (
              <img
                src={content.thumbnail_url || content.external_url || ''}
                alt={content.title}
                className="w-full h-auto max-h-96 object-contain"
              />
            ) : (
              <div className="aspect-video flex items-center justify-center text-white">
                <div className="text-6xl mb-4">🖼️</div>
                <p className="text-lg font-medium">Image Content</p>
              </div>
            )}
          </div>
        )

      case 'article':
        return (
          <div className="aspect-video w-full bg-gradient-to-br from-green-600/50 to-teal-500/50 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg font-medium">Article Content</p>
              {content.external_url && (
                <Button
                  variant="outline"
                  className="mt-4 bg-white/10 text-white border-white/20 hover:bg-white/20"
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
          <div className="aspect-video w-full bg-gray-700/50 rounded-xl flex items-center justify-center backdrop-blur-sm text-white">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium">Content</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity duration-300">
      <div 
        className="relative bg-gradient-to-br from-gray-900/95 to-gray-900/90 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden"
        style={{
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px) saturate(200%)',
          WebkitBackdropFilter: 'blur(16px) saturate(200%)',
          backgroundImage: 'radial-gradient(at 100% 0%, rgba(56, 189, 248, 0.05) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(192, 132, 252, 0.05) 0px, transparent 50%)',
        }}
      >
        {/* Subtle gradient border effect */}
        <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-pink-900/30 rounded-2xl opacity-50" />
        </div>
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-white/[0.02] to-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/90 font-medium overflow-hidden backdrop-blur-sm">
              {content.creator_avatar ? (
                <img
                  src={content.creator_avatar}
                  alt={content.creator_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(content.creator_name)}</span>
              )}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white drop-shadow-sm">{content.creator_name}</span>
                {content.creator_verified && (
                  <Badge variant="success" size="sm">✓</Badge>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400/90">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(content.created_at)}</span>
                {content.platform && (
                  <>
                    <span>•</span>
                    <span className="bg-white/5 px-2 py-0.5 rounded-full text-xs text-gray-300/90 backdrop-blur-sm border border-white/5">
                      {content.platform}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white transition-all duration-200 p-2 hover:bg-white/10 rounded-full backdrop-blur-sm border border-transparent hover:border-white/20"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-4">
            {content.title}
          </h1>

          {/* Media Content */}
          <div className="mb-6 rounded-xl overflow-hidden border border-white/5 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
            {renderContent()}
          </div>

          {/* Description */}
          {content.description && (
            <div className="mb-6 p-4 rounded-lg bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/5">
              <p className="text-gray-300 leading-relaxed text-sm">{content.description}</p>
            </div>
          )}

          {/* Tags */}
          {content.tags.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {content.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-white/[0.03] text-gray-300 border border-white/5 hover:bg-white/5 transition-colors duration-200">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-white/10">
            <div className="flex items-center gap-6 text-sm text-gray-400">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                  content.user_has_liked
                    ? 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-sm'
                    : 'text-white/80 border-white/5 hover:bg-white/5 hover:border-white/10 backdrop-blur-sm'
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
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-700/90 to-pink-600/90 text-white/95 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 hover:scale-[1.02]"
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
