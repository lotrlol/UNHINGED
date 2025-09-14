import { MapPin, Calendar, MessageCircle, Globe, Mail, Check, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { getInitials } from '../lib/utils';
import { ProfileGlassCard } from './ui/GlassCard';
import { motion } from 'framer-motion';

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    username: string
    full_name: string
    roles: string[]
    skills?: string[]
    looking_for?: string[]
    tagline: string | null
    vibe_words?: string[]
    location: string | null
    is_remote?: boolean
    avatar_url: string | null
    cover_url?: string | null
    is_verified: boolean
    created_at: string
  } | null
}

export function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ProfileGlassCard onClose={onClose}>
          {/* Cover Image */}
          <div className="relative h-40 bg-gradient-to-r from-purple-900/80 to-cyan-900/60">
            {user.cover_url && (
              <img
                src={user.cover_url}
                alt="Cover"
                className="w-full h-full object-cover mix-blend-overlay opacity-70"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/80" />
            
            {/* Avatar */}
            <div className="absolute -bottom-12 left-6">
              <div className="w-24 h-24 rounded-2xl border-4 border-white/20 bg-gray-800 shadow-xl overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl">
                    {getInitials(user.full_name || user.username)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="pt-16 px-6 pb-6">
            {/* User Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-white">
                      {user.full_name || user.username}
                    </h2>
                    {user.is_verified && (
                      <Check className="w-5 h-5 ml-2 text-cyan-400" />
                    )}
                  </div>
                  <p className="text-gray-400">@{user.username}</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="rounded-full bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>

              {user.tagline && (
                <p className="mt-3 text-gray-300">{user.tagline}</p>
              )}

              {/* Location and Joined */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-400">
                {user.location && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-purple-400" />
                    <span>{user.location}</span>
                    {user.is_remote && <span className="ml-1.5 text-cyan-400">• Remote</span>}
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 text-purple-400" />
                  <span>Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-5">
              {user.roles && user.roles.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.roles.map((role) => (
                      <Badge key={role} className="bg-purple-500/10 text-purple-300 border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.skills && user.skills.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                      <Badge key={skill} className="bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition-colors">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.looking_for && user.looking_for.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Looking For
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.looking_for.map((item) => (
                      <Badge
                        key={item}
                        className="text-cyan-300 border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors"
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {user.vibe_words && user.vibe_words.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Vibe Words
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {user.vibe_words.map((word) => (
                      <Badge
                        key={word}
                        className="bg-pink-500/10 text-pink-300 border-pink-500/20 hover:bg-pink-500/20 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 mr-1.5" />
                        {word}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Contact Info</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="text-sm">email@example.com</span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Globe className="w-4 h-4 mr-3 text-gray-400" />
                  <a href="#" className="text-sm hover:text-cyan-400 transition-colors">portfolio.com</a>
                </div>
              </div>
            </div>
          </div>
        </ProfileGlassCard>
      </motion.div>
    </div>
  )
}