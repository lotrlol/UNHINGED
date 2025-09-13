import React from 'react'
import { X, MapPin, Calendar, Shield, Users, Sparkles, Heart } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card, CardContent } from './ui/Card'
import { formatDate, getInitials } from '../lib/utils'

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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-t-2xl">
            {user.cover_url && (
              <img
                src={user.cover_url}
                alt="Cover"
                className="w-full h-full object-cover rounded-t-2xl"
              />
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {getInitials(user.full_name)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-16">
          {/* Basic Info */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                {user.full_name}
                {user.is_verified && (
                  <Badge variant="success" size="sm">✓</Badge>
                )}
              </h1>
              <p className="text-gray-600">@{user.username}</p>
            </div>
            <Button variant="primary" size="sm" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Connect
            </Button>
          </div>

          {/* Tagline */}
          {user.tagline && (
            <p className="text-gray-700 mb-4 italic">"{user.tagline}"</p>
          )}

          {/* Roles */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Creator Roles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role} variant="default">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <h3 className="font-medium text-gray-900">Skills</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Looking For */}
          {user.looking_for && user.looking_for.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-pink-600" />
                <h3 className="font-medium text-gray-900">Looking to collaborate with</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.looking_for.map((role) => (
                  <Badge key={role} variant="success">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Vibe Words */}
          {user.vibe_words && user.vibe_words.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-gray-900">Creative Vibe</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {user.vibe_words.map((word) => (
                  <Badge key={word} variant="secondary">
                    ✨ {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location & Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-6">
            {user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.is_remote && (
              <Badge variant="success" size="sm">🌍 Remote OK</Badge>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {formatDate(user.created_at)}</span>
            </div>
            {user.is_verified && (
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-4 h-4" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button variant="primary" className="flex-1">
              Start Collaboration
            </Button>
            <Button variant="outline" className="flex-1">
              View Portfolio
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}