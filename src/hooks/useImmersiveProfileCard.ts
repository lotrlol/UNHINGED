import { useState, useRef, useEffect } from 'react';
import { PanInfo } from 'framer-motion';

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

export interface UseImmersiveProfileCardProps {
  user: UserProfile;
  onLike: () => void;
  onPass: () => void;
  onProfileOpen: () => void;
  isDragging?: boolean;
  swipeDirection?: 'left' | 'right' | null;
  liking?: boolean;
}

export function useImmersiveProfileCard({
  user,
  onLike,
  onPass,
  onProfileOpen,
  isDragging: externalIsDragging = false,
  swipeDirection: externalSwipeDirection = null,
  liking: externalLiking = false,
}: UseImmersiveProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [internalDragOffset, setInternalDragOffset] = useState(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle swipe gestures for drawer
  const handleDragStart = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDraggingState(true);
    setDragStartY(info.point.y);
  };

  const handleDrag = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (isExpanded) {
      const dragDistance = info.point.y - dragStartY;
      if (dragDistance > 0) {
        setInternalDragOffset(dragDistance);
      }
    }
  };

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  // Get banner details
  const bannerUrl = user.content[0]?.url || '';
  const bannerIsVideo = user.content[0]?.type === 'video';

  return {
    // State
    isExpanded,
    isDraggingState,
    internalDragOffset,
    drawerRef,
    bannerUrl,
    bannerIsVideo,
    
    // Handlers
    handleDragStart,
    handleDrag,
    handleDragEnd,
    toggleDrawer: () => setIsExpanded(!isExpanded),
    
    // Utils
    getInitials,
    formatDate,
    
    // Props
    user,
    onLike,
    onPass,
    onProfileOpen,
    externalIsDragging,
    externalSwipeDirection,
    externalLiking,
  };
}
