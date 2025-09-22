import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Check,
  Loader2,
  Heart,
  HeartOff,
  Search,
  Filter,
  Plus,
  Eye,
  Image as ImageIcon,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  MessageCircle
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Button } from './ui/Button';
import { getInitials, processUserUrls } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserContent, type UserContent } from '../hooks/useUserContent';
import { useContentComments } from '../hooks/useContentComments';
import { supabase } from '../lib/supabase';
import { CreateContentModal } from './CreateContentModal';
import { UserProfileModal } from './UserProfileModal.clean';

interface ContentTabProps {
  userId?: string;
  onContentCreated?: () => void;
  className?: string;
}

const ContentTab = ({ userId, onContentCreated, className = '' }: ContentTabProps) => {
  const { user } = useAuth();
  const { content, loading, error, refresh, likeContent, unlikeContent } = useUserContent(userId || user?.id);

  // Debug logging
  useEffect(() => {
    console.log('ContentTab - content:', content);
    console.log('ContentTab - loading:', loading);
    console.log('ContentTab - error:', error);
    console.log('ContentTab - userId:', userId);
    console.log('ContentTab - user?.id:', user?.id);
  }, [content, loading, error, userId, user?.id]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({});
  const [expandedContentId, setExpandedContentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    contentType: null as 'video' | 'audio' | 'image' | 'article' | null,
    sortBy: 'newest' as 'newest' | 'most_viewed' | 'most_liked' | 'most_commented',
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch initial like status for content
  useEffect(() => {
    const fetchLikeStatus = async () => {
      if (!user?.id || !content.length) return;
      
      try {
        const { data: likes, error } = await supabase
          .from('content_likes')
          .select('content_id')
          .in('content_id', content.map(c => c.id))
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        const likedContentIds = new Set(likes.map(like => like.content_id));
        const initialLikes: Record<string, boolean> = {};
        
        content.forEach(item => {
          initialLikes[item.id] = likedContentIds.has(item.id);
        });
        
        setIsLikedMap(initialLikes);
      } catch (err) {
        console.error('Error fetching like status:', err);
      }
    };
    
    fetchLikeStatus();
  }, [content, user?.id]);

  const handleProfileClick = async (user: any) => {
    // If user is just an ID, fetch the full user data
    if (typeof user === 'object' && user.id && Object.keys(user).length === 1) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Process URLs before setting the user
        setSelectedUser(processUserUrls(data));
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return;
      }
    } else {
      // Process URLs for the provided user object
      setSelectedUser(processUserUrls(user));
    }

    setShowProfileModal(true);
  };

  const filteredContent = useMemo(() => {
    if (!Array.isArray(content)) {
      console.error('Content is not an array:', content);
      return [];
    }
    
    return content.filter(item => {
      if (!item) return false;
      
      // Filter by search query
      const matchesSearch = !searchQuery ||
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by content type
      const matchesContentType = !filters.contentType ||
        item.content_type === filters.contentType;

      return matchesSearch && matchesContentType;
    });
  }, [content, searchQuery, filters]);

  const sortedContent = useMemo(() => {
    if (!Array.isArray(filteredContent)) {
      console.error('Filtered content is not an array:', filteredContent);
      return [];
    }
    
    const sorted = [...filteredContent];
    switch (filters.sortBy) {
      case 'most_viewed':
        return sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      case 'most_liked':
        return sorted.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      case 'most_commented':
        return sorted.sort((a, b) => (b.comment_count || 0) - (a.comment_count || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
    }
  }, [filteredContent, filters.sortBy]);

  const handleLike = async (contentId: string) => {
    try {
      const currentLikeState = isLikedMap[contentId] || false;
      
      // Only proceed if we have a user
      if (!user?.id) {
        console.log('User not logged in');
        return;
      }
      
      // Optimistically update the UI
      setIsLikedMap(prev => ({
        ...prev,
        [contentId]: !currentLikeState
      }));
      
      try {
        // Call the appropriate like/unlike function
        if (currentLikeState) {
          await unlikeContent(contentId);
        } else {
          await likeContent(contentId);
        }
        
        // Refresh content to ensure we have the latest like count
        refresh();
      } catch (error) {
        console.error('Error toggling like:', error);
        // Revert optimistic update on error
        setIsLikedMap(prev => ({
          ...prev,
          [contentId]: currentLikeState // Revert to original state
        }));
      }
    } catch (error) {
      console.error('Error in handleLike:', error);
    }
  };

  const toggleExpand = (contentId: string) => {
    setExpandedContentId(prev => prev === contentId ? null : contentId);
  };

  if (loading && (!content || content.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error loading content: {error}
      </div>
    );
  }

  // If content is not an array or empty, show a message
  if (!Array.isArray(content) || content.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">
          No content found. {(!userId || userId === user?.id) && 'Create the first post!'}
        </p>
        {(!userId || userId === user?.id) && (
          <Button 
            onClick={() => setShowCreateModal(true)} 
            className="mt-4"
          >
            Create Post
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search content..."
            className="w-full pl-10 pr-4 py-2 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          {!userId || userId === user?.id ? (
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Post
            </Button>
          ) : null}
        </div>
      </div>

      {showFilters && (
        <GlassCard className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sort By</label>
              <select
                className="w-full bg-white/5 border border-white/20 rounded-md p-2 text-sm"
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  sortBy: e.target.value as any
                }))}
              >
                <option value="newest">Newest</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_commented">Most Comments</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <select
                className="w-full bg-white/5 border border-white/20 rounded-md p-2 text-sm"
                value={filters.contentType || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  contentType: e.target.value ? e.target.value as any : null
                }))}
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="article">Articles</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        {sortedContent.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              {searchQuery || filters.contentType 
                ? 'No matching content found.' 
                : 'No content found. Create the first post!'}
            </p>
            {(!userId || userId === user?.id) && !searchQuery && !filters.contentType && (
              <Button 
                onClick={() => setShowCreateModal(true)} 
                className="mt-4"
              >
                Create Post
              </Button>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {sortedContent.map((item) => {
              if (!item || !item.id) {
                console.error('Invalid content item:', item);
                return null;
              }
              
              return (
                <ContentCard
                  key={item.id}
                  content={{
                    ...item,
                    // Ensure all required fields are present
                    title: item.title || 'Untitled',
                    description: item.description || null,
                    content_type: item.content_type || 'other',
                    media_urls: Array.isArray(item.media_urls) ? item.media_urls : [],
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    like_count: item.like_count || 0,
                    comment_count: item.comment_count || 0,
                    view_count: item.view_count || 0,
                    creator_username: item.creator_username || 'unknown',
                    creator_avatar: item.creator_avatar || null,
                    creator_roles: Array.isArray(item.creator_roles) ? item.creator_roles : [],
                    is_featured: Boolean(item.is_featured),
                    is_nsfw: Boolean(item.is_nsfw),
                    created_at: item.created_at || new Date().toISOString(),
                    updated_at: item.updated_at || null,
                  }}
                  isExpanded={expandedContentId === item.id}
                  isOwnContent={item.creator_id === user?.id}
                  isLiked={isLikedMap[item.id] || false}
                  onToggleExpand={() => toggleExpand(item.id)}
                  onLike={() => handleLike(item.id)}
                  onComment={() => setExpandedContentId(prev => prev === item.id ? null : item.id)}
                  onProfileClick={handleProfileClick}
                />
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onContentCreated={() => {
          refresh();
          onContentCreated?.();
        }}
      />

      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={selectedUser}
      />
    </div>
  );
};

// Content Card Component
interface ContentCardProps {
  content: UserContent;
  isExpanded: boolean;
  isOwnContent: boolean;
  isLiked: boolean;
  onToggleExpand: () => void;
  onLike: () => void;
  onComment: () => void;
  onProfileClick: (user: any) => void;
}

const ContentCard = ({
  content,
  isExpanded,
  isOwnContent,
  isLiked,
  onToggleExpand,
  onLike,
  onComment,
  onProfileClick,
}: ContentCardProps) => {
  const { user } = useAuth();
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const { comments, loading: commentsLoading, createComment, likeComment, fetchComments } = useContentComments(content.id);
  
  // Fetch comments when the comments section is expanded
  useEffect(() => {
    if (isExpanded) {
      console.log('Fetching comments for content', content.id);
      fetchComments().catch(err => {
        console.error('Error fetching comments:', err);
      });
    }
  }, [isExpanded, content.id, fetchComments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const { error } = await createComment(commentText);
    if (!error) {
      setCommentText('');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    await likeComment(commentId);
  };
  
  const handleUserClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation();
    onProfileClick({ id: userId });
  };

  // Early return if content is undefined or missing essential properties
  if (!content || !content.id || !content.title) {
    return null;
  }

  // Helper function to safely access content properties
  const safeGet = (prop: keyof UserContent) => content[prop] || '';

  const renderMedia = () => {
    // First check if we have media_urls
    if (!content.media_urls?.length) {
      // If no media but we have an external URL, show a link
      if (content.external_url) {
        // Check if the external URL is a media file (video, audio, image)
        const url = content.external_url.toLowerCase();
        const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.ogg') || url.includes('video');
        const isAudio = url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || url.includes('audio');
        const isImage = url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif') || url.includes('.webp') || url.includes('image');

        // If it's a media file, render it inline
        if (isVideo) {
          return (
            <div className="mt-3 rounded-lg overflow-hidden">
              <video
                src={content.external_url}
                controls
                className="w-full max-h-[500px] object-contain rounded-lg bg-black"
                onError={() => setMediaError('Failed to load video')}
                onLoadStart={() => setMediaLoading(true)}
                onLoadedData={() => setMediaLoading(false)}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          );
        }

        if (isAudio) {
          return (
            <div className="mt-3 p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Music className="h-12 w-12 text-gray-400" />
                <div className="flex-1">
                  <p className="font-medium">{content.title}</p>
                  <audio
                    src={content.external_url}
                    controls
                    className="w-full mt-2"
                    onError={() => setMediaError('Failed to load audio')}
                  />
                </div>
              </div>
            </div>
          );
        }

        if (isImage) {
          return (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img
                src={content.external_url}
                alt={content.title}
                className="w-full max-h-[500px] object-contain rounded-lg bg-black"
                onError={() => setMediaError('Failed to load image')}
                onLoadStart={() => setMediaLoading(true)}
                onLoad={() => setMediaLoading(false)}
              />
            </div>
          );
        }

        // If it's not a media file, show a link
        return (
          <a
            href={content.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center p-6 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-6 w-6 mr-2" />
            <span>View External Content</span>
          </a>
        );
      }
      return null;
    }

    // Handle media URLs if they exist
    return (
      <div className="mt-3">
        {content.media_urls.map((url, index) => {
          const isVideo = url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.webm') || url.toLowerCase().includes('.ogg') || url.toLowerCase().includes('video');
          const isAudio = url.toLowerCase().includes('.mp3') || url.toLowerCase().includes('.wav') || url.toLowerCase().includes('.m4a') || url.toLowerCase().includes('audio');
          const isImage = url.toLowerCase().includes('.jpg') || url.toLowerCase().includes('.jpeg') || url.toLowerCase().includes('.png') || url.toLowerCase().includes('.gif') || url.toLowerCase().includes('.webp') || url.toLowerCase().includes('image');

          if (isVideo) {
            return (
              <video
                key={index}
                src={url}
                controls
                className="w-full max-h-[500px] object-contain rounded-lg bg-black"
                onError={() => setMediaError(`Failed to load video ${index + 1}`)}
                onLoadStart={() => setMediaLoading(true)}
                onLoadedData={() => setMediaLoading(false)}
              >
                Your browser does not support the video tag.
              </video>
            );
          }

          if (isAudio) {
            return (
              <div key={index} className="mt-3 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Music className="h-12 w-12 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">{content.title}</p>
                    <audio
                      src={url}
                      controls
                      className="w-full mt-2"
                      onError={() => setMediaError(`Failed to load audio ${index + 1}`)}
                    />
                  </div>
                </div>
              </div>
            );
          }

          if (isImage) {
            return (
              <img
                key={index}
                src={url}
                alt={`${content.title} - Image ${index + 1}`}
                className="w-full max-h-[500px] object-contain rounded-lg bg-black"
                onError={() => setMediaError(`Failed to load image ${index + 1}`)}
                onLoadStart={() => setMediaLoading(true)}
                onLoad={() => setMediaLoading(false)}
              />
            );
          }

          // Default to link for unsupported media types
          return (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center p-6 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon className="h-6 w-6 mr-2" />
              <span>View Media {index + 1}</span>
            </a>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className="overflow-hidden">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onProfileClick({
                  id: content.creator_id,
                  username: content.creator_username,
                  full_name: content.creator_username,
                  avatar_url: content.creator_avatar,
                });
              }}
            >
              {content.creator_avatar && (
                <img
                  src={content.creator_avatar}
                  alt={content.creator_username || 'User'}
                  className="h-10 w-10 rounded-full object-cover"
                />
              )}
              {!content.creator_avatar && (
                <div className="h-10 w-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 font-medium">
                  {getInitials(content.creator_username || 'U')}
                </div>
              )}
              <div>
                <h3 className="font-medium">{content.creator_username || 'Anonymous'}</h3>
                <p className="text-xs text-gray-400">
                  {formatDate(content.created_at)}
                  {content.updated_at !== content.created_at && ' • Edited'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-lg font-semibold">{content.title}</h3>
            {content.description && (
              <>
                <p className="mt-1 text-gray-300 whitespace-pre-line">
                  {content.description.length > 200 && !isExpanded
                    ? `${content.description.substring(0, 200)}...`
                    : content.description}
                </p>

                {content.description.length > 200 && (
                  <button
                    className="mt-1 text-sm text-primary-400 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand();
                    }}
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </>
            )}
          </div>

          {renderMedia()}

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike();
              }}
              className="flex items-center space-x-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              {isLiked ? (
                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
              ) : (
                <Heart className="h-5 w-5" />
              )}
              <span className="text-sm">{content.like_count || 0}</span>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComment();
              }}
              className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">
                {content.comment_count || 0}
              </span>
            </button>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-white/10 mt-3 pt-3"
              >
                <div className="p-2">
                  <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-gray-800/50 border border-gray-700 rounded-full px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                        disabled={!user}
                      />
                      <button 
                        type="submit"
                        className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                        onClick={(e) => e.stopPropagation()}
                        disabled={!commentText.trim() || !user}
                      >
                        Post
                      </button>
                    </div>
                    {!user && (
                      <p className="text-xs text-gray-400 text-center">
                        Please sign in to comment
                      </p>
                    )}
                  </form>
                  
                  <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
                    {commentsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      </div>
                    ) : !comments || comments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="bg-gray-800/30 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            {comment.user.avatar_url ? (
                              <img
                                src={comment.user.avatar_url}
                                alt={comment.user.username}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-sm font-medium">
                                {comment.user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={(e) => handleUserClick(e, comment.user_id)}
                                  className="font-medium text-sm hover:underline"
                                >
                                  {comment.user.username}
                                </button>
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm mt-1">
                                {comment.content}
                              </p>
                              <div className="flex items-center mt-1 space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCommentLike(comment.id);
                                  }}
                                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  {comment.user_has_liked ? (
                                    <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                                  ) : (
                                    <Heart className="w-3.5 h-3.5" />
                                  )}
                                  <span>{comment.like_count || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ContentTab;
export { ContentCard };
