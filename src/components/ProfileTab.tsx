import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Grid3X3,
  List,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { useContent } from '../hooks/useContent';
import { AvatarUploader } from './AvatarUploader';
import { ProfileCard } from './ProfileCard';
import { supabase } from '../lib/supabase';

type ContentItem = {
  id: string;
  title: string;
  content_type: string;
  external_url: string | null;
  thumbnail_url?: string | null;
  // Add other necessary fields from your content items
};

const VideoPlayer: React.FC<{
  src: string | null;
  title: string;
  className?: string;
}> = ({
  src,
  title,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoadedData = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0.1; // Small offset to ensure we get a frame
    }
  };

  const handleSeeked = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setHasLoaded(true);
    }
  };

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div className={`relative w-full h-full ${className} overflow-hidden`}>
      {src && !hasError ? (
        <video
          ref={videoRef}
          src={src}
          className={`w-full h-full object-cover ${hasLoaded ? 'block' : 'hidden'}`}
          title={title}
          preload="metadata"
          playsInline
          muted
          onLoadedData={handleLoadedData}
          onSeeked={handleSeeked}
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/20">
          <span className="text-2xl">🎥</span>
        </div>
      )}
      {/* Show a loading indicator while the video loads */}
      {!hasLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      )}
    </div>
  );
};

type ViewMode = 'grid' | 'list';

type LightboxContent = {
  type: 'video' | 'image';
  url: string;
  title: string;
};

export function ProfileTab() {
  const { profile, loading, error, uploadFile } = useProfile();
  const [profileState, setProfileState] = useState(profile);
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setShowEditModal] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [lightboxContent, setLightboxContent] = useState<LightboxContent | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canSwipe, setCanSwipe] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);
  const [uploading, setUploading] = useState(false);

  // Sync local state with profile data
  useEffect(() => {
    if (profile) {
      console.log('Profile updated in ProfileTab:', profile);
      setProfileState(profile);
    }
  }, [profile]);

  // Fetch user's content
  const {
    content: userContent,
    loading: contentLoading,
    error: contentError,
    refetch: refetchContent,
  } = useContent(user?.id ? { creator_id: user.id } : { creator_id: '' });

  // Filter only media content for the lightbox
  const mediaContent = (userContent || []).filter((item: ContentItem): item is ContentItem & { content_type: 'video' | 'image' } => 
    (item.content_type === 'video' || item.content_type === 'image') && !!item.external_url
  );

  // Log content when it changes
  useEffect(() => {
    if (userContent && userContent.length > 0) {
      console.log('User content loaded:', JSON.parse(JSON.stringify(userContent)));
      
      // Log detailed info for each content item
      userContent.forEach((item: any) => {
        console.group(`Content Item: ${item.id} (${item.title})`);
        console.log('Full item:', item);
        console.log('Thumbnail URL:', item.thumbnail_url);
        console.log('Media URLs:', item.media_urls);
        console.log('External URL:', item.external_url);
        console.log('Generated Thumbnail:', getVideoThumbnail(item));
        console.groupEnd();
      });
    }
  }, [userContent]);

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'audio':
        return '🎧';
      case 'image':
        return '📸';
      case 'article':
        return '📝';
      default:
        return '📄';
    }
  };

  const getVideoThumbnail = (item: any) => {
    // For video content, we'll use the first frame as a thumbnail
    if (item.content_type === 'video' && item.external_url) {
      // If it's a Supabase storage URL, use the video URL directly
      // The browser will automatically extract the first frame
      if (item.external_url.includes('supabase.co/storage/')) {
        return item.external_url;
      }
      // For YouTube, use the YouTube thumbnail
      if (item.external_url.match(/youtube\.com|youtu\.be/)) {
        const videoId = item.external_url.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        )?.[1];
        
        if (videoId) {
          return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }
      }
    }

    // For images, use the external URL or thumbnail URL
    if (item.content_type === 'image' && item.external_url) {
      return item.external_url;
    }
    if (item.thumbnail_url) {
      return item.thumbnail_url;
    }

    // Fallback to content type specific placeholders
    switch (item.content_type) {
      case 'video':
        return 'https://placehold.co/600x400/000000/ffffff?text=Video+Thumbnail';
      case 'image':
        return 'https://placehold.co/600x400/000000/ffffff?text=Image';
      case 'audio':
        return 'https://placehold.co/600x400/000000/ffffff?text=Audio';
      default:
        return 'https://placehold.co/600x400/000000/ffffff?text=Content';
    }
  };

  const handleContentClick = (item: any, index: number) => {
    if (item.content_type === 'video' || item.content_type === 'image') {
      const mediaIndex = mediaContent.findIndex(media => media.id === item.id);
      setCurrentIndex(mediaIndex !== -1 ? mediaIndex : 0);
      setLightboxContent({
        type: item.content_type as 'video' | 'image',
        url: item.external_url || '',
        title: item.title || 'Media'
      });
    } else {
      setSelectedContentId((prev: string | null) => (prev === item.id ? null : item.id));
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    if (!canSwipe) return;
    
    if (direction === 'next' && currentIndex < mediaContent.length - 1) {
      const newIndex = currentIndex + 1;
      const item = mediaContent[newIndex];
      setCurrentIndex(newIndex);
      setLightboxContent({
        type: item.content_type as 'video' | 'image',
        url: item.external_url || '',
        title: item.title || 'Media'
      });
    } else if (direction === 'prev' && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const item = mediaContent[newIndex];
      setCurrentIndex(newIndex);
      setLightboxContent({
        type: item.content_type as 'video' | 'image',
        url: item.external_url || '',
        title: item.title || 'Media'
      });
    }
    setCanSwipe(false);
    setTimeout(() => setCanSwipe(true), 500);
  };
  
  // Handle swipe gestures
  const handleSwipeStart = (e: React.TouchEvent | React.MouseEvent) => {
    setSwiping(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setXY([clientX, clientY]);
  };

  const handleSwipeMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swiping) return;
    e.preventDefault();
  };

  const handleSwipeEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!swiping) return;
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    const deltaX = clientX - x;
    const deltaY = clientY - y;
    
    // Only consider it a horizontal swipe if the horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 50) {
        navigate('prev');
      } else if (deltaX < -50) {
        navigate('next');
      }
    }
    
    setSwiping(false);
  };

  const closeLightbox = () => {
    setLightboxContent(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateContent = () => setShowCreateModal(true);

  const handleContentCreated = () => {
    setShowCreateModal(false);
    refetchContent();
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      console.log('Manually fetching profile for user:', user.id);
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      if (profileData) {
        console.log('Fetched profile data:', profileData);
        setProfileState(profileData);
      } else {
        console.log('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleBannerChange = async (file: File) => {
    if (!user) return;
    
    try {
      setUploading(true);
      const { data: bannerUrl, error } = await uploadFile(file, 'banner');
      
      if (error) {
        toast.error('Failed to upload banner');
        console.error('Banner upload error:', error);
        return;
      }
      
      // Update local state with the new banner URL
      if (bannerUrl && profileState) {
        setProfileState({
          ...profileState,
          banner_url: bannerUrl,
          banner_path: bannerUrl // This will be updated when fetchProfile completes
        });
      }
      
      // Refresh profile data to ensure we have the latest from the database
      await fetchProfile();
      toast.success('Banner updated successfully');
    } catch (error) {
      console.error('Error in handleBannerChange:', error);
      toast.error('An error occurred while updating the banner');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!user) return;
    
    try {
      setUploading(true);
      const { data: avatarUrl, error } = await uploadFile(file, 'avatar');
      
      if (error) {
        toast.error('Failed to upload avatar');
        console.error('Avatar upload error:', error);
        return;
      }
      
      // Update local state with the new avatar URL
      if (avatarUrl && profileState) {
        setProfileState({
          ...profileState,
          avatar_url: avatarUrl,
          avatar_path: avatarUrl // This will be updated when fetchProfile completes
        });
      }
      
      // Refresh profile data to ensure we have the latest from the database
      await fetchProfile();
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error in handleAvatarChange:', error);
      toast.error('An error occurred while updating the avatar');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-700/50 rounded-2xl" />
            <div className="h-4 bg-gray-700/50 rounded w-3/4" />
            <div className="h-4 bg-gray-700/50 rounded w-1/2" />
          </div>
        </GlassCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error loading profile</h3>
          <p className="text-gray-300 mb-6">{error instanceof Error ? error.message : String(error)}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            Try Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-xl font-semibold text-white mb-2">Complete your profile</h3>
          <p className="text-gray-300 mb-6">Set up your creator profile to start collaborating</p>
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            onClick={() => window.location.reload()}
          >
            Complete Profile
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="profile-tab-container">
      <div className="relative p-4 pb-24">
        {/* Background blobs */}
        <motion.div
          className="absolute -top-16 -left-16 w-80 h-80 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-full blur-3xl opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-full blur-3xl opacity-20"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />
      
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6 }} 
          className="relative mb-8"
        >
          <ProfileCard
            username={profileState?.username || ''}
            fullName={profileState?.full_name}
            avatarUrl={profileState?.avatar_url as string}
            bannerUrl={(profileState?.banner_url || profileState?.cover_url) as string}
            location={profileState?.location || undefined}
            bio={profileState?.tagline || undefined}
            stats={{
              posts: 0,
              followers: 0,
              following: 0
            }}
            onEditProfile={() => setShowEditModal(true)}
            onBannerChange={handleBannerChange}
            onAvatarChange={handleAvatarChange}
            className="w-full"
          />
      </motion.div>

      <div className="relative -mt-16 mb-8">
        <div className="flex items-end space-x-4">
          <div className="relative">
            
            </div>
          </div>

          

          
        </div>
      </div>
      
      <div className="relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 relative z-10"
        >
          {/* Content section */}
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">My Content</h3>
              <div className="flex items-center gap-3">
                <div className="flex bg-black/40 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List size={18} />
                  </button>
                </div>
                <Button
                  onClick={handleCreateContent}
                  variant="ghost"
                  className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white"
                >
                  <Plus size={16} className="mr-2" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
      {lightboxContent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxContent(null)}
        >
          <div className="relative w-full max-w-4xl h-[80vh]">
            {/* Close Button */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxContent(null);
              }}
              className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-20"
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate('next');
              }}
              className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-20"
              aria-label="Next"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            
            <div 
              className="relative w-full h-full flex items-center justify-center" 
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleSwipeStart}
              onTouchMove={handleSwipeMove}
              onTouchEnd={handleSwipeEnd}
              onMouseDown={handleSwipeStart}
              onMouseMove={handleSwipeMove}
              onMouseUp={handleSwipeEnd}
              onMouseLeave={handleSwipeEnd}
            >
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                  }
                }}
                exit={{ opacity: 0, x: -100 }}
                className="w-full h-full flex items-center justify-center"
              >
                {lightboxContent.type === 'video' ? (
                  <video
                    src={lightboxContent.url}
                    className="max-w-full max-h-full object-contain"
                    controls
                    autoPlay
                    loop
                    playsInline
                  />
                ) : (
                  <img 
                    src={lightboxContent.url} 
                    alt={lightboxContent.title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </motion.div>
              
              {lightboxContent.title && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {lightboxContent.title}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
      </div>
    </div>
  );
}
