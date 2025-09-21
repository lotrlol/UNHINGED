import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Heart, ChevronDown, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from './ui/Avatar';

export interface ContentItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  fullName?: string;
  bio?: string;
  location?: string;
  createdAt: string;
  avatarUrl?: string;
  tags?: string[];
  content: ContentItem[];
  tagline?: string;
  roles?: string[];
  skills?: string[];
  lookingFor?: string[];
  coverUrl?: string;
}

export interface ImmersiveProfileCardProps {
  user: UserProfile;
  onLike: () => void;
  onPass: () => void;
  onProfileOpen: () => void;
  className?: string;
  isDragging?: boolean;
  dragOffset?: { x: number; y: number };
  swipeDirection?: 'left' | 'right' | null;
  liking?: boolean;
}

export function ImmersiveProfileCard({
  user,
  onLike,
  onPass,
  onProfileOpen,
  className = '',
  isDragging: externalIsDragging,
  dragOffset: externalDragOffset,
  swipeDirection: externalSwipeDirection,
  liking: externalLiking,
}: ImmersiveProfileCardProps) {
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentContent = user.content[currentContentIndex];
  const hasMultipleContent = user.content.length > 1;

  // Auto-advance content with hybrid logic for images/videos
  useEffect(() => {
    if (!hasMultipleContent) {
      console.log(`🎬 ImmersiveProfileCard: No multiple content, skipping timer setup`);
      return;
    }

    const current = user.content[currentContentIndex];
    console.log(`🎬 ImmersiveProfileCard: Setting up auto-advance for ${current.type} at index ${currentContentIndex}`);

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      console.log(`🎬 ImmersiveProfileCard: Cleared existing timer`);
    }

    // Only set timeout for images (videos use onEnded event)
    if (current.type === 'image') {
      timerRef.current = setTimeout(() => {
        console.log(`🎬 ImmersiveProfileCard: Timer fired! Advancing from image index ${currentContentIndex} to ${currentContentIndex + 1}`);
        setCurrentContentIndex((prev) => (prev + 1) % user.content.length);
      }, 10000);
      console.log(`🎬 ImmersiveProfileCard: Set 10s timer for image at index ${currentContentIndex}`);
    } else {
      console.log(`🎬 ImmersiveProfileCard: Video detected at index ${currentContentIndex}, relying on onEnded event`);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        console.log(`🎬 ImmersiveProfileCard: Cleaned up timer during unmount/effect cleanup`);
      }
    };
  }, [hasMultipleContent, user.content.length, currentContentIndex]);

  // Handle content navigation
  const nextContent = () => {
    if (hasMultipleContent) {
      const nextIndex = (currentContentIndex + 1) % user.content.length;
      const nextContentType = user.content[nextIndex].type;
      console.log(`🎬 ImmersiveProfileCard: Manual navigation - advancing from index ${currentContentIndex} to ${nextIndex} (${nextContentType})`);
      setCurrentContentIndex(nextIndex);
    }
  };

  const prevContent = () => {
    if (hasMultipleContent) {
      const prevIndex = (currentContentIndex - 1 + user.content.length) % user.content.length;
      const prevContentType = user.content[prevIndex].type;
      console.log(`🎬 ImmersiveProfileCard: Manual navigation - going back from index ${currentContentIndex} to ${prevIndex} (${prevContentType})`);
      setCurrentContentIndex(prevIndex);
    }
  };

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Pause auto-advance when user interacts with the content
  const handleContentInteraction = useCallback(() => {
    // Reset the auto-advance timer when user interacts with the content
    console.log(`🎬 ImmersiveProfileCard: User interaction detected on ${user.content[currentContentIndex].type} at index ${currentContentIndex}`);

    if (hasMultipleContent && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      console.log(`🎬 ImmersiveProfileCard: Cleared existing timer due to user interaction`);

      // Only set timeout for images (videos use onEnded event)
      const current = user.content[currentContentIndex];
      if (current.type === 'image') {
        timerRef.current = setTimeout(() => {
          console.log(`🎬 ImmersiveProfileCard: Timer fired after user interaction! Advancing from image index ${currentContentIndex} to ${currentContentIndex + 1}`);
          setCurrentContentIndex((prev) => (prev + 1) % user.content.length);
        }, 10000);
        console.log(`🎬 ImmersiveProfileCard: Reset 10s timer for image at index ${currentContentIndex} after user interaction`);
      } else {
        console.log(`🎬 ImmersiveProfileCard: Video detected after user interaction, relying on onEnded event`);
      }
    }
  }, [hasMultipleContent, user.content.length, currentContentIndex]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      console.log(`🎬 ImmersiveProfileCard: Component unmounting for user ${user.username}`);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user.username]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className={`relative w-full h-[90vh] max-h-[600px] overflow-hidden bg-black ${className}`}>
      {/* Content Background - Full Screen */}
      <div
        className="absolute inset-0 z-0"
        onClick={handleContentInteraction}
        onTouchStart={handleContentInteraction}
      >
        {currentContent ? (
          currentContent.type === 'video' ? (
            <video
              src={currentContent.url}
              className="object-cover bg-black"
              autoPlay
              muted
              playsInline
              onEnded={() => {
                console.log(`🎬 ImmersiveProfileCard: Video ended at index ${currentContentIndex}, auto-advancing to next content`);
                nextContent();
              }}
            />
          ) : (
            <img
              src={currentContent.url}
              alt="Profile content"
              className="object-cover bg-black"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-4">👤</div>
              <p className="text-white/60 text-lg">No content available</p>
            </div>
          </div>
        )}

        {/* Subtle gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
      </div>

      {/* Navigation Arrows (for multiple content) */}
      {hasMultipleContent && (
        <>
          <button
            onClick={prevContent}
            className="absolute left-6 top-1/4 -translate-y-1/2 z-40 p-1 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
          >
            <ChevronDown className="w-7 h-7 transform rotate-90" />
          </button>
          <button
            onClick={nextContent}
            className="absolute right-6 top-1/4 -translate-y-1/2 z-40 p-1 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-all duration-200 hover:scale-110 shadow-lg border border-white/20"
          >
            <ChevronDown className="w-7 h-7 transform -rotate-90" />
          </button>
        </>
      )}

      {/* User Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-center p-0">
        <div className="bg-gradient-to-t from-black/95 via-black/80 to-black/60 rounded-t-2xl p-4 backdrop-blur-sm border-t border-white/10 max-h-80 overflow-y-auto">
          {/* User Info Section */}
          <div className="flex flex-col justify-between h-full">
            {/* Top Section - User Info */}
            <div className="flex-1">
              {/* Name and Username */}
              <div className="mb-3">
                <h1 className="text-2xl font-bold text-white mb-1 leading-tight">
                  {user.fullName || user.username}
                </h1>
                <p className="text-purple-300 text-base font-medium">@{user.username}</p>
              </div>

              {/* Bio Section - Always present */}
              <div className="mb-3 p-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 min-h-12 flex items-center">
                <p className={`text-white text-sm leading-relaxed italic ${user.bio ? 'text-white' : 'text-white/40'}`}>
                  {user.bio ? `"${user.bio}"` : "No bio available"}
                </p>
              </div>

              {/* Location and Join Date - Always present */}
              <div className="flex items-center gap-3 mb-3 text-gray-300 text-sm min-h-5">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className={user.location ? 'text-gray-300' : 'text-gray-500'}>
                    {user.location || 'Location not set'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className={user.createdAt ? 'text-gray-300' : 'text-gray-500'}>
                    {user.createdAt ? `Joined ${formatDate(user.createdAt)}` : 'Join date not available'}
                  </span>
                </div>
              </div>

              {/* Tags and Content Count - Always present */}
              <div className="flex flex-wrap items-center gap-2 min-h-8">
                {user.tags && user.tags.length > 0 ? (
                  user.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/10 text-white rounded-full text-xs border border-white/20"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="px-2 py-1 bg-white/5 text-white/40 rounded-full text-xs border border-white/10">
                    No interests
                  </span>
                )}
                {user.content && user.content.length > 0 ? (
                  <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs border border-purple-400/30">
                    {user.content.length} {user.content.length === 1 ? 'post' : 'posts'}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-purple-600/10 text-purple-300/40 rounded-full text-xs border border-purple-400/10">
                    No posts
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Section - Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-3 mt-4 border-t border-white/10">
              <motion.button
                onClick={onPass}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border-2 border-red-400/30 text-white hover:bg-red-500/20 hover:border-red-400/50 transition-all duration-200 flex items-center justify-center group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </motion.button>

              <motion.button
                onClick={onProfileOpen}
                className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 hover:bg-white/20 transition-all duration-200 flex items-center gap-1 group text-sm"
                whileHover={{
                  scale: 1.05,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                }}
                whileTap={{ scale: 0.98 }}
              >
                <span>View Profile</span>
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </motion.button>

              <motion.button
                onClick={onLike}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 backdrop-blur-md border-2 border-pink-400/30 text-white hover:from-pink-400 hover:to-purple-500 transition-all duration-200 flex items-center justify-center shadow-lg group"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Heart className="w-7 h-7 fill-current group-hover:scale-110 transition-transform" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
