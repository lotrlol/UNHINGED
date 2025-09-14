import React, { useState, useEffect } from 'react';
import {
  Settings,
  MapPin,
  Calendar,
  Shield,
  ExternalLink,
  Edit,
  BarChart2,
  MessageCircle,
  Users,
  LogOut,
  Grid3X3,
  List,
  Play,
  Heart,
  Eye,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { getInitials, formatDate } from '../lib/utils';
import { CardContent } from './ui/Card';
import { CreateContentModal } from './CreateContentModal';

type ViewMode = 'grid' | 'list';

export function ProfileTab() {
  const { profile, loading, error } = useProfile();
  const { signOut, user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);

  // Fetch user's content
  const {
    content: userContent,
    loading: contentLoading,
    error: contentError,
    refetch: refetchContent,
  } = useContent(user?.id ? { creator_id: user.id } : undefined);

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
    if (item.thumbnail_url) return item.thumbnail_url;

    if (item.external_url && (item.external_url.includes('youtube.com') || item.external_url.includes('youtu.be'))) {
      const videoId =
        item.external_url.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
        )?.[1];
      if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    if (item.content_type === 'video' && item.external_url) return item.external_url;
    return null;
  };

  const handleContentClick = (contentId: string) => {
    setSelectedContentId((prev) => (prev === contentId ? null : contentId));
  };

  const handleCreateContent = () => setShowCreateModal(true);

  const handleContentCreated = () => {
    setShowCreateModal(false);
    refetchContent();
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
          <p className="text-gray-300 mb-6">{error}</p>
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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
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

      {/* Profile Banner & Avatar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative mb-8">
        <GlassCard className="relative overflow-hidden p-0 backdrop-blur-lg border border-white/10 bg-white/5">
          <div className="relative h-56 w-full">
            {profile.cover_url ? (
              <img src={profile.cover_url} alt="Profile banner" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-indigo-600/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          <div className="absolute -bottom-16 left-6 flex items-end space-x-4">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 p-0.5 transform group-hover:scale-105 transition-transform duration-300">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-900/80 bg-gray-800">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="eager"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <span className="text-4xl font-bold text-gray-300">{getInitials(profile.full_name)}</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="absolute -bottom-2 -right-2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors duration-200">
                <Edit className="w-4 h-4 text-gray-800" />
              </button>
            </div>

            <div className="hidden md:block mb-4 ml-2">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{profile.full_name}</h1>
              <p className="text-gray-300 text-sm">@{profile.username}</p>
            </div>
          </div>

          <button className="absolute top-4 right-4 p-2 bg-black/40 rounded-full backdrop-blur-md shadow-lg hover:bg-black/60 transition-colors">
            <Settings className="w-5 h-5 text-gray-200" />
          </button>

          <CardContent className="pt-24 pb-8 px-6">
            <div className="md:hidden flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                <p className="text-gray-300">@{profile.username}</p>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            {profile.tagline && <p className="text-gray-300 italic mb-6">{profile.tagline}</p>}

            {!!profile.roles?.length && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role: string) => (
                    <Badge key={role} className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!!profile.skills?.length && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill: string) => (
                    <Badge key={skill} className="bg-black/40 text-gray-200 border border-white/20 hover:bg-black/60 transition-colors">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!!profile.looking_for?.length && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Looking to collaborate with</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((role: string) => (
                    <Badge key={role} className="bg-green-900/30 text-green-300 border border-green-800/50">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!!profile.vibe_words?.length && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Creative Vibe</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.vibe_words.map((word: string) => (
                    <Badge key={word} className="bg-purple-900/30 text-purple-300 border border-purple-800/50">
                      ✨ {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-5">
              {profile.location && (
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
              {profile.is_verified && (
                <div className="flex items-center gap-2 bg-green-900/30 text-green-300 px-3 py-1.5 rounded-full">
                  <Shield className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
              {profile.is_remote && (
                <div className="flex items-center gap-2 bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded-full">
                  🌍 <span>Open to remote work</span>
                </div>
              )}
            </div>
          </CardContent>
        </GlassCard>
      </motion.div>

      {/* Content */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-8">
        <GlassCard className="overflow-hidden">
          {/* Header */}
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
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' ? 'bg-purple-600/50 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  onClick={handleCreateContent}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-300">
              <span>{userContent?.length || 0} posts</span>
              <span>
                {userContent?.reduce((sum: number, item: any) => sum + (item.view_count || 0), 0) || 0} total views
              </span>
              <span>
                {userContent?.reduce((sum: number, item: any) => sum + (item.like_count || 0), 0) || 0} total likes
              </span>
            </div>
          </div>

          {/* Grid / List */}
          <div className="p-6">
            {contentLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : contentError ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-400 mb-4">Error loading content</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchContent()}
                  className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  Retry
                </Button>
              </div>
            ) : !userContent || userContent.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🎨</div>
                <h4 className="text-xl font-semibold text-white mb-3">No content yet</h4>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Start sharing your creative work to build your portfolio and attract collaborators.
                </p>
                <Button
                  onClick={handleCreateContent}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Post
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              // GRID VIEW
              <div className="grid grid-cols-3 gap-2 sm:gap-4 auto-rows-fr">
                {userContent.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="relative aspect-square bg-black/40 rounded-lg overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => handleContentClick(item.id)}
                  >
                    {item.thumbnail_url ? (
                      <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-600/40 to-pink-600/40 flex items-center justify-center">
                        <span className="text-4xl">{getContentIcon(item.content_type)}</span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="text-center text-white">
                        {item.content_type === 'video' && <Play className="w-8 h-8 mx-auto mb-2" />}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{item.like_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{item.view_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-2 left-2">
                      <Badge className="bg-black/60 text-white border-0 text-xs">{getContentIcon(item.content_type)}</Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // LIST VIEW
              <div className="space-y-4">
                {userContent.map((item: any, index: number) => {
                  const isSelected = selectedContentId === item.id;
                  const thumbnailUrl = item.content_type === 'video' ? getVideoThumbnail(item) : item.thumbnail_url;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, scale: isSelected ? 1.02 : 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`relative flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer group ${
                        isSelected ? 'bg-black/60 border border-purple-500/40 shadow-purple-500/20 shadow-lg' : 'bg-black/40'
                      }`}
                      onClick={() => handleContentClick(item.id)}
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-600/40 to-pink-600/40">
                        {thumbnailUrl ? (
                          <div className="relative w-full h-full">
                            {/* If selected & video, show player; otherwise image */}
                            {isSelected && item.content_type === 'video' && item.external_url ? (
                              <div className="absolute inset-0 bg-black">
                                {item.external_url.includes('youtube.com') || item.external_url.includes('youtu.be') ? (
                                  <iframe
                                    src={`https://www.youtube.com/embed/${
                                      item.external_url.match(
                                        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
                                      )?.[1]
                                    }?autoplay=1&rel=0&modestbranding=1`}
                                    className="w-full h-full"
                                    frameBorder={0}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    allowFullScreen
                                  />
                                ) : (
                                  <video
                                    src={item.external_url}
                                    className="w-full h-full object-contain"
                                    controls
                                    autoPlay
                                    muted
                                    playsInline
                                  />
                                )}
                              </div>
                            ) : (
                              <img
                                src={thumbnailUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl">{getContentIcon(item.content_type)}</span>
                          </div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                          {item.title || 'Untitled'}
                        </h4>
                        {item.description && (
                          <p className="text-gray-400 text-sm line-clamp-1 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {item.like_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.view_count || 0}
                          </span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Badges / actions */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-900/30 text-purple-300 border border-purple-800/50">
                          {item.content_type}
                        </Badge>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-md backdrop-blur-md">
          <CardContent className="p-5 text-center">
            <div className="flex justify-center items-center mb-3">
              <BarChart2 className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-medium text-white mb-1">Analytics</h3>
            <p className="text-sm text-gray-300/80">View your stats and growth</p>
          </CardContent>
        </motion.div>

        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-md backdrop-blur-md">
          <CardContent className="p-5 text-center">
            <div className="flex justify-center items-center mb-3">
              <MessageCircle className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-medium text-white mb-1">Messages</h3>
            <p className="text-sm text-gray-300/80">Active chats</p>
          </CardContent>
        </motion.div>

        <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} className="relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-md backdrop-blur-md">
          <CardContent className="p-5 text-center">
            <div className="flex justify-center items-center mb-3">
              <Users className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-medium text-white mb-1">Collaborators</h3>
            <p className="text-sm text-gray-300/80">Discover partners to create with</p>
          </CardContent>
        </motion.div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-black/40 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-md"
      >
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Account & Settings</h3>
        </div>
        <div className="p-2 space-y-1">
          <button className="w-full flex items-center justify-between p-3 hover:bg-black/50 rounded-xl transition-colors group">
            <span className="text-gray-300 group-hover:text-white">Privacy & Safety</span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-black/50 rounded-xl transition-colors group">
            <span className="text-gray-300 group-hover:text-white">Notifications</span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-black/50 rounded-xl transition-colors group">
            <span className="text-gray-300 group-hover:text-white">Account Verification</span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-3 hover:bg-red-900/30 rounded-xl transition-colors group text-red-400 hover:text-red-300"
          >
            <span>Sign Out</span>
            <LogOut className="w-4 h-4 text-red-500/80 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </motion.div>

      {/* Create Content Modal */}
      <CreateContentModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onContentCreated={handleContentCreated} />
    </div>
  );
}
