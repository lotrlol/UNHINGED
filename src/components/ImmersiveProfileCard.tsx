import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, ChevronUp, ChevronDown, MapPin, Calendar } from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [internalDragOffset, setInternalDragOffset] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const currentContent = user.content[currentContentIndex];
  const hasMultipleContent = user.content.length > 1;

  // Handle swipe gestures for content
  const handleDragStart = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDraggingState(true);
    setDragStartY(info.point.y);
  };

  const handleDrag = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isExpanded) {
      const dragDistance = info.point.y - dragStartY;
      if (dragDistance > 0) {
        setInternalDragOffset(dragDistance);
      }
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = info.offset.y;
    const velocity = info.velocity.y;

    if (isExpanded && (dragDistance > 100 || velocity > 800)) {
      setIsExpanded(false);
    } else if (dragDistance < -50 || velocity < -800) {
      setIsExpanded(true);
    }

    setIsDraggingState(false);
    setInternalDragOffset(0);
  };

  // Handle content navigation
  const nextContent = () => {
    if (hasMultipleContent) {
      setCurrentContentIndex((prev) => (prev + 1) % user.content.length);
    }
  };

  const prevContent = () => {
    if (hasMultipleContent) {
      setCurrentContentIndex((prev) => (prev - 1 + user.content.length) % user.content.length);
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

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className={`relative w-full h-screen overflow-hidden bg-black ${className}`}>
      {/* Content Background */}
      <div className="absolute inset-0">
        {currentContent ? (
          currentContent.type === 'video' ? (
            <video
              src={currentContent.url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={currentContent.url}
              alt="Profile content"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900 to-black" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
      </div>

      {/* Navigation Arrows (for multiple content) */}
      {hasMultipleContent && (
        <>
          <button
            onClick={prevContent}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            <ChevronDown className="w-6 h-6 transform rotate-90" />
          </button>
          <button
            onClick={nextContent}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
          >
            <ChevronDown className="w-6 h-6 transform -rotate-90" />
          </button>
        </>
      )}

      {/* Action Buttons */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-12 z-20 px-4">
        <button
          onClick={onPass}
          className="w-16 h-16 rounded-full bg-red-500/90 backdrop-blur-md border-2 border-red-400/30 shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all hover:shadow-red-500/30"
        >
          <X className="w-8 h-8" />
        </button>
        <button
          onClick={onLike}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/90 to-purple-600/90 backdrop-blur-md border-2 border-pink-400/30 shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all hover:shadow-pink-500/30"
        >
          <Heart className="w-10 h-10 fill-current" />
        </button>
      </div>

      {/* Profile Drawer */}
      <motion.div
        ref={drawerRef}
        className={`absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-hidden ${
          isExpanded ? 'h-3/4' : 'h-32'
        }`}
        style={{
          background: 'rgba(40, 0, 60, 0.5)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          transform: `translateY(${internalDragOffset}px)`,
        }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.1, bottom: 0.1 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-white/30 rounded-full mx-auto mt-2 mb-3" />

        {/* Collapsed View */}
        {!isExpanded && (
          <div className="flex items-center p-4">
            <div className="relative group" onClick={(e) => {
              e.stopPropagation();
              onProfileOpen();
            }}>
              <Avatar className="w-16 h-16 border-2 border-white/80">
                <AvatarImage src={user.avatarUrl} alt={user.fullName || user.username} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-2xl">
                  {user.fullName 
                    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                    : user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-baseline">
                <h2 className="text-xl font-bold text-white">
                  {user.fullName || user.username}
                </h2>
                <span className="ml-2 text-gray-300">@{user.username}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {user.tags?.slice(0, 3).map((tag, index) => (
                  <span key={index} className="text-xs px-2 py-0.5 bg-white/10 text-white/80 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <ChevronUp className="w-6 h-6 text-white/60" />
          </div>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <div className="p-6 overflow-y-auto h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center">
                <div className="relative group" onClick={(e) => {
                  e.stopPropagation();
                  onProfileOpen();
                }}>
                  <Avatar className="w-20 h-20 border-2 border-white/80">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName || user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-3xl">
                      {user.fullName 
                        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                        : user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-white">
                    {user.fullName || user.username}
                  </h2>
                  <p className="text-gray-300">@{user.username}</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {user.bio && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">About</h3>
                <p className="text-white">{user.bio}</p>
              </div>
            )}

            {(user.location || user.createdAt) && (
              <div className="flex gap-6 mb-6">
                {user.location && (
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    <span>{user.location}</span>
                  </div>
                )}
                {user.createdAt && (
                  <div className="flex items-center text-gray-300">
                    <Calendar className="w-4 h-4 mr-1.5" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                )}
              </div>
            )}

            {user.tags && user.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-white/10 text-white/90 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hasMultipleContent && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Content ({user.content.length})</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  {user.content.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentContentIndex(index);
                      }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                        index === currentContentIndex ? 'ring-2 ring-pink-500' : 'opacity-70'
                      }`}
                    >
                      {item.type === 'video' ? (
                        <video
                          src={item.thumbnail || item.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={`Content ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
