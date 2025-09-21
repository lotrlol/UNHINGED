import { useState, useEffect } from 'react';
import { X, MessageCircle, Grid3X3, List, Play, Heart, Eye, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { Button } from './ui/Button';
import { getInitials } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useFollows } from '../hooks/useFollows';
import { useAuth } from '../hooks/useAuth';
import { useUserContent } from '../hooks/useUserContent';
import { SendFriendRequestModal } from './SendFriendRequestModal';
import { Badge } from './ui/Badge';

interface ContentItem {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  content_type: 'video' | 'audio' | 'image' | 'article';
  media_urls: string[];
  thumbnail_url: string | null;
  external_url: string | null;
  tags: string[];
  is_featured: boolean;
  is_nsfw: boolean;
  created_at: string;
  updated_at: string;
  creator_username: string | null;
  creator_avatar: string | null;
  creator_roles: string[] | null;
  like_count: number;
  comment_count: number;
  view_count: number;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    full_name: string;
    roles: string[];
    skills?: string[];
    looking_for?: string[];
    tagline: string | null;
    vibe_words?: string[];
    location: string | null;
    is_remote?: boolean;
    avatar_url: string | null;
    cover_url?: string | null;
    banner_url?: string | null;
    is_verified: boolean;
    created_at: string;
  } | null;
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [showFriendRequestModal, setShowFriendRequestModal] = useState(false);
  
  // Check if the current user is viewing their own profile
  const isCurrentUser = currentUser?.id === user?.id;
  
  // Handle friend request modal close
  const handleFriendRequestClose = (e: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent event bubbling to parent modal
    setShowFriendRequestModal(false);
  };
  
  // Fetch user content
  const { content: userContent, loading: contentLoading } = useUserContent(user?.id);
  
  // Ensure we have a valid user ID before making the request
  useEffect(() => {
    if (user?.id) {
      console.log('Fetching content for user:', user.id);
    }
  }, [user?.id]);
  
  // Fetch follow data
  const { stats, actionLoading, toggleFollow } = useFollows(user?.id);

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

  const handleContentClick = (content: ContentItem, index: number) => {
    setSelectedContent(content);
    setCurrentContentIndex(index);
  };

  const navigateContent = (direction: 'prev' | 'next') => {
    if (!userContent || !selectedContent) return;
    
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

  const getContentIcon = (type: 'video' | 'audio' | 'image' | 'article' | string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'image': return '📸';
      case 'article': return '📝';
      default: return '📄';
    }
  };

  const renderContentThumbnail = (item: ContentItem) => {
    const externalUrl = item.external_url || (item.media_urls?.[0] || null);
    const thumbnailUrl = item.thumbnail_url || externalUrl;
    
    if (item.content_type === 'video' && externalUrl) {
      return (
        <div className="relative w-full h-full">
          <video
            src={externalUrl}
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
    
    if (thumbnailUrl) {
      return (
        <img
          src={thumbnailUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      );
    }
    
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 flex items-center justify-center">
        <span className="text-4xl">{getContentIcon(item.content_type)}</span>
      </div>
    )
  }
  
  const renderModal = () => {
    if (user && showFriendRequestModal) {
      return (
        <SendFriendRequestModal
          isOpen={showFriendRequestModal}
          onClose={handleFriendRequestClose}
          user={{
            id: user.id,
            username: user.username || '',
            full_name: user.full_name,
            roles: user.roles || [],
            avatar_url: user.avatar_url,
            is_verified: user.is_verified || false
          }}
          onSuccess={() => {
            // Optional: Handle success if needed
          }}
        />
      );
    }
    return null;
  };

  if (!isOpen || !user) return null;

  return (
    <>
      {/* Friend Request Modal - Higher z-index than profile modal */}
      <div className="relative z-[2000]">
        {renderModal()}
      </div>
      
      {/* Profile Modal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1000] bg-gradient-to-br from-gray-900 via-white-900/100 to-gray-900 overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Profile</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* User Info Section */}
          <div className="relative">
            {/* Cover Background */}
            <div className="h-48 relative overflow-hidden rounded-xl mb-6">
              {(user.cover_url || user.banner_url) ? (
                <img
                  src={user.cover_url || user.banner_url || ''}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-pink-600/40" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            {/* User Details */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden -mt-12 relative z-10 bg-gray-800">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl font-bold">
                    {getInitials(user.full_name)}
                  </div>
                )}
              </div>
              
              <h2 className="text-2xl font-bold text-white mt-4">{user.full_name}</h2>
              {user.username && (
                <p className="text-gray-300">@{user.username}</p>
              )}
              {user.tagline && (
                <p className="text-gray-300 mt-2 max-w-md">{user.tagline}</p>
              )}
              
              <div className="flex gap-3 mt-4">
                {!isCurrentUser && (
                  <Button
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const { error } = await toggleFollow(user.id);
                        if (error) {
                          console.error('Error toggling follow:', error);
                        }
                      } catch (err) {
                        console.error('Error in follow handler:', err);
                      }
                    }}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-xl transition-all"
                    variant={stats?.is_following ? 'outline' : 'primary'}
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center">
                        <UserPlus className="w-4 h-4 mr-2" />
                        {stats?.is_following ? 'Following' : 'Follow'}
                      </span>
                    )}
                  </Button>
                )}
                
                {!isCurrentUser && (
                  <Button
                    onClick={() => setShowFriendRequestModal(true)}
                    className="flex-1 py-3 rounded-xl transition-all"
                    variant="primary"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-6 items-start">
              {user.roles && user.roles.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.skills && user.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <Badge key={skill} variant="default">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.looking_for && user.looking_for.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Looking For</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.looking_for.map((item) => (
                      <Badge key={item} variant="default" className="border">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.vibe_words && user.vibe_words.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Vibe</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.vibe_words.map((word) => (
                      <Badge key={word} variant="secondary" className="opacity-80">
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Content ({userContent?.length || 0})
                </h3>
                <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {contentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              ) : !userContent?.length ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No content available</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3">
                  {userContent.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => handleContentClick(item, index)}
                      className="aspect-square rounded-xl overflow-hidden bg-gray-800/50 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      {renderContentThumbnail(item)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {userContent.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => handleContentClick(item, index)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-700">
                        {renderContentThumbnail(item)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{item.title}</h4>
                        <p className="text-sm text-gray-400 truncate">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" />
                          {item.like_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {item.view_count || 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            className="fixed inset-0 z-[2000] bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedContent(null)}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedContent(null);
              }}
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

            {currentContentIndex < userContent.length - 1 && (
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

            {/* Content */}
            <div className="relative w-full h-full max-w-4xl mx-auto flex items-center justify-center p-4">
              {selectedContent.content_type === 'video' ? (
                <video
                  src={selectedContent.external_url}
                  className="max-h-[80vh] max-w-full rounded-lg"
                  controls
                  autoPlay
                  onClick={(e) => e.stopPropagation()}
                />
              ) : selectedContent.content_type === 'image' ? (
                <img
                  src={selectedContent.external_url || selectedContent.thumbnail_url || ''}
                  alt={selectedContent.title}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="bg-gray-800/50 p-6 rounded-xl max-w-2xl w-full">
                  <h3 className="text-2xl font-bold text-white mb-4">{selectedContent.title}</h3>
                  {selectedContent.description && (
                    <p className="text-gray-300 mb-6">{selectedContent.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{new Date(selectedContent.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {selectedContent.like_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {selectedContent.view_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content info */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-white flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {selectedContent.like_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {selectedContent.view_count || 0}
                </span>
                <span>
                  {currentContentIndex + 1} of {userContent?.length || 0}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friend Request Modal */}
      <SendFriendRequestModal
        isOpen={showFriendRequestModal}
        onClose={() => setShowFriendRequestModal(false)}
        user={user}
        onSuccess={() => {
          setShowFriendRequestModal(false);
        }}
      />
    </>
  );
}
