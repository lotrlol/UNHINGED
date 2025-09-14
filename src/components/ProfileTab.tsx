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
                    <Badge key={skill} className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/30">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-6">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
              {profile.is_verified && (
                <div className="flex items-center gap-1 text-blue-400">
                  <Shield className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <BarChart2 className="w-4 h-4" />
                Analytics
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <MessageCircle className="w-4 h-4" />
                Messages
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Users className="w-4 h-4" />
                Collaborations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </GlassCard>
      </motion.div>

      {/* Content Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
        <GlassCard className="p-6 backdrop-blur-lg border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">My Content</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={handleCreateContent}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
            {contentLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : contentError ? (
              <div className="col-span-full text-center py-8">
                <p className="text-red-400 mb-4">Error loading content: {contentError}</p>
                <Button onClick={refetchContent} variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                  Try Again
                </Button>
              </div>
            ) : !userContent?.length ? (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-white mb-2">No content yet</h3>
                <p className="text-gray-300 mb-6">Start creating content to showcase your work</p>
                <Button
                  onClick={handleCreateContent}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Create Your First Content
                </Button>
              </div>
            ) : (
              userContent.map((item) => {
                const isSelected = selectedContentId === item.id;
                const thumbnailUrl = item.content_type === 'video' ? getVideoThumbnail(item) : item.thumbnail_url;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`relative group cursor-pointer ${
                      viewMode === 'grid' ? 'aspect-video' : 'flex gap-4 p-4'
                    } bg-white/5 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300`}
                    onClick={() => handleContentClick(item.id)}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="absolute inset-0">
                          {thumbnailUrl ? (
                            <img src={thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                              <span className="text-4xl">{getContentIcon(item.content_type)}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-black/50 text-white text-xs">{item.content_type}</Badge>
                            {item.external_url && (
                              <ExternalLink className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-sm line-clamp-2 mb-1">{item.title}</h3>
                          {item.description && (
                            <p className="text-gray-300 text-xs line-clamp-2 mb-2">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{formatDate(item.created_at)}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{item.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>{item.likes || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.content_type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                              <Play className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden">
                          {thumbnailUrl ? (
                            <img src={thumbnailUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                              <span className="text-xl">{getContentIcon(item.content_type)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-white/10 text-white text-xs">{item.content_type}</Badge>
                            {item.external_url && (
                              <ExternalLink className="w-3 h-3 text-gray-300" />
                            )}
                          </div>
                          <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">{item.title}</h3>
                          {item.description && (
                            <p className="text-gray-300 text-xs line-clamp-2 mb-2">{item.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>{formatDate(item.created_at)}</span>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{item.views || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                <span>{item.likes || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Create Content Modal */}
      {showCreateModal && (
        <CreateContentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onContentCreated={handleContentCreated}
        />
      )}
    </div>
  );
}