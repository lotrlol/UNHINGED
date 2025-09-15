import React, { useState, useRef, useEffect } from 'react';
import { X, MapPin, Calendar, MessageCircle, Check, Sparkles, Grid3X3, List, Play, Heart, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getInitials, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../hooks/useContent';

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    username: string
    full_name: string
    roles: string[]
    skills?: string[]
    looking_for?: string[]
    tagline: string | null
    vibe_words?: string[]
    location: string | null
    is_remote?: boolean
    avatar_url: string | null
    cover_url?: string | null
    is_verified: boolean
    created_at: string
  } | null
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  
  // Fetch user's content
  const { content: userContent, loading: contentLoading } = useContent(user ? { creator_id: user.id } : undefined);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedContent) {
          setSelectedContent(null);
        } else {
          onClose();
        }
      }
      if (selectedContent && userContent) {
        if (e.key === 'ArrowLeft' && currentContentIndex > 0) {
          setCurrentContentIndex(currentContentIndex - 1);
          setSelectedContent(userContent[currentContentIndex - 1]);
        }
        if (e.key === 'ArrowRight' && currentContentIndex < userContent.length - 1) {
          setCurrentContentIndex(currentContentIndex + 1);
          setSelectedContent(userContent[currentContentIndex + 1]);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, selectedContent, currentContentIndex, userContent]);

  const handleContentClick = (content: any, index: number) => {
    setSelectedContent(content);
    setCurrentContentIndex(index);
  };

  const navigateContent = (direction: 'prev' | 'next') => {
    if (!userContent) return;
    
    if (direction === 'prev' && currentContentIndex > 0) {
      const newIndex = currentContentIndex - 1;
      setCurrentContentIndex(newIndex);
      setSelectedContent(userContent[newIndex]);
    } else if (direction === 'next' && currentContentIndex < userContent.length - 1) {
      const newIndex = currentContentIndex + 1;
      setCurrentContentIndex(newIndex);
      setSelectedContent(userContent[newIndex]);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'image': return '📸';
      case 'article': return '📝';
      default: return '📄';
    }
  };

  const renderContentThumbnail = (item: any) => {
    if (item.content_type === 'video' && item.external_url) {
      return (
        <div className="relative w-full h-full">
          <video
            src={item.external_url}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Play className="w-6 h-6 text-white ml-1" />
            </div>
          </div>
        </div>
      );
    }
    
    if (item.thumbnail_url || item.external_url) {
      return (
        <img
          src={item.thumbnail_url || item.external_url}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
        <span className="text-4xl">{getContentIcon(item.content_type)}</span>
      </div>
    );
  };

  if (!isOpen || !user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fullscreen Modal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 via-blue-900/30 to-gray-900"
          >
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-semibold text-white">Profile</h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            {/* Scrollable Content */}
            <div className="h-full overflow-y-auto pb-20">
              {/* User Info Section */}
              <div className="relative">
                {/* Cover Background */}
                <div className="h-48 bg-gradient-to-br from-purple-600/40 to-pink-600/40 relative overflow-hidden">
                  {user.cover_url && (
                    <img
                      src={user.cover_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>

                {/* User Details */}
                <div className="px-6 -mt-8 relative z-10">
                  <div className="flex items-end gap-4 mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-black/50 backdrop-blur-md border-2 border-white/20 overflow-hidden flex items-center justify-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-white">
                          {getInitials(user.full_name)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-2xl font-bold text-white">{user.full_name}</h2>
                        {user.is_verified && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-gray-300">@{user.username}</p>
                    </div>
                  </div>

                  {/* Tagline */}
                  {user.tagline && (
                    <p className="text-gray-300 mb-4 italic">"{user.tagline}"</p>
                  )}

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
                    {user.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                        {user.is_remote && <span className="text-cyan-400">• Remote</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-xl"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </div>
              </div>

              {/* Tags Section */}
              <div className="px-6 space-y-6">
                {user.roles && user.roles.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Creator Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <Badge key={role} className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.skills && user.skills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.skills.map((skill) => (
                        <Badge key={skill} className="bg-green-500/20 text-green-300 border-green-500/30">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.looking_for && user.looking_for.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Looking to Collaborate With</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.looking_for.map((item) => (
                        <Badge key={item} className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.vibe_words && user.vibe_words.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Creative Vibes</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.vibe_words.map((word) => (
                        <Badge key={word} className="bg-pink-500/20 text-pink-300 border-pink-500/30">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="px-6 mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Content ({userContent?.length || 0})
                  </h3>
                  <div className="flex bg-black/30 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'grid' ? 'bg-purple-600/50 text-white' : 'text-gray-400'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === 'list' ? 'bg-purple-600/50 text-white' : 'text-gray-400'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {contentLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : !userContent || userContent.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📸</div>
                    <h4 className="text-lg font-semibold text-white mb-2">No content yet</h4>
                    <p className="text-gray-400">This creator hasn't shared any content yet.</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {userContent.map((item, index) => (
                      <div
                        key={item.id}
                        className="relative aspect-square bg-black/20 rounded-xl overflow-hidden cursor-pointer group"
                        onClick={() => handleContentClick(item, index)}
                      >
                        {renderContentThumbnail(item)}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl mb-1">{getContentIcon(item.content_type)}</div>
                            <p className="text-xs font-medium px-2 line-clamp-2">{item.title}</p>
                          </div>
                        </div>

                        {/* Stats overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
                          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
                            <Heart className="w-3 h-3" />
                            <span>{item.like_count}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-black/50 rounded-full px-2 py-1">
                            <Eye className="w-3 h-3" />
                            <span>{item.view_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {userContent.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => handleContentClick(item, index)}
                      >
                        <div className="w-16 h-16 bg-black/20 rounded-lg overflow-hidden flex-shrink-0">
                          {renderContentThumbnail(item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{item.title}</h4>
                          <p className="text-sm text-gray-300 truncate">{item.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>{getContentIcon(item.content_type)} {item.content_type}</span>
                            <span>{formatDate(item.created_at)}</span>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {item.like_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {item.view_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Content Lightbox */}
          <AnimatePresence>
            {selectedContent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center"
                onClick={() => setSelectedContent(null)}
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedContent(null)}
                  className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Navigation buttons */}
                {currentContentIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateContent('prev');
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                {userContent && currentContentIndex < userContent.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateContent('next');
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}

                {/* Content Display */}
                <div
                  className="w-full h-full flex items-center justify-center p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectedContent.content_type === 'video' ? (
                    <video
                      src={selectedContent.external_url}
                      controls
                      className="max-w-full max-h-full rounded-lg"
                      autoPlay
                    />
                  ) : (
                    <img
                      src={selectedContent.thumbnail_url || selectedContent.external_url}
                      alt={selectedContent.title}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  )}
                </div>

                {/* Content Info */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <h3 className="text-white text-lg font-medium mb-2">{selectedContent.title}</h3>
                  {selectedContent.description && (
                    <p className="text-gray-300 text-sm mb-2">{selectedContent.description}</p>
                  )}
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {selectedContent.like_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {selectedContent.view_count}
                    </span>
                    <span>
                      {currentContentIndex + 1} of {userContent?.length || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}