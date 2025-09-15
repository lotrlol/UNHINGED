import React from 'react';
import { LiquidGlass } from '@liquidglass/react';
import { cn } from '../../lib/utils';
import { ReactNode } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  borderRadius?: number;
  blur?: number;
  contrast?: number;
  brightness?: number;
  saturation?: number;
  shadowIntensity?: number;
  elasticity?: number;
  onClose?: () => void;
  title?: string;
  style?: React.CSSProperties;
}

interface ContentGlassCardProps extends Omit<GlassCardProps, 'className'> {
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  fullHeight?: boolean; // enables TikTok/Reel layout
  videoSrc?: string; // Optional video source for background effect
}

interface FriendsGlassCardProps extends Omit<GlassCardProps, 'className'> {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
}

interface ChatGlassCardProps extends Omit<GlassCardProps, 'className'> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'translucent';
  borderRadius?: number;
  blur?: number;
  contrast?: number;
  saturation?: number;
  onClose?: () => void;
  title?: string;
  style?: React.CSSProperties;
}

interface ChatBubbleGlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isCurrentUser?: boolean;
  children: React.ReactNode;
  timestamp?: string;
  className?: string;
}

interface AuthGlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClose?: () => void;
}

interface ProfileGlassCardProps {
  avatarUrl?: string;
  name: string;
  tagline?: string;
  roles?: string[];
  location?: string;
  stats?: { label: string; value: string | number }[];
  bio?: string;
  footer?: React.ReactNode;
  className?: string;
  onClose?: () => void;
  bannerImage?: React.ReactNode;
  avatarImage?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl'
    | 'full';
}

interface NavigationGlassCardProps {
  children: React.ReactNode;
  className?: string;
}

interface OnboardingGlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  currentStep?: number;
  totalSteps?: number;
  onNext?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  hideNavigation?: boolean;
}

interface LandingGlassCardProps extends Omit<GlassCardProps, 'className' | keyof React.HTMLAttributes<HTMLDivElement>> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  // Motion props
  initial?: any;
  animate?: any;
  transition?: any;
}

/* -------------------- Shared Styles -------------------- */
const glassBaseStyle = {
  backdropFilter: 'blur(10px) brightness(1.1)',
  WebkitBackdropFilter: 'blur(10px) brightness(1.1)',
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
};

const glassOverlay = (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
  </>
);

/* -------------------- ContentGlassCard -------------------- */
function ContentGlassCard({
  children,
  className,
  variant = 'default',
  borderRadius = 16,
  blur = 2.5,
  contrast = 1.15,
  brightness = 1.1,
  saturation = 1.1,
  shadowIntensity = 0.25,
  elasticity = 0.3,
  fullHeight = false,
  videoSrc,
  ...props
}: ContentGlassCardProps) {
  const variantStyles: Record<string, string> = {
    default: '',
    elevated: 'shadow-2xl',
    subtle: ''
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:scale-[1.01]',
        'backdrop-blur-sm rounded-2xl',
        fullHeight
          ? 'max-w-sm w-full aspect-[9/16] flex flex-col' // Reels layout
          : 'w-full',
        variantStyles[variant],
        className
      )}
    >
      {videoSrc && (
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover blur-2xl opacity-20 scale-110"
            src={videoSrc}
          />
        </div>
      )}
      <LiquidGlass
        className="relative w-full h-full flex flex-col"
        borderRadius={borderRadius}
        blur={blur}
        contrast={contrast}
        brightness={brightness}
        saturation={saturation}
        shadowIntensity={shadowIntensity}
        elasticity={elasticity}
        style={glassBaseStyle}
        {...props}
      >
        {glassOverlay}

        <div className="relative z-10 h-full w-full flex flex-col">
          {children}
        </div>
      </LiquidGlass>
    </div>
  );
}

/* -------------------- GlassCard -------------------- */
function GlassCard({
  children,
  className = '',
  borderRadius = 20,
  blur = 1.9,
  contrast = 1.2,
  brightness = 1.1,
  saturation = 1.2,
  shadowIntensity = 0.3,
  elasticity = 0.4,
  ...props
}: GlassCardProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      <LiquidGlass
        className="w-full h-full"
        borderRadius={borderRadius}
        blur={blur}
        contrast={contrast}
        brightness={brightness}
        saturation={saturation}
        shadowIntensity={shadowIntensity}
        elasticity={elasticity}
        style={glassBaseStyle}
        {...props}
      >
        {glassOverlay}
        <div className="relative z-10 h-full">{children}</div>
      </LiquidGlass>
    </div>
  );
}

/* -------------------- FriendsGlassCard -------------------- */
function FriendsGlassCard({
  children,
  className = '',
  variant = 'default',
  borderRadius = 12,
  blur = 2,
  contrast = 1.15,
  brightness = 1.1,
  saturation = 1.1,
  shadowIntensity = 0.25,
  elasticity = 0.3,
  ...props
}: FriendsGlassCardProps) {
  const variantStyles: Record<string, string> = {
    default: 'hover:from-purple-600/30 hover:to-pink-600/30',
    elevated: 'shadow-lg hover:shadow-xl',
    subtle: 'opacity-90 hover:opacity-100'
  };

  return (
    <div className={cn(
      'relative overflow-hidden transition-all duration-300',
      'group hover:scale-[1.02] active:scale-100',
      variantStyles[variant],
      className
    )}>
      <LiquidGlass
        className="w-full h-full"
        borderRadius={borderRadius}
        blur={blur}
        contrast={contrast}
        brightness={brightness}
        saturation={saturation}
        shadowIntensity={shadowIntensity}
        elasticity={elasticity}
        style={{
          ...glassBaseStyle,
          background: 'linear-gradient(135deg, rgba(88, 28, 135, 0.3) 0%, rgba(190, 24, 93, 0.25) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
        {...props}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20 group-hover:opacity-80 transition-opacity" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
        <div className="relative z-10 h-full w-full p-4">
          {children}
        </div>
      </LiquidGlass>
    </div>
  );
}

/* -------------------- ChatGlassCard -------------------- */
function ChatGlassCard({
  children,
  className = '',
  borderRadius = 0, // flush fullscreen look
  blur = 12, // Increased blur for stronger glass effect
  contrast = 1.1,
  brightness = 1.1,
  saturation = 1.1,
  shadowIntensity = 0.1, // Reduced shadow for cleaner look
  elasticity = 0.2, // Reduced elasticity for less distortion
  onClose,
  title,
  ...props
}: ChatGlassCardProps) {
  return (
    <div className="fixed inset-0 z-50 w-full h-full" style={{ borderRadius }}>
      <LiquidGlass
        className="relative w-full h-full flex flex-col overflow-hidden"
        borderRadius={borderRadius}
        blur={blur}
        contrast={contrast}
        saturation={saturation}
        style={{
          ...glassBaseStyle,
          background: 'rgba(15, 23, 42, 0.25)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: borderRadius ? `${borderRadius}px` : '0',
          ...props.style
        }}
        {...props}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10" />
        </div>

        {/* Header with close button */}
        <div className="relative w-full bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-md border-b border-white/10">
          <div className="w-full px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
            {title && (
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {title}
              </h3>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col w-full">
          {children}
        </div>
      </LiquidGlass>
    </div>
  );
}

/* -------------------- FilterGlassCard -------------------- */
function FilterGlassCard({
  children,
  className = '',
  variant = 'default',
  borderRadius = 16,
  blur = 3,
  contrast = 1.2,
  brightness = 1.05,
  saturation = 1.1,
  shadowIntensity = 0.2,
  elasticity = 0.35,
  ...props
}: ContentGlassCardProps) {
  const variantStyles: Record<string, string> = {};

  return (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        'backdrop-blur-md py-16 rounded-2xl',
        variantStyles[variant],
        className
      )}
    >
      <LiquidGlass
        className="w-full h-full"
        borderRadius={borderRadius}
        blur={blur}
        contrast={contrast}
        brightness={brightness}
        saturation={saturation}
        shadowIntensity={shadowIntensity}
        elasticity={elasticity}
        style={glassBaseStyle}
        {...props}
      >
        {glassOverlay}
        <div className="relative z-10 h-full px-6 py-8 sm:px-8 sm:py-10">
          {children}
        </div>
      </LiquidGlass>
    </div>
  );
}

/* -------------------- ChatBubbleGlassCard -------------------- */
const ChatBubbleGlassCard = React.forwardRef<HTMLDivElement, ChatBubbleGlassCardProps>(
  ({ isCurrentUser = false, children, timestamp, className, ...props }, ref) => {
    // Check if content is likely media
    const isMedia =
      React.Children.count(children) === 1 &&
      React.isValidElement(children) &&
      (children.type === 'img' || children.type === 'video');

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1',
          isCurrentUser ? 'items-end' : 'items-start',
          className
        )}
        {...props}
      >
        {/* Bubble */}
        <div
          className={cn(
            'relative rounded-2xl overflow-hidden',
            'backdrop-blur-lg border border-white/10',
            'transition-transform duration-200 hover:scale-[1.01]',
            isCurrentUser
              ? 'bg-gradient-to-l from-purple-800/40 to-pink-800/40'
              : 'bg-gradient-to-r from-gray-800/40 to-gray-900/40',
            isMedia
              ? 'p-0 max-w-[75%] sm:max-w-[60%]' // media edge-to-edge
              : 'px-4 py-3 sm:px-5 sm:py-4 max-w-[85%] sm:max-w-[70%]'
          )}
        >
          {/* Glow */}
          <div
            className={cn(
              'absolute inset-0 rounded-2xl pointer-events-none',
              'bg-gradient-to-r blur-xl opacity-20 group-hover:opacity-30 transition-opacity',
              isCurrentUser
                ? 'from-purple-500/30 to-pink-500/30'
                : 'from-gray-500/30 to-gray-600/30'
            )}
          />

          {/* Message content */}
          <div className="relative z-10 text-white/90 text-sm sm:text-base leading-relaxed break-words">
            {isMedia ? (
              <div className="overflow-hidden rounded-2xl">
                {children}
              </div>
            ) : (
              children
            )}
          </div>
        </div>

        {/* Timestamp */}
        {timestamp && (
          <span
            className={cn(
              'text-[11px] sm:text-xs font-light opacity-70 px-1',
              isCurrentUser ? 'text-right text-purple-200/70' : 'text-left text-gray-300/70'
            )}
          >
            {timestamp}
          </span>
        )}
      </div>
    );
  }
);

ChatBubbleGlassCard.displayName = 'ChatBubbleGlassCard';

/* -------------------- LandingGlassCard -------------------- */
const LandingGlassCard: React.FC<LandingGlassCardProps> = ({
  children,
  className = '',
  title,
  description,
  ctaText = 'Get Started',
  onCtaClick,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.5 },
  ...props
}) => {
  return (
    <motion.div 
      className={cn(
        'relative w-full max-w-md mx-auto p-8 rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-gray-900/90 via-gray-900/80 to-gray-900 backdrop-blur-xl',
        'border border-purple-900/30 shadow-2xl shadow-purple-900/20',
        'transform transition-all duration-500 hover:shadow-3xl hover:shadow-purple-900/30',
        className
      )}
      initial={initial}
      animate={animate}
      transition={transition}
      {...(props as any)}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center">
        {title && (
          <h1 
            className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-gray-300 mb-6 text-lg">
            {description}
          </p>
        )}
        {children}
        {onCtaClick && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCtaClick}
            className="mt-6 w-full py-3 px-6 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-900/40 transition-all duration-300 hover:brightness-110"
          >
            {ctaText}
            <span className="ml-2">→</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

/* -------------------- NavigationGlassCard -------------------- */
function NavigationGlassCard({ children, className = '', ...props }: NavigationGlassCardProps) {
  return (
    <div className={cn(
      'relative rounded-2xl backdrop-blur-xl bg-gradient-to-br from-gray-900/80 to-gray-900/60',
      'border border-white/10 shadow-lg shadow-black/30 overflow-hidden',
      className
    )} {...props}>
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

/* -------------------- AuthGlassCard -------------------- */
function AuthGlassCard({ children, className = '', title, onClose, ...props }: AuthGlassCardProps) {
  return (
    <div className={cn(
      'relative rounded-2xl backdrop-blur-xl overflow-hidden',
      'bg-gradient-to-br from-gray-900/80 to-gray-900/60',
      'border border-white/10 shadow-xl shadow-black/30',
      'w-full max-w-md mx-auto',
      className
    )} {...props}>
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent" />
      </div>
      
      {/* Header */}
      {title && (
        <div className="relative z-10 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 p-6 pt-4">
        {children}
      </div>
    </div>
  );
}

/* -------------------- ProfileGlassCard -------------------- */
function ProfileGlassCard({
  avatarUrl,
  name,
  tagline,
  roles = [],
  location,
  stats = [],
  bio,
  footer,
  className = '',
  onClose,
  bannerImage,
  avatarImage,
  maxWidth = '2xl',
  title,
  children,
  ...props
}: ProfileGlassCardProps & { children?: React.ReactNode }) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div className={cn(
      'relative rounded-3xl overflow-hidden',
      'bg-gradient-to-br from-gray-900/70 to-gray-900/90',
      'border border-white/10 shadow-2xl shadow-black/40',
      'w-full backdrop-blur-xl',
      'transition-all duration-300 hover:shadow-3xl hover:shadow-purple-900/20',
      maxWidthClasses[maxWidth],
      'overflow-hidden',
      className
    )} {...props}>
      {/* Animated background gradients */}
      <div className="absolute inset-0 -z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-pink-600/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/3 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.1)_0%,rgba(236,72,153,0.1)_100%)]" />
      </div>
      
      {/* Animated border highlight */}
      <div className="absolute inset-0 rounded-3xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-transparent rounded-3xl animate-pulse-slow" />
      </div>
      
      {title && (
        <div className="relative z-10 px-8 pt-8 pb-2">
          <div className="flex items-center justify-between">
            <motion.h2 
              className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {title}
            </motion.h2>
            {onClose && (
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200"
                aria-label="Close modal"
                whileHover={{ scale: 1.05, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </div>
      )}
      
      {/* Banner Section */}
      <div className="relative h-48 w-full overflow-hidden">
        {bannerImage || (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      </div>
      
      {/* Avatar and Profile Info */}
      <div className="relative px-6 -mt-16 mb-4">
        <div className="flex items-end gap-4">
          <div className="w-32 h-32 rounded-full border-4 border-white/80 bg-gray-800 overflow-hidden shadow-xl">
            {avatarImage ? (
              avatarImage
            ) : avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-4xl">
                {name?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            {tagline && (
              <p className="text-gray-300 text-sm">{tagline}</p>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 px-6">
        {React.Children.map(children, (child, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: 0.1 + (index * 0.05),
              ease: [0.16, 1, 0.3, 1]
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
      
      {/* Subtle corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 -translate-x-12 -translate-y-12 bg-purple-500/10 rounded-full filter blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 translate-x-8 translate-y-8 bg-pink-500/10 rounded-full filter blur-3xl" />
    </div>
  );
}

/* -------------------- OnboardingGlassCard -------------------- */
const OnboardingGlassCard: React.FC<OnboardingGlassCardProps> = ({
  children,
  className = '',
  title,
  description,
  currentStep = 1,
  totalSteps = 1,
  onNext,
  onBack,
  onClose,
  hideNavigation = false,
  ...props
}) => {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <motion.div 
      className={cn(
        'relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden',
        'bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-purple-900/20 backdrop-blur-xl',
        'border border-purple-900/30 shadow-2xl shadow-purple-900/10',
        'transform transition-all duration-300',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      {...(props as any)}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent" />
      </div>
      
      {/* Progress bar */}
      {totalSteps > 1 && (
        <div className="h-1 bg-gray-800/50 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      )}

      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            {title && (
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-purple-200/70 mt-1">{description}</p>
            )}
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 -m-1.5 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 pt-4">
        {children}
      </div>

      {/* Navigation */}
      {!hideNavigation && (
        <div className="p-6 pt-0 flex justify-between items-center">
          <div>
            {currentStep > 1 && onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center text-sm text-purple-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
          </div>
          
          <div className="text-sm text-purple-200/70">
            Step {currentStep} of {totalSteps}
          </div>
          
          <div>
            {onNext && (
              <button
                onClick={onNext}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-900/30 transition-all hover:brightness-110"
              >
                {currentStep === totalSteps ? 'Finish' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* -------------------- ProjectGlassCard -------------------- */
interface ProjectGlassCardProps extends Omit<GlassCardProps, 'className'> {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  onClose?: () => void;
}

function ProjectGlassCard({
  children,
  className = '',
  title,
  description,
  onClose,
  ...props
}: ProjectGlassCardProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl group', className)}>
      <LiquidGlass
        className="w-full h-full"
        borderRadius={16}
        blur={2.5}
        contrast={1.15}
        brightness={1.1}
        saturation={1.1}
        shadowIntensity={0.25}
        elasticity={0.3}
        style={{
          ...glassBaseStyle,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(168, 85, 247, 0.1)',
        }}
        {...props}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJub25lIj48ZmlsdGVyIGlkPSJub2lzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3TigJw9IjAuMDUiIG51bE9jdGF2ZXM9IjEiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbmdpY2spIiBvcGFjaXR5PSIwLjA0Ii8+PC9zdmc+')] opacity-20" />
        
        {/* Content */}
        <div className="relative z-10 h-full w-full">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white/70" />
            </button>
          )}
          
          <div className="h-full w-full p-6">
            {(title || description) && (
              <div className="mb-6">
                {title && (
                  <h3 className="text-xl font-bold text-white mb-2">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-purple-200/80">
                    {description}
                  </p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </LiquidGlass>
    </div>
  );
}

export { 
  GlassCard, 
  ContentGlassCard, 
  FriendsGlassCard, 
  ChatGlassCard, 
  ChatBubbleGlassCard, 
  AuthGlassCard, 
  ProfileGlassCard, 
  OnboardingGlassCard, 
  LandingGlassCard, 
  NavigationGlassCard, 
  FilterGlassCard,
  ProjectGlassCard 
};
