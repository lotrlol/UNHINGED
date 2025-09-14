import { useState, useRef, useEffect, useCallback } from 'react';
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
  creator_username?: string;
  creator_name?: string;
  creator_avatar?: string | null;
  creator_roles?: string[];
  creator_verified?: boolean;
}

// Import the useContent hook from the hooks directory
import { useContent } from '../hooks/useContent';
  const [content, setContent] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data - in a real app, this would be an API call
      const mockData: ContentPost[] = [
        {
          id: '1',
          creator: {
            id: 'user1',
            username: 'johndoe',
            name: 'John Doe',
            avatar: null,
            roles: ['user'],
            verified: true
          },
          title: 'Example Post',
          description: 'This is an example post',
          content_type: 'image',
          media: [{
            type: 'image',
            url: 'https://example.com/image.jpg',
            thumbnail: 'https://example.com/thumb.jpg',
            aspectRatio: 1.77
          }],
          platform: 'web',
          external_url: null,
          thumbnail_url: 'https://example.com/thumb.jpg',
          tags: ['example', 'test'],
          view_count: 100,
          like_count: 42,
          comment_count: 5,
          is_featured: false,
          is_liked: false,
          is_saved: false,
          created_at: new Date().toISOString(),
          updated_at: null,
          published_at: new Date().toISOString(),
          user_has_liked: false
        }
      ];
      
      // Apply filters
      let filteredData = [...mockData];
      if (filters.type) {
        filteredData = filteredData.filter(item => item.content_type === filters.type);
      }
      
      setContent(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load content'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const likeContent = useCallback(async (contentId: string) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setContent(prev => 
        prev.map(item => 
          item.id === contentId
            ? {
                ...item,
                like_count: item.user_has_liked ? item.like_count - 1 : item.like_count + 1,
                user_has_liked: !item.user_has_liked
              }
            : item
        )
      );
      
      return { error: null };
    } catch (err) {
      console.error('Failed to like content:', err);
      return { error: 'Failed to like content' };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    likeContent,
    refetch: fetchContent
  };
};
  view_count: number;
  like_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string | null;
  creator_username: string;
  creator_name: string;
  creator_avatar: string | null;
  creator_roles: string[];
  creator_verified: boolean;
  user_has_liked?: boolean;
}

const getContentEmoji = (type: ContentType): string => {
  switch (type) {
    case 'video': return '🎬';
    case 'audio': return '🎵';
    case 'article': return '📝';
    case 'image':
    default: return '📸';
  }
};

const getThumbnailUrl = (item: ContentPost): string | null => {
  // Handle Supabase storage paths vs full URLs
  if (item.thumbnail_url) {
    // If it's already a full URL, use it
    if (item.thumbnail_url.startsWith('http')) {
      return item.thumbnail_url;
    }
    // If it's a storage path, generate public URL
    if (item.thumbnail_url.includes('/')) {
      const { data } = supabase.storage
        .from('content-media')
        .getPublicUrl(item.thumbnail_url);
      return data.publicUrl;
    }
  }
  
  // Handle external_url for images
  if (item.content_type === 'image' && item.external_url) {
    // If it's already a full URL, use it
    if (item.external_url.startsWith('http')) {
      return item.external_url;
    }
    // If it's a storage path, generate public URL
    if (item.external_url.includes('/')) {
      const { data } = supabase.storage
        .from('content-media')
        .getPublicUrl(item.external_url);
      return data.publicUrl;
    }
  }
  
  return null;
};

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

interface FeedItemProps {
  item: ContentPost
  isActive: boolean
  onLike: (id: string) => Promise<{ error: string | null } | undefined>
  onUserClick: (userId: string) => void
}

// Using the useContent hook from the hooks directory
          thumbnail_url: 'https://example.com/thumb.jpg',
          tags: ['example', 'test'],
          view_count: 100,
          like_count: 42,
          comment_count: 5,
          is_featured: false,
          is_liked: false,
          is_saved: false,
          created_at: new Date().toISOString(),
          updated_at: null,
          published_at: new Date().toISOString(),
          user_has_liked: false
        }
      ];
      
      // Apply filters
      let filteredData = [...mockData];
      if (filters.type) {
        filteredData = filteredData.filter(item => item.content_type === filters.type);
      }
      
      setContent(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load content'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const likeContent = useCallback(async (contentId: string) => {
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setContent(prev => 
        prev.map(item => 
          item.id === contentId
            ? {
                ...item,
                like_count: item.user_has_liked ? item.like_count - 1 : item.like_count + 1,
                user_has_liked: !item.user_has_liked
              }
            : item
        )
      );
      
      return { error: null };
    } catch (err) {
      console.error('Failed to like content:', err);
      return { error: 'Failed to like content' };
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return {
    content,
    loading,
    error,
    likeContent,
    refetch: fetchContent
  };
};

const FeedItem: React.FC<FeedItemProps> = ({ item, isActive, onLike, onUserClick }) => {
  const [isMuted, setIsMuted] = useState(true)
  const [isLiked, setIsLiked] = useState(item.user_has_liked || false)
  const [likeCount, setLikeCount] = useState(item.like_count || 0)
{{ ... }}
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showControls, setShowControls] = useState(false)
  const controlsTimeout = useRef<NodeJS.Timeout>()
  // UI state (commented out until needed)
  // const [showFullDescription, setShowFullDescription] = useState(false)
  // const [showOptions, setShowOptions] = useState(false)
  // const optionsRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  // Media loading states (commented out until needed)
  // const [isImageLoaded, setIsImageLoaded] = useState(false)
  // const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const controls = useAnimation()
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  })

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current)
      }
    }
  }, [])

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

  const handleLike = async (contentId: string) => {
    if (!onLike) return;
    
    const newLikeStatus = !isLiked;
    
    try {
      setIsLiked(newLikeStatus);
      setLikeCount((prev: number) => newLikeStatus ? prev + 1 : Math.max(0, prev - 1));
      
      await onLike(contentId);
      
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(!newLikeStatus);
      setLikeCount((prev: number) => newLikeStatus ? Math.max(0, prev - 1) : prev + 1);
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const glassStyle: React.CSSProperties = {
    backdropFilter: 'blur(16px) saturate(180%)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    WebkitBackdropFilter: 'blur(12px)'
  }

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { 
          type: 'spring',
          stiffness: 100,
          damping: 15,
          delay: Math.random() * 0.2 // Stagger animations slightly
        }
      })
    }
  }, [inView, controls])

  return (
    <motion.div
      ref={ref}
      className={`relative w-full h-full rounded-3xl overflow-hidden ${
        isActive ? 'z-10' : 'z-0'
      } glass-card`}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={controls}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => {
        setIsHovering(true)
        if (item.content_type === 'video') {
          setShowControls(true)
          if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current)
          }
          controlsTimeout.current = setTimeout(() => {
            setShowControls(false)
          }, 3000)
        }
      }}
      onMouseLeave={() => {
        setIsHovering(false)
        if (item.content_type === 'video') {
          setShowControls(false)
          if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current)
          }
        }
      }}
      onMouseMove={() => {
        if (item.content_type === 'video' && !showControls) {
          setShowControls(true)
          if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current)
          }
          controlsTimeout.current = setTimeout(() => {
            setShowControls(false)
          }, 3000)
        }
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.2 }
      }}
    >
      <motion.div 
        className="absolute inset-0 z-10 pointer-events-none"
        initial={{ opacity: 0.3 }}
        animate={{
          opacity: isHovering ? 0.5 : 0.3,
          background: isHovering 
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' 
            : 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)',
        }}
        transition={{ duration: 0.3 }}
      />
      <motion.div 
        className="absolute top-4 left-4 z-10 flex items-center"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div
          className="glass-panel flex items-center space-x-2 px-3 py-1.5 rounded-xl backdrop-blur-lg cursor-pointer hover:bg-white/10 transition-all"
          onClick={() => onUserClick(item.creator_id)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          {item.creator_avatar ? (
            <motion.div 
              className="relative overflow-hidden rounded-full border-2 border-white/20"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <img
                src={item.creator_avatar}
                alt={item.creator_username}
                className="w-8 h-8 object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.onerror = null
                  target.src =
                    'https://ui-avatars.com/api/?name=' +
                    encodeURIComponent(item.creator_name || '') +
                    '&background=4f46e5&color=fff&size=128'
                }}
              />
            </motion.div>
          ) : (
            <motion.div 
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium text-xs"
              whileHover={{ rotate: 5, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              {getInitials(item.creator_name || item.creator_username)}
            </motion.div>
          )}
          <div className="flex flex-col ml-1">
            <div className="flex items-center">
              <span className="font-medium text-sm text-foreground">{item.creator_username}</span>
              {item.creator_verified && (
                <motion.span 
                  className="ml-1 text-primary"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatType: 'reverse' 
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.5 12l-3.5-3.5 1.5-1.5 5 5-5 5-1.5-1.5 3.5-3.5z" />
                    <path d="M12 23.5l-3.5-3.5-1.5 1.5 5 5 5-5-1.5-1.5-3.5 3.5z" />
                    <path d="M0.5 12l3.5 3.5-1.5 1.5-5-5 5-5 1.5 1.5-3.5 3.5z" />
                    <path d="M12 0.5l3.5 3.5 1.5-1.5-5-5-5 5 1.5 1.5 3.5-3.5z" />
                  </svg>
                </motion.span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(item.created_at)} • {item.content_type}
            </span>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showControls && (
          <motion.div 
            className="absolute inset-0 z-20 p-6 flex flex-col justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-4 rounded-2xl" style={glassStyle}>
              <button 
                onClick={() => onUserClick(item.creator_id)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(item.creator_username || 'U')}
                </div>
                <span className="font-medium text-sm">@{item.creator_username || 'user'}</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl mb-6" style={glassStyle}>
              <p className="text-sm text-white/90 mb-3 line-clamp-2">
                {item.description || 'Check out this amazing content!'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center space-x-4">
                  <span>{formatDate(item.created_at)}</span>
                  <span>•</span>
                  <div className="flex items-center">
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    <span>0</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleLike(item.id)}
                  className="flex items-center space-x-1 group"
                >
                  {isLiked ? (
                    <HeartFilled className="w-5 h-5 text-rose-500 fill-rose-500" />
                  ) : (
                    <HeartOutline className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                  <span>{likeCount}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!showControls && (
          <motion.div 
            className="absolute right-4 bottom-24 flex flex-col items-center space-y-4 z-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div 
              className="flex flex-col items-center"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <button 
                onClick={() => handleLike(item.id)}
                className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm transition-all"
                style={{
                  background: isLiked 
                    ? 'rgba(236, 72, 153, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)'
                }}
              >
                {isLiked ? (
                  <HeartFilled className="w-6 h-6 text-rose-500 fill-rose-500" />
                ) : (
                  <HeartOutline className="w-6 h-6 text-white" />
                )}
              </button>
              <span className="text-xs mt-1.5 text-white/80 font-medium">
                {likeCount}
              </span>
            </motion.div>

            <motion.div 
              className="flex flex-col items-center"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <button 
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle comment
                }}
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </button>
              <span className="text-xs mt-1.5 text-white/60">0</span>
            </motion.div>

            <motion.div 
              className="flex flex-col items-center"
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              <button 
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle share
                }}
              >
                <Share2 className="w-6 h-6 text-white" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute Toggle Button */}
      <motion.button 
        onClick={(e) => {
          e.stopPropagation()
          toggleMute()
        }}
        className="absolute right-4 top-4 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
        whileTap={{ scale: 0.9 }}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
        <motion.div 
          className="h-full bg-white"
          initial={{ width: '0%' }}
          animate={{ width: isPlaying ? '100%' : '0%' }}
          transition={{ duration: 15, ease: 'linear' }}
        />
      </div>
    );
  };

// Using the useContent hook defined above

const ContentTab: React.FC = () => {
  // Initialize state
  const [activeTab, setActiveTab] = useState('forYou');
  const [activeFilter] = useState<ContentFilters>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [hasMore] = useState(true);
  
  // Use the mock useContent hook
  const { content, loading } = useContent(activeFilter);


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
        
        {showCreateModal && (
          <CreateContentModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onContentCreated={async () => {
              setShowCreateModal(false);
              // Refresh the content after successful creation
              await refetch();
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Main Feed */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory scrollbar-hide">
        <AnimatePresence>
          {content.map((item) => (
            <FeedItem
              key={item.id}
              item={item}
              isActive={false}
              onLike={likeContent}
              onUserClick={() => setSelectedUser(item.creator_id)}
            />
          ))}
        </AnimatePresence>

        {/* Load more indicator */}
        {hasMore && !loading && content.length > 0 && (
          <div className="flex justify-center py-6">
            <button
              onClick={() => {
                // Implement load more logic here if needed
                // For now, just disable the button
                setHasMore(false)
              }}
              className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>

      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {[
            { id: 'forYou', label: 'For You' },
            { id: 'following', label: 'Following' },
            { id: 'trending', label: 'Trending' },
            { id: 'music', label: 'Music' },
            { id: 'gaming', label: 'Gaming' },
            { id: 'news', label: 'News' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-white hover:bg-white/10'
              }`}
              onClick={() => {
                setActiveTab(tab.id)
                if (tab.id === 'forYou') {
                  setActiveFilter({})
                } else if (tab.id === 'following') {
                  // Following filter logic can be implemented here
                  setActiveFilter({ creator_id: 'following' })
                } else {
                  // For other tabs, you can add specific filters
                  setActiveFilter({ tags: [tab.id] })
                }
              }}
            >
              {tab.label}
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
            isOpen={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            user={{
              id: selectedUser,
              username: '',
              full_name: '',
              roles: [],
              skills: [],
              looking_for: [],
              tagline: null,
              vibe_words: [],
              avatar_url: null,
              is_verified: false,
              location: null,
              created_at: new Date().toISOString()
            }}
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