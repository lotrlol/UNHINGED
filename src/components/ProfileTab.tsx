import React from 'react';
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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useProfile } from '../hooks/useProfile';
    import { useAuth } from '../hooks/useAuth';
    import { getInitials } from '../lib/utils';
    import { CardContent } from './ui/Card';

export function ProfileTab() {
  const { profile, loading, error } = useProfile();
  const { signOut } = useAuth();

  if (loading) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-700/50 rounded-2xl"></div>
            <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700/50 rounded w-1/2"></div>
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
          <h3 className="text-xl font-semibold text-white mb-2">
            Error loading profile
          </h3>
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
          <h3 className="text-xl font-semibold text-white mb-2">
            Complete your profile
          </h3>
          <p className="text-gray-300 mb-6">
            Set up your creator profile to start collaborating
          </p>
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
      {/* Dynamic gradient blobs for background depth */}
      <motion.div
        className="absolute -top-16 -left-16 w-80 h-80 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-full blur-3xl opacity-30"
        animate={{ rotate: 360 }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-full blur-3xl opacity-20"
        animate={{ rotate: -360 }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Profile Banner & Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative mb-24"
      >
        <GlassCard className="relative overflow-hidden p-0 backdrop-blur-lg border border-white/10 bg-white/5">
          {/* Banner Image with Overlay */}
          <div className="relative h-56 w-full">
            {profile.cover_url ? (
              <img 
                src={profile.cover_url} 
                alt="Profile banner" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600/40 via-pink-600/40 to-indigo-600/40" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>

          {/* Avatar Container */}
          <div className="absolute -bottom-16 left-6 flex items-end space-x-4">
            {/* Avatar with Gradient Border */}
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
                      <span className="text-4xl font-bold text-gray-300">
                        {getInitials(profile.full_name)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Edit Button */}
              <button className="absolute -bottom-2 -right-2 p-2 bg-white/90 rounded-full shadow-lg hover:bg-white transition-colors duration-200">
                <Edit className="w-4 h-4 text-gray-800" />
              </button>
            </div>
            
            {/* User Info (visible on larger screens) */}
            <div className="hidden md:block mb-4 ml-2">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">{profile.full_name}</h1>
              <p className="text-gray-300 text-sm">@{profile.username}</p>
            </div>
          </div>

          {/* Settings Button */}
          <button className="absolute top-4 right-4 p-2 bg-black/40 rounded-full backdrop-blur-md shadow-lg hover:bg-black/60 transition-colors">
            <Settings className="w-5 h-5 text-gray-200" />
          </button>

          {/* Main Content */}
          <CardContent className="pt-24 pb-8 px-6">
            {/* Name and edit button (mobile) */}
            <div className="md:hidden flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.full_name}</h1>
                <p className="text-gray-300">@{profile.username}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            </div>

            {/* Tagline */}
            {profile.tagline && (
              <p className="text-gray-300 italic mb-6">{profile.tagline}</p>
            )}

            {/* Roles */}
            {profile.roles.length > 0 && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.roles.map((role) => (
                    <Badge
                      key={role}
                      className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white border border-purple-500/30"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            {profile.skills.length > 0 && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="bg-black/40 text-gray-200 border border-white/20 hover:bg-black/60 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Looking For */}
            {profile.looking_for.length > 0 && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">
                  Looking to collaborate with
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((role) => (
                    <Badge
                      key={role}
                      className="bg-green-900/30 text-green-300 border border-green-800/50"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Vibe Words */}
            {profile.vibe_words.length > 0 && (
              <div className="mb-5">
                <h3 className="font-medium text-gray-200 mb-2">Creative Vibe</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.vibe_words.map((word) => (
                    <Badge
                      key={word}
                      className="bg-purple-900/30 text-purple-300 border border-purple-800/50"
                    >
                      ✨ {word}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Details */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-5">
              {profile.location && (
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{profile.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
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

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {/* Analytics */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-md backdrop-blur-md"
        >
          <CardContent className="p-5 text-center">
            <div className="flex justify-center items-center mb-3">
              <BarChart2 className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-medium text-white mb-1">Analytics</h3>
            <p className="text-sm text-gray-300/80">
              View your stats and growth
            </p>
          </CardContent>
        </motion.div>

        {/* Messages */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-md backdrop-blur-md"
        >
          <CardContent className="p-5 text-center">
            <div className="flex justify-center items-center mb-3">
              <MessageCircle className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-medium text-white mb-1">Messages</h3>
            <p className="text-sm text-gray-300/80">Active chats</p>
          </CardContent>
        </motion.div>

        {/* Collaborators */}
        <motion.div
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="relative overflow-hidden bg-black/40 rounded-2xl border border-white/10 shadow-md backdrop-blur-md"
        >
          <CardContent className="p-5 text-center">
            <div className="flex justify-center items-center mb-3">
              <Users className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="font-medium text-white mb-1">Collaborators</h3>
            <p className="text-sm text-gray-300/80">
              Discover partners to create with
            </p>
          </CardContent>
        </motion.div>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-black/40 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 shadow-md"
      >
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white">Account & Settings</h3>
        </div>
        <div className="p-2 space-y-1">
          <button className="w-full flex items-center justify-between p-3 hover:bg-black/50 rounded-xl transition-colors group">
            <span className="text-gray-300 group-hover:text-white">
              Privacy & Safety
            </span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-black/50 rounded-xl transition-colors group">
            <span className="text-gray-300 group-hover:text-white">
              Notifications
            </span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-colors" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-black/50 rounded-xl transition-colors group">
            <span className="text-gray-300 group-hover:text-white">
              Account Verification
            </span>
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
    </div>
  );
}
