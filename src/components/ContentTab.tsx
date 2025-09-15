import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Share2, Plus, Heart, X } from 'lucide-react';
import { ContentGlassCard } from './ui/GlassCard';
import { formatDate, getInitials } from '../lib/utils';
import { CreateContentModal } from './CreateContentModal';
import { UserProfileModal } from './UserProfileModal';
import { useContent, ContentPost as FetchedContentPost } from '../hooks/useContent';
import { CommentSection } from './CommentSection';
import { motion, AnimatePresence } from 'framer-motion';

/* -------------------- VideoPlayer -------------------- */
interface VideoPlayerProps {
  src: string | null;
  thumbnail: string | null;
  title: string;
  className?: string;
}

const VideoPlayer = ({ src, thumbnail, title, className = '' }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    setShowControls(true);
    setTimeout(() => setShowControls(false), 3000);
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (video.paused) {
              video
                .play()
                .then(() => {
                  setIsPlaying(true);
                  video.muted = true;
                  setIsMuted(true);
                })
                .catch(() => {});
            }
          } else {
            if (!video.paused) {
              video.pause();
              setIsPlaying(false);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      observer.disconnect();
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-auto max-h-[80vh] object-contain cursor-pointer bg-transparent"
          onClick={togglePlayPause}
          loop
          muted={isMuted}
          playsInline
          poster={thumbnail || undefined}
          preload="metadata"
          title={title}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          Video not available
        </div>
      )}

      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlayPause}
        >
          <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-lg border border-white/10 shadow-lg">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-3 transition-all duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-black/50 backdrop-blur-lg rounded-lg p-3 shadow-xl border border-white/10">
          <div
            className="w-full h-1.5 bg-gray-700/50 rounded-full mb-2 cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transform translate-x-1/2 shadow" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button onClick={togglePlayPause} className="p-2 hover:bg-white/10 rounded-full">
                {isPlaying ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 20h4V4h-4v16zm-6 0h4V4H4v16z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
              <div className="text-xs font-medium text-white/90">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full">
              {isMuted ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 4L2.86 5.41 7 9.56v2.09c-.61-.21-1.25-.33-1.92-.33-2.76 0-5.08 2.24-5.08 5s2.32 5 5.08 5c1.34 0 2.57-.5 3.52-1.34l1.5 1.5C13.37 21.5 12 22 10.5 22 5.81 22 2 18.19 2 13.5c0-1.76.49-3.4 1.34-4.8L4.27 4zM10.5 17c-1.94 0-3.5-1.57-3.5-3.5v-.5l4.54 4.54c-.4.24-.85.46-1.34.46z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------- ContentTab -------------------- */
const CONTENT_TYPES = {
  video: { label: 'Video', emoji: '🎥' },
  audio: { label: 'Audio', emoji: '🎧' },
  image: { label: 'Image', emoji: '🖼️' },
  article: { label: 'Article', emoji: '📝' },
} as const;

const ContentTab: React.FC = () => {
  const [content, setContent] = useState<FetchedContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showComments, setShowComments] = useState<string | null>(null);

  const {
    content: fetchedContent,
    loading: isLoading,
    error,
    likeContent,
    refetch,
  } = useContent();

  useEffect(() => {
    if (fetchedContent) setContent(fetchedContent);
  }, [fetchedContent]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  const handleLike = async (id: string) => {
    const result = await likeContent(id);
    if (!result?.error) {
      setContent((prev) =>
        prev.map((post) =>
          post.id === id
            ? {
                ...post,
                user_has_liked: !post.user_has_liked,
                like_count: post.user_has_liked
                  ? Math.max(post.like_count - 1, 0)
                  : post.like_count + 1,
              }
            : post
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading content.</div>;
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative w-full max-w-4xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-white mb-6">Content Feed</h1>
        
        {/* FAB */}
        <div className="fixed bottom-8 right-8">
          <div className="relative w-14 h-14">
            {/* Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-purple-600/90 to-pink-500/90 backdrop-blur-lg border border-white/10 shadow-2xl flex items-center justify-center text-white hover:scale-105 transform transition-all duration-200 z-10"
              aria-label="Create new post"
            >
              <Plus className="w-6 h-6" />
            </button>
            {/* Centered Pulse Animation */}
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-500/30 blur-xl animate-ping z-0" />
          </div>
        </div>

        <div className="w-full flex flex-col items-center space-y-6">
          {content.map((item) => {
            const hasLiked = item.user_has_liked ?? false;

            return (
              <ContentGlassCard
                key={item.id}
                className="overflow-hidden w-full max-w-2xl"
              >
                <div className="p-6 flex flex-col gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                      {item.creator_avatar ? (
                        <img
                          src={item.creator_avatar}
                          alt={item.creator_name || 'User'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(item.creator_name || '?')
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{item.creator_name}</p>
                      <div className="flex items-center text-xs text-gray-300 space-x-2">
                        <span>{formatDate(item.created_at)}</span>
                        <span className="text-white/50">•</span>
                        <span className="inline-flex items-center">
                          {CONTENT_TYPES[item.content_type].emoji}
                          <span className="ml-1">{CONTENT_TYPES[item.content_type].label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mt-1">
                    {item.title}
                  </h3>

                  {/* Media */}
                  <div className="relative overflow-hidden rounded-xl bg-black/20 backdrop-blur-sm">
                    {item.content_type === 'video' ? (
                      <VideoPlayer
                        src={item.external_url}
                        thumbnail={item.thumbnail_url}
                        title={item.title}
                        className="w-full"
                      />
                    ) : item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                      />
                    ) : null}
                  </div>

                  {/* Description */}
                  {item.description && (
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Interaction Bar */}
                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/10">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(item.id)}
                        className={`flex items-center space-x-1.5 hover:text-pink-400 transition-colors ${
                          item.user_has_liked ? 'text-pink-500' : 'text-gray-400'
                        }`}
                      >
                        <Heart 
                          className={`w-5 h-5 ${item.user_has_liked ? 'fill-current' : ''}`} 
                        />
                        <span className="text-sm">{item.like_count || 0}</span>
                      </button>
                      <button 
                        onClick={() => setShowComments(item.id)}
                        className="flex items-center space-x-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-sm">{(item as any).comment_count || 0}</span>
                      </button>
                      <button className="text-gray-400 hover:text-green-400 transition-colors">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="text-xs bg-white/10 text-white/80 px-2.5 py-1 rounded-full">
                      {item.view_count} {item.view_count === 1 ? 'view' : 'views'}
                    </span>
                  </div>
                </div>

                {/* Always show comments if there are any, max 3 */}
                {(item.comment_count || 0) > 0 && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-white/10 pt-4">
                      <CommentSection 
                        contentId={item.id} 
                        showPreview={showComments !== item.id}
                        maxPreviewComments={3}
                        onToggleExpand={() => setShowComments(showComments === item.id ? null : item.id)}
                        isExpanded={showComments === item.id}
                      />
                    </div>
                  </div>
                )}
              </ContentGlassCard>
            );
          })}
        </div>

        <CreateContentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onContentCreated={() => {
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
    </div>
  );
};

export default ContentTab;
