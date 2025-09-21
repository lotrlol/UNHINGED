import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Camera, 
  MapPin, 
  User, 
  Users, 
  Sparkles, 
  Settings,
  Upload,
  Loader2
} from 'lucide-react';
import { Badge } from './ui/Badge';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { CREATOR_ROLES, CREATIVE_TAGS } from '../lib/utils';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function EditProfileModal({ isOpen, onClose, onSave }: EditProfileModalProps) {
  const { user } = useAuth();
  const { profile, updateProfile, uploadFile } = useProfile();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    tagline: '',
    location: '',
    is_remote: false,
    nsfw_preference: false,
    roles: [] as string[],
    skills: [] as string[],
    looking_for: [] as string[],
    vibe_words: [] as string[],
  });

  const [previewUrls, setPreviewUrls] = useState({
    avatar: null as string | null,
    banner: null as string | null,
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && isOpen) {
      setFormData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        tagline: profile.tagline || '',
        location: profile.location || '',
        is_remote: profile.is_remote || false,
        nsfw_preference: profile.nsfw_preference || false,
        roles: profile.roles || [],
        skills: profile.skills || [],
        looking_for: profile.looking_for || [],
        vibe_words: profile.vibe_words || [],
      });
      setPreviewUrls({
        avatar: profile.avatar_url || null,
        banner: profile.banner_url || profile.cover_url || null,
      });
    }
  }, [profile, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const validateFile = (file: File, type: 'avatar' | 'banner') => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error(`Please upload a valid image (JPEG, PNG, WebP, or GIF)`);
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB.`);
      return false;
    }

    return true;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, 'avatar')) return;

    setUploadingAvatar(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({ ...prev, avatar: previewUrl }));

      const { data, error } = await uploadFile(file, 'avatar');
      if (error) throw error;

      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
      setPreviewUrls(prev => ({ ...prev, avatar: profile?.avatar_url || null }));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateFile(file, 'banner')) return;

    setUploadingBanner(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({ ...prev, banner: previewUrl }));

      const { data, error } = await uploadFile(file, 'banner');
      if (error) throw error;

      toast.success('Banner updated successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
      setPreviewUrls(prev => ({ ...prev, banner: profile?.banner_url || profile?.cover_url || null }));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.username.trim() || !formData.full_name.trim()) {
        throw new Error('Username and full name are required');
      }

      const { data, error } = await updateProfile({
        username: formData.username.trim(),
        full_name: formData.full_name.trim(),
        tagline: formData.tagline.trim() || null,
        location: formData.location.trim() || null,
        is_remote: formData.is_remote,
        nsfw_preference: formData.nsfw_preference,
        roles: formData.roles,
        skills: formData.skills,
        looking_for: formData.looking_for,
        vibe_words: formData.vibe_words,
      });

      if (error) throw error;

      setSuccess('Profile updated successfully! 🎉');
      toast.success('Profile updated successfully');
      
      setTimeout(() => {
        onSave?.();
        onClose();
        setSuccess('');
      }, 1500);

    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gray-900"
      >
        {/* Animated background blobs */}
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-full blur-3xl opacity-20"
          animate={{ rotate: 360 }}
          transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-full blur-3xl opacity-15"
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        />

        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-3 sm:p-4 bg-gray-800/90 backdrop-blur-md border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-white">Edit Profile</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-80px)] overflow-y-auto">
          <div className="w-full max-w-4xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300"
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Profile Images Section */}
              <div className="relative">
                {/* Banner */}
                <div
                  className="relative h-32 sm:h-48 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {previewUrls.banner ? (
                    <img
                      src={previewUrls.banner}
                      alt="Profile banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-2 sm:p-4 bg-black/20 rounded-lg backdrop-blur-sm">
                        <Camera className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-white" />
                        <p className="text-white text-xs sm:text-sm">Click to upload banner</p>
                        <p className="text-white/70 text-xs mt-1 hidden sm:block">1500x500px recommended</p>
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-3 sm:px-4 py-2 rounded-lg">
                      {uploadingBanner ? (
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin inline" />
                      ) : (
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-2 inline" />
                      )}
                      <span className="text-xs sm:text-sm">{previewUrls.banner ? 'Change' : 'Upload'} Banner</span>
                    </div>
                  </div>

                  <input
                    ref={bannerInputRef}
                    type="file"
                    className="hidden"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    onChange={handleBannerChange}
                  />
                </div>

                {/* Avatar */}
                <div className="absolute -bottom-6 sm:-bottom-8 left-3 sm:left-6">
                  <div
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-black/50 backdrop-blur-md border-2 border-white/20 overflow-hidden group cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {previewUrls.avatar ? (
                      <img
                        src={previewUrls.avatar}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500">
                        <span className="text-white text-sm sm:text-lg font-bold">
                          {formData.full_name
                            ? formData.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                            : formData.username.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-white" />
                      ) : (
                        <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </div>

                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept={ALLOWED_IMAGE_TYPES.join(',')}
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="pt-8 sm:pt-12 space-y-4">
                <div className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Basic Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Username *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => updateFormData({ username: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Your unique username"
                        required
                        maxLength={30}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => updateFormData({ full_name: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Your display name"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        Tagline
                      </label>
                      <input
                        type="text"
                        value={formData.tagline}
                        onChange={(e) => updateFormData({ tagline: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="A short bio or creative motto"
                        maxLength={150}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.tagline.length}/150 characters
                      </p>
                    </div>
                  </div>
                </div>

                {/* Creator Roles */}
                <div className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Creator Roles</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {CREATOR_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => updateFormData({ roles: toggleArrayItem(formData.roles, role) })}
                        className={`p-2 sm:p-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                          formData.roles.includes(role)
                            ? 'bg-gradient-to-r from-pink-600/40 to-purple-600/40 border border-pink-500/50 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {formData.roles.length > 0 && (
                    <div className="mt-4 p-3 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                      <p className="text-xs text-pink-300 mb-2">Selected roles:</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {formData.roles.map((role) => (
                          <Badge key={role} className="bg-pink-600/40 text-pink-200 border-pink-500/30 text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Looking For */}
                <div className="bg-gray-800 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Looking to Collaborate With</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {CREATOR_ROLES.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => updateFormData({ looking_for: toggleArrayItem(formData.looking_for, role) })}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${
                          formData.looking_for.includes(role)
                            ? 'bg-gradient-to-r from-cyan-600/40 to-blue-600/40 border border-cyan-500/50 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  {formData.looking_for.length > 0 && (
                    <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                      <p className="text-xs text-cyan-300 mb-2">Looking for:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.looking_for.map((role) => (
                          <Badge key={role} className="bg-cyan-600/40 text-cyan-200 border-cyan-500/30 text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                </div>
                  )}
                  </div>

                {/* Skills */}
                <div className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Skills</h3>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Type a skill and press Enter to add..."
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const skill = e.currentTarget.value.trim();
                          if (skill && !formData.skills.includes(skill)) {
                            updateFormData({ skills: [...formData.skills, skill] });
                            e.currentTarget.value = '';
                          }
                        }
                      }}
                    />

                    {formData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <div
                            key={skill}
                            className="flex items-center gap-1 bg-green-600/20 text-green-300 border border-green-500/30 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => updateFormData({ skills: formData.skills.filter(s => s !== skill) })}
                              className="text-green-300 hover:text-red-300 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Creative Vibes */}
                <div className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Creative Vibes</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CREATIVE_TAGS.map((vibe) => (
                      <button
                        key={vibe}
                        type="button"
                        onClick={() => updateFormData({ vibe_words: toggleArrayItem(formData.vibe_words, vibe) })}
                        className={`p-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          formData.vibe_words.includes(vibe)
                            ? 'bg-gradient-to-r from-yellow-600/40 to-orange-600/40 border border-yellow-500/50 text-white'
                            : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        {vibe}
                      </button>
                    ))}
                  </div>

                  {formData.vibe_words.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs text-yellow-300 mb-2">Your vibes:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.vibe_words.map((vibe) => (
                          <Badge key={vibe} className="bg-yellow-600/40 text-yellow-200 border-yellow-500/30 text-xs">
                            {vibe}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Location</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                        City, State/Country
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => updateFormData({ location: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="e.g., Los Angeles, CA"
                        maxLength={100}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="remote"
                        checked={formData.is_remote}
                        onChange={(e) => updateFormData({ is_remote: e.target.checked })}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 bg-white/5 border-white/20"
                      />
                      <label htmlFor="remote" className="text-xs sm:text-sm text-gray-300">
                        Open to remote collaborations
                      </label>
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-gray-800 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <h3 className="text-base sm:text-lg font-semibold text-white">Preferences</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="nsfw"
                        checked={formData.nsfw_preference}
                        onChange={(e) => updateFormData({ nsfw_preference: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-purple-500 rounded focus:ring-purple-500 bg-white/5 border-white/20"
                      />
                      <div className="flex-1">
                        <label htmlFor="nsfw" className="text-xs sm:text-sm font-medium text-gray-300">
                          Show NSFW content
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Enable to view content that may not be suitable for all audiences
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="sticky bottom-0 bg-gray-900 pt-6 pb-4">
                <motion.button
                  type="submit"
                  disabled={loading || uploadingAvatar || uploadingBanner}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Profile
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}