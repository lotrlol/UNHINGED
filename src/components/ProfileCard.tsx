import React, { useState, useRef } from 'react';
import { GlassCard } from './ui/GlassCard';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { MapPin, Calendar, Edit, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// File validation constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Resolution guidelines
const UPLOAD_GUIDELINES = {
  avatar: {
    recommended: '500x500px',
    min: '200x200px',
    max: '2000x2000px',
    aspectRatio: '1:1'
  },
  banner: {
    recommended: '1500x500px',
    min: '1200x400px',
    max: '3000x1000px',
    aspectRatio: '3:1'
  }
};

export interface ProfileCardProps {
  username: string;
  fullName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  location?: string;
  joinDate?: string;
  bio?: string;
  stats?: {
    posts: number;
    followers: number;
    following: number;
  };
  onEditProfile?: () => void;
  onBannerChange?: (file: File) => void;
  onAvatarChange?: (file: File) => void;
  className?: string;
}

export function ProfileCard({
  username,
  fullName,
  avatarUrl,
  bannerUrl,
  location,
  joinDate,
  bio,
  stats = { posts: 0, followers: 0, following: 0 },
  onEditProfile,
  onBannerChange,
  onAvatarChange,
  className = '',
}: ProfileCardProps) {
  const [isUploading, setIsUploading] = useState<'avatar' | 'banner' | null>(null);
  const [previewBanner, setPreviewBanner] = useState<string | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const validateFile = async (file: File, type: 'avatar' | 'banner') => {
    console.log('Validating file:', file.name, file.type, file.size);
    
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const errorMsg = `Please upload a valid image (JPEG, PNG, WebP, or GIF). File type ${file.type} is not supported.`;
      console.error(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = `File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`;
      console.error(errorMsg);
      toast.error(errorMsg);
      return false;
    }

    // Check image dimensions
    try {
      const img = new Image();
      const imgLoadPromise = new Promise<boolean>((resolve) => {
        img.onload = () => {
          const { width, height } = img;
          console.log(`Image dimensions: ${width}x${height}`);
          
          // For avatars, we'll just log a warning if not square but still allow it
          if (type === 'avatar' && width !== height) {
            console.warn('Avatar image is not square. It will be cropped to a square.');
          }
          
          resolve(true);
        };
        
        img.onerror = () => {
          console.error('Failed to load image for validation');
          resolve(false);
        };
      });
      
      img.src = URL.createObjectURL(file);
      
      // Add a timeout in case the image fails to load
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          console.error('Image validation timed out');
          resolve(false);
        }, 5000); // 5 second timeout
      });
      
      return await Promise.race([imgLoadPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error during image validation:', error);
      toast.error('Error processing the image. Please try another file.');
      return false;
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading('banner');
    try {
      const isValid = await validateFile(file, 'banner');
      if (!isValid) return;

      const previewUrl = URL.createObjectURL(file);
      setPreviewBanner(previewUrl);
      onBannerChange?.(file);
    } finally {
      setIsUploading(null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Avatar input changed');
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    
    // Reset the input value to allow selecting the same file again
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }

    setIsUploading('avatar');
    
    try {
      console.log('Creating preview...');
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatar(previewUrl);
      
      console.log('Validating file...');
      const isValid = await validateFile(file, 'avatar');
      
      if (!isValid) {
        console.log('File validation failed');
        setPreviewAvatar(null);
        return;
      }
      
      console.log('Calling onAvatarChange callback...');
      if (onAvatarChange) {
        try {
          await onAvatarChange(file);
          console.log('Avatar change callback completed');
          // Show success message
          toast.success('Avatar updated successfully');
        } catch (error) {
          console.error('Error in onAvatarChange callback:', error);
          toast.error('Failed to upload avatar. Please try again.');
          setPreviewAvatar(avatarUrl || null); // Revert to previous avatar
        }
      }
    } catch (error) {
      console.error('Error handling avatar change:', error);
      toast.error('Failed to process the selected image.');
      setPreviewAvatar(avatarUrl || null); // Revert to previous avatar
    } finally {
      console.log('Cleaning up upload state');
      setIsUploading(null);
    }
  };

  const handleRemoveBanner = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewBanner(null);
    if (bannerInputRef.current) bannerInputRef.current.value = '';
    // You might want to handle banner removal on the server here
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewAvatar(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
    // You might want to handle avatar removal on the server here
  };

  return (
    <div className={cn('w-full overflow-hidden', className)}>
      {/* Banner */}
      <div 
        className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden group cursor-pointer"
        onClick={() => onBannerChange && bannerInputRef.current?.click()}
      >
        {(bannerUrl || previewBanner) ? (
          <img 
            src={previewBanner || bannerUrl} 
            alt="Profile banner" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-purple-600/80 to-pink-600/80">
            <div className="text-center p-4 bg-black/20 rounded-lg backdrop-blur-sm">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="text-white text-sm">Click to upload banner</p>
              <p className="text-white/70 text-xs mt-1">
                {UPLOAD_GUIDELINES.banner.recommended} • Max 5MB
              </p>
            </div>
          </div>
        )}
        
        {onBannerChange && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                {isUploading === 'banner' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                {bannerUrl || previewBanner ? 'Change' : 'Upload'} Banner
              </Button>
              {(bannerUrl || previewBanner) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/30 hover:border-red-500/40 backdrop-blur-sm"
                  onClick={handleRemoveBanner}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              className="hidden"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleBannerChange}
            />
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6 -mt-16 relative z-10">
        <div className="flex justify-between items-start">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white/80 overflow-hidden">
              <div className="relative w-full h-full">
                <Avatar className="w-full h-full">
                  <AvatarImage src={previewAvatar || avatarUrl} alt={fullName || username} />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                    {fullName 
                      ? fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                      : username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                {onAvatarChange && (
                  <>
                    <div 
                      className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 text-center"
                      onClick={() => !isUploading && avatarInputRef.current?.click()}
                    >
                      {isUploading === 'avatar' ? (
                        <Loader2 className="w-6 h-6 animate-spin text-white mb-1" />
                      ) : (
                        <>
                          <Edit className="w-5 h-5 text-white mb-1" />
                          <p className="text-white text-xs">Change Photo</p>
                          <p className="text-white/70 text-[10px] mt-1">
                            {UPLOAD_GUIDELINES.avatar.recommended}
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept={ALLOWED_IMAGE_TYPES.join(',')}
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>
            </div>
            
            {onAvatarChange && (previewAvatar || avatarUrl) && (
              <Button
                variant="outline"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 min-w-0 bg-red-500/20 hover:bg-red-500/30 border-red-500/30 hover:border-red-500/40"
                onClick={handleRemoveAvatar}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Edit Profile Button */}
          <div className="flex gap-2 mt-4">
            {onEditProfile && (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-purple-500/50 text-white backdrop-blur-sm shadow-lg hover:shadow-purple-500/30 font-semibold"
                onClick={onEditProfile}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mt-4">
          <h1 className="text-2xl font-bold text-white">{fullName || username}</h1>
          <p className="text-gray-300">@{username}</p>
          
          {bio && <p className="mt-3 text-gray-200">{bio}</p>}
          
          <div className="flex items-center mt-3 space-x-4 text-sm text-gray-300">
            {location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{location}</span>
              </div>
            )}
            {joinDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Joined {joinDate}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-white font-semibold">{stats.posts.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{stats.followers.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-white font-semibold">{stats.following.toLocaleString()}</div>
              <div className="text-xs text-gray-400">Following</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
