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
  Link as LinkIcon
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { getInitials } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useUserContent, type UserContent } from '../hooks/useUserContent';
import { CreateContentModal } from './CreateContentModal';

interface ContentTabProps {
  userId?: string;
  onContentCreated?: () => void;
  className?: string;
}

const ContentTab = ({ userId, onContentCreated, className = '' }: ContentTabProps) => {
  const { user } = useAuth();
  const { content, loading, error, refresh, likeContent, unlikeContent } = useUserContent(userId || user?.id);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    contentType: null as 'video' | 'audio' | 'image' | 'article' | null,
    sortBy: 'newest' as 'newest' | 'most_viewed' | 'most_liked' | 'most_commented',
  });
  const [likedContents, setLikedContents] = useState<Set<string>>(new Set());

  const filteredContent = useMemo(() => {
    return content.filter(item => {
      // Filter by search query
      const matchesSearch = !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by content type
      const matchesContentType = !filters.contentType || 
        item.content_type === filters.contentType;
      
      return matchesSearch && matchesContentType;
    });
  }, [content, searchQuery, filters]);

  const sortedContent = useMemo(() => {
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
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
  }, [filteredContent, filters.sortBy]);

  const handleLike = async (contentId: string) => {
    if (!user) return;
    
    const isLiked = likedContents.has(contentId);
    
    try {
      if (isLiked) {
        await unlikeContent(contentId);
        setLikedContents(prev => {
          const newSet = new Set(prev);
          newSet.delete(contentId);
          return newSet;
        });
      } else {
        await likeContent(contentId);
        setLikedContents(prev => new Set(prev).add(contentId));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleExpand = (contentId: string) => {
    setExpandedContent(prev => prev === contentId ? null : contentId);
  };

  if (loading && content.length === 0) {
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
            {sortedContent.map((item) => (
              <ContentCard
                key={item.id}
                content={item}
                isExpanded={expandedContent === item.id}
                isOwnContent={item.creator_id === user?.id}
                isLiked={likedContents.has(item.id) || false}
                onToggleExpand={() => toggleExpand(item.id)}
                onLike={handleLike}
                onComment={() => setExpandedContent(prev => prev === item.id ? null : item.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <CreateContentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refresh();
          onContentCreated?.();
        }}
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
  onLike: (contentId: string) => void;
  onComment: () => void;
}

const ContentCard = ({
  content,
  isExpanded,
  isOwnContent,
  isLiked,
  onToggleExpand,
  onLike,
  onComment,
}: ContentCardProps) => {
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const renderMedia = () => {
    // First check if we have media_urls
    if (!content.media_urls?.length) {
      // If no media but we have an external URL, show a link
      if (content.external_url) {
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

    // Get the first media URL
    const mediaUrl = content.media_urls[0];

    // Show loading state
    if (mediaLoading) {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-800/50 rounded-lg">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      );
    }

    // Show error state
    if (mediaError) {
      return (
        <div className="flex items-center justify-center h-48 bg-gray-800/50 rounded-lg text-red-400">
          {mediaError}
        </div>
      );
    }

    // Render based on content type
    switch (content.content_type) {
      case 'image':
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <img 
              src={mediaUrl} 
              alt={content.title}
              className="w-full max-h-[500px] object-contain rounded-lg bg-black"
              onError={() => setMediaError('Failed to load image')}
              onLoadStart={() => setMediaLoading(true)}
              onLoad={() => setMediaLoading(false)}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="mt-3 rounded-lg overflow-hidden">
            <video 
              src={mediaUrl} 
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
      
      case 'audio':
        return (
          <div className="mt-3 p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center space-x-4">
              <Music className="h-12 w-12 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">{content.title}</p>
                <audio 
                  src={mediaUrl} 
                  controls 
                  className="w-full mt-2"
                  onError={() => setMediaError('Failed to load audio')}
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <a 
            href={mediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center p-6 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <FileText className="h-12 w-12 mr-3 text-gray-400" />
            <span>View {content.content_type || 'Content'}</span>
          </a>
        );
    }
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
            <div className="flex items-center space-x-3">
              {content.creator_avatar ? (
                <img 
                  src={content.creator_avatar} 
                  alt={content.creator_username || 'User'}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
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
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {content.content_type?.charAt(0).toUpperCase() + content.content_type?.slice(1) || 'Content'}
              </Badge>
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
          
          <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <button 
                className="flex items-center space-x-1 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(content.id);
                }}
              >
                {isLiked ? (
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                ) : (
                  <Heart className="h-4 w-4" />
                )}
                <span>{content.like_count || 0}</span>
              </button>
              
              <button 
                className="flex items-center space-x-1 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onComment();
                }}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{content.comment_count || 0}</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{content.view_count || 0}</span>
              </div>
            </div>
            
            {content.external_url && (
              <a 
                href={content.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-white flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                Open
              </a>
            )}
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10"
            >
              <div className="p-4">
                <p className="text-sm text-gray-400">Comments coming soon</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
};

export default ContentTab;
