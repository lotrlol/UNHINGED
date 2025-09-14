import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  MessageSquare, 
  Share2, 
  Volume2, 
  VolumeX, 
  MoreHorizontal, 
  Plus, 
  Heart as HeartOutline, 
  Heart as HeartFilled 
} from 'lucide-react';
import { formatDate, getInitials } from '../lib/utils';
import { CreateContentModal } from './CreateContentModal';
import { UserProfileModal } from './UserProfileModal';
import { supabase } from '../lib/supabase';
import { useInView } from 'react-intersection-observer';
import { useContent } from '../hooks/useContent';

// Content type definitions
const CONTENT_TYPES = {
  video: { label: 'Video' },
  audio: { label: 'Audio' },
  image: { label: 'Image' },
  article: { label: 'Article' }
} as const;

type ContentType = keyof typeof CONTENT_TYPES;

interface ContentFilters {
  type?: ContentType;
  sort?: 'newest' | 'popular' | 'trending';
  limit?: number;
  offset?: number;
}

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  roles: string[];
  verified: boolean;
}

interface MediaContent {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  aspectRatio?: number;
}

interface ContentPost {
  id: string;
  creator: User;
  title: string;
  description: string | null;
  content_type: ContentType;
  media: MediaContent[];
  platform: string | null;
  external_url: string | null;
  thumbnail_url: string | null;
  tags: string[];
  view_count: number;
  like_count: number;
  comment_count: number;
  is_featured: boolean;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  updated_at: string | null;
  published_at: string | null;
  user_has_liked?: boolean;
}

interface FeedItemProps {
  item: ContentPost;
  isActive: boolean;
  onLike: (id: string) => Promise<{ error: string | null } | undefined>;
  onUserClick: (userId: string) => void;
}

const ContentTab = () => {
  const [content, setContent] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  const { content: fetchedContent, loading: isLoading, error, likeContent, refetch } = useContent();

  useEffect(() => {
    if (fetchedContent) {
      setContent(fetchedContent);
    }
  }, [fetchedContent]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const getContentEmoji = (type: ContentType): string => {
    switch (type) {
      case 'video': return '🎥';
      case 'audio': return '🎧';
      case 'image': return '🖼️';
      case 'article': return '📝';
      default: return '📄';
    }
  };

  const getThumbnailUrl = (item: ContentPost): string | null => {
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.media && item.media.length > 0) {
      const media = item.media[0];
      return media.thumbnail || (media.type === 'image' ? media.url : null);
    }
    return null;
  };

  const handleLike = async (id: string) => {
    const result = await likeContent(id);
    if (result?.error) {
      console.error('Error liking content:', result.error);
    }
  };

  const handleUserClick = (userId: string) => {
    const user = content.find(item => item.creator.id === userId)?.creator;
    if (user) {
      setSelectedUser(user);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading content. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create Post
        </button>
      </div>

      <div className="space-y-6">
        {content.map((item) => (
          <div 
            key={item.id}
            className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div 
                  className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold cursor-pointer"
                  onClick={() => handleUserClick(item.creator.id)}
                >
                  {item.creator.avatar ? (
                    <img 
                      src={item.creator.avatar} 
                      alt={item.creator.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getInitials(item.creator.name)
                  )}
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <span 
                      className="font-medium text-white hover:underline cursor-pointer"
                      onClick={() => handleUserClick(item.creator.id)}
                    >
                      {item.creator.name}
                    </span>
                    {item.creator.verified && (
                      <svg className="w-4 h-4 ml-1 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDate(item.created_at)} · {getContentEmoji(item.content_type)} {CONTENT_TYPES[item.content_type].label}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
              
              {item.description && (
                <p className="text-gray-300 mb-4">{item.description}</p>
              )}

              {getThumbnailUrl(item) && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={getThumbnailUrl(item) || ''} 
                    alt={item.title}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-gray-400 text-sm">
                <div className="flex space-x-4">
                  <button 
                    onClick={() => handleLike(item.id)}
                    className={`flex items-center space-x-1 hover:text-pink-500 transition-colors ${
                      item.user_has_liked ? 'text-pink-500' : ''
                    }`}
                  >
                    {item.user_has_liked ? (
                      <HeartFilled className="h-5 w-5 fill-current" />
                    ) : (
                      <HeartOutline className="h-5 w-5" />
                    )}
                    <span>{item.like_count}</span>
                  </button>
                  
                  <button className="flex items-center space-x-1 hover:text-blue-400 transition-colors">
                    <MessageSquare className="h-5 w-5" />
                    <span>{item.comment_count}</span>
                  </button>
                  
                  <button className="hover:text-green-400 transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                    {item.view_count} views
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateContentModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          refetch();
          setShowCreateModal(false);
        }}
      />

      <UserProfileModal 
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
};

export default ContentTab;
