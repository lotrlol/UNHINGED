import React from 'react'
import { Settings, MapPin, Calendar, Shield, ExternalLink, Edit } from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { getInitials } from '../lib/utils'

export function ProfileTab() {
  const { profile, loading, error } = useProfile()
  const { signOut } = useAuth()

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-2xl"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading profile
          </h3>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 pb-20">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Complete your profile
          </h3>
          <p className="text-gray-600 mb-6">
            Set up your creator profile to start collaborating
          </p>
          <Button 
            variant="primary"
            onClick={() => {
              // This will trigger the onboarding flow
              window.location.reload()
            }}
          >
            Complete Profile
          </Button>
        </div>
      </div>
    )
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="p-4 pb-20">
      {/* Profile Header */}
      <Card className="mb-6">
        <div className="relative">
          {/* Cover Image */}
          <div className="h-32 bg-gradient-to-br from-purple-400 to-cyan-400 rounded-t-2xl">
            {profile.cover_url && (
              <img
                src={profile.cover_url}
                alt="Cover"
                className="w-full h-full object-cover rounded-t-2xl"
              />
            )}
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-600">
                  {getInitials(profile.full_name)}
                </span>
              )}
            </div>
          </div>

          {/* Settings Button */}
          <button className="absolute top-4 right-4 p-2 bg-white bg-opacity-90 rounded-full shadow-lg hover:bg-opacity-100 transition-all">
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <CardContent className="pt-16">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {profile.full_name}
              </h1>
              <p className="text-gray-600">@{profile.username}</p>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
          </div>

          {profile.tagline && (
            <p className="text-gray-700 mb-4">{profile.tagline}</p>
          )}

          {/* Roles */}
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Roles</h3>
            <div className="flex flex-wrap gap-2">
              {profile.roles.map((role) => (
                <Badge key={role} variant="default">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Looking For */}
          {profile.looking_for.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Looking to collaborate with</h3>
              <div className="flex flex-wrap gap-2">
                {profile.looking_for.map((role) => (
                  <Badge key={role} variant="success">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Vibe Words */}
          {profile.vibe_words.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Creative Vibe</h3>
              <div className="flex flex-wrap gap-2">
                {profile.vibe_words.map((word) => (
                  <Badge key={word} variant="secondary">
                    ✨ {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location & Details */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            {profile.is_verified && (
              <div className="flex items-center gap-1 text-green-600">
                <Shield className="w-4 h-4" />
                <span>Verified</span>
              </div>
            )}
          </div>

          {/* Remote Work */}
          {profile.is_remote && (
            <div className="mb-4">
              <Badge variant="success">🌍 Open to remote work</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card hover>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-medium text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600">View your stats</p>
          </CardContent>
        </Card>
        
        <Card hover>
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-medium text-gray-900">Messages</h3>
            <p className="text-sm text-gray-600">Active chats</p>
          </CardContent>
        </Card>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Settings</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Privacy & Safety</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Notifications</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-700">Account Verification</span>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors text-red-600"
          >
            <span>Sign Out</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}