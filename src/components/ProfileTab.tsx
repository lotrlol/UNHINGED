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
import { useFollows } from '../hooks/useFollows';
import { toast } from 'sonner';
import { useContent } from '../hooks/useContent';
import { AvatarUploader } from './AvatarUploader';
import { ProfileCard } from './ProfileCard';
import { supabase } from '../lib/supabase';
import { CreateContentModal } from './CreateContentModal';
import { useProjects } from '../hooks/useProjects';

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
  const { stats: followStats } = useFollows();
  const [profileState, setProfileState] = useState(profile);
  const { user } = useAuth();
  const [contentViewMode, setContentViewMode] = useState<ViewMode>('grid');
  const [activeSection, setActiveSection] = useState<'content' | 'projects'>('content');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setShowEditModal] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [lightboxContent, setLightboxContent] = useState<LightboxContent | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canSwipe, setCanSwipe] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);
  const [uploading, setUploading] = useState(false);

  // Fetch user's projects
  const { projects: allProjects, loading: projectsLoading } = useProjects();
  const userProjects = allProjects.filter(project => project.creator_id === user?.id);

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

  // Update handleCreateContent to handle both content and projects
  const handleCreate = () => {
    if (activeSection === 'content') {
      setShowCreateModal(true);
    } else {
      // For projects, you could open a CreateProjectModal here
      // For now, we'll just show the content modal
      setShowCreateModal(true);
    }
  };

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
      
      // Force a complete profile refresh to get the new URLs
      setTimeout(async () => {
        await fetchProfile();
      }, 500);
      
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
      
      // Force a complete profile refresh to get the new URLs
      setTimeout(async () => {
        await fetchProfile();
      }, 500);
      
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
              posts: userContent?.length || 0,
              followers: followStats.followers_count,
              following: followStats.following_count
            }}
            onEditProfile={() => setShowEditModal(true)}
            onBannerChange={handleBannerChange}
            onAvatarChange={handleAvatarChange}
            className="w-full"
          />
        </motion.div>

        {/* Content section integrated with profile */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative z-10"
        >
          {/* Content header with view controls */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">My Content</h3>
            <div className="flex items-center gap-3">
              <div className="flex bg-black/40 rounded-lg p-1 backdrop-blur-sm border border-white/10">
                <button
                  onClick={() => setContentViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    contentViewMode === 'grid' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setContentViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    contentViewMode === 'list' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
              <Button
                onClick={handleCreateContent}
                variant="ghost"
                className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white backdrop-blur-sm border border-purple-500/20"
              >
                <Plus size={16} className="mr-2" />
                Create
              </Button>
            </div>
          </div>
        
          {/* Content Grid/List */}
          <div className="mb-8">
            {/* Section tabs */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex bg-black/40 rounded-xl p-1 backdrop-blur-sm border border-white/10">
                <button
                  onClick={() => setActiveSection('content')}
                  className={`px-6 py-2 rounded-lg transition-all text-sm font-medium ${
                    activeSection === 'content' 
                      ? 'bg-purple-600/50 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Content ({userContent.length})
                </button>
                <button
                  onClick={() => setActiveSection('projects')}
                  className={`px-6 py-2 rounded-lg transition-all text-sm font-medium ${
                    activeSection === 'projects' 
                      ? 'bg-purple-600/50 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Projects ({userProjects.length})
                </button>
              </div>
            </div>

            {/* Content header with view controls */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                {activeSection === 'content' ? 'My Content' : 'My Projects'}
              </h3>
              <div className="flex items-center gap-3">
                {activeSection === 'content' && (
                  <div className="flex bg-black/40 rounded-lg p-1 backdrop-blur-sm border border-white/10">
                    <button
                      onClick={() => setContentViewMode('grid')}
                      className={`p-2 rounded-md transition-all ${
                        contentViewMode === 'grid' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Grid3X3 size={18} />
                    </button>
                    <button
                      onClick={() => setContentViewMode('list')}
                      className={`p-2 rounded-md transition-all ${
                        contentViewMode === 'list' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>
                )}
                <Button
                  onClick={handleCreateContent}
                  variant="primary"
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {activeSection === 'content' ? 'Create' : 'New Project'}
                </Button>
              </div>
            </div>

            {(activeSection === 'content' ? contentLoading : projectsLoading) ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : (activeSection === 'content' ? contentError : false) ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-white mb-2">Error loading content</h3>
                <p className="text-gray-300">{contentError instanceof Error ? contentError.message : String(contentError)}</p>
              </div>
            ) : (activeSection === 'content' ? userContent.length === 0 : userProjects.length === 0) ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{activeSection === 'content' ? '📸' : '🚀'}</div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {activeSection === 'content' ? 'No content yet' : 'No projects yet'}
                </h3>
                <p className="text-gray-300 mb-6">
                  {activeSection === 'content' 
                    ? 'Share your first piece of content to showcase your work'
                    : 'Create your first collaboration project to start connecting with other creators'
                  }
                </p>
                <Button
                  onClick={handleCreate}
                  variant="primary"
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  {activeSection === 'content' ? 'Create Your First Post' : 'Create Your First Project'}
                </Button>
              </div>
            ) : (
              activeSection === 'content' ? (
                <div className={contentViewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-4'}>
                  {userContent.map((item, index) => {
                    const isSelected = selectedContentId === item.id;
                    const thumbnailUrl = item.content_type === 'video' ? getVideoThumbnail(item) : item.thumbnail_url;
                  
                    return contentViewMode === 'grid' ? (
                      /* Grid View */
                      <div
                        key={item.id}
                        className="relative aspect-square bg-black/20 rounded-lg overflow-hidden cursor-pointer group hover:scale-105 transition-transform backdrop-blur-sm border border-white/10"
                        onClick={() => handleContentClick(item, index)}
                      >
                        {item.content_type === 'video' ? (
                          <VideoPlayer
                            src={item.external_url}
                            title={item.title}
                            className="w-full h-full"
                          />
                        ) : thumbnailUrl ? (
                          <img
                            src={thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://placehold.co/400x400/1a1a1a/666666?text=' + encodeURIComponent(getContentIcon(item.content_type));
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/20 to-pink-600/20">
                            <span className="text-4xl">{getContentIcon(item.content_type)}</span>
                          </div>
                        )}
                      
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            <div className="text-2xl mb-1">{getContentIcon(item.content_type)}</div>
                            <p className="text-xs font-medium truncate px-2">{item.title}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* List View */
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm border border-white/10"
                        onClick={() => handleContentClick(item, index)}
                      >
                        <div className="w-16 h-16 bg-black/20 rounded-lg overflow-hidden flex-shrink-0">
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/64x64/1a1a1a/666666?text=' + encodeURIComponent(getContentIcon(item.content_type));
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-xl">{getContentIcon(item.content_type)}</span>
                            </div>
                          )}
                        </div>
                      
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{item.title}</h4>
                          <p className="text-sm text-gray-300 truncate">{item.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                            <span>{getContentIcon(item.content_type)} {item.content_type}</span>
                            <span>{formatDate(item.created_at)}</span>
                            
                            {/* Show loader or error */}
                            {(activeSection === 'content' ? contentLoading : projectsLoading) ? (
                              <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 animate-pulse" />
                            ) : (activeSection === 'content' ? contentError : false) ? (
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                            ) : null}
                          </div>
                        </div>
                      
                        {isSelected && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Projects Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userProjects.map((project) => (
                    <div
                      key={project.id}
                      className="relative bg-white/5 rounded-xl overflow-hidden backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group cursor-pointer"
                    >
                      {/* Project Cover */}
                      <div className="relative h-32 bg-gradient-to-br from-purple-600/40 to-pink-600/40">
                        {project.cover_url ? (
                          <img
                            src={project.cover_url}
                            alt={project.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl text-white/30 font-bold">
                              {project.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        
                        {/* Project Type Badge */}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm">
                            {project.collab_type}
                          </Badge>
                        </div>
                      </div>

                      {/* Project Info */}
                      <div className="p-4">
                        <h4 className="font-semibold text-white mb-2 line-clamp-1">{project.title}</h4>
                        <p className="text-sm text-gray-300 mb-3 line-clamp-2">{project.description}</p>
                        
                        {/* Roles Needed */}
                        <div className="mb-3">
                          <p className="text-xs text-gray-400 mb-1">Looking for:</p>
                          <div className="flex flex-wrap gap-1">
                            {project.roles_needed.slice(0, 3).map((role) => (
                              <Badge key={role} className="bg-purple-900/30 text-purple-200 border-purple-700/50 text-xs">
                                {role}
                              </Badge>
                            ))}
                            {project.roles_needed.length > 3 && (
                              <Badge className="bg-purple-900/30 text-purple-200 border-purple-700/50 text-xs">
                                +{project.roles_needed.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Project Details */}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <div className="flex items-center gap-2">
                            <span>{project.is_remote ? '🌍 Remote' : `📍 ${project.location || 'Local'}`}</span>
                          </div>
                          <span>{formatDate(project.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      
        {/* Create Content Modal */}
        <CreateContentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onContentCreated={handleContentCreated}
        />
        
        {/* Lightbox for media content */}
        {lightboxContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightboxContent(null)}
          >
            <div className="relative w-full max-w-4xl h-[80vh]">
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                ✕
              </button>

              {/* Navigation buttons */}
              {currentIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('prev');
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  ←
                </button>
              )}
              
              {currentIndex < mediaContent.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('next');
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  →
                </button>
              )}

              {/* Media content */}
              <div
                className="w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={handleSwipeStart}
                onTouchMove={handleSwipeMove}
                onTouchEnd={handleSwipeEnd}
                onMouseDown={handleSwipeStart}
                onMouseMove={handleSwipeMove}
                onMouseUp={handleSwipeEnd}
              >
                {lightboxContent.type === 'video' ? (
                  <video
                    src={lightboxContent.url}
                    controls
                    className="max-w-full max-h-full"
                    autoPlay
                  />
                ) : (
                  <img
                    src={lightboxContent.url}
                    alt={lightboxContent.title}
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>

              {/* Title and counter */}
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <h3 className="text-white text-lg font-medium mb-2">{lightboxContent.title}</h3>
                <p className="text-gray-300 text-sm">
                  {currentIndex + 1} of {mediaContent.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Helper function to format dates
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default ProfileTab;