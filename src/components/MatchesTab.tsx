import React, { useState } from 'react'
import { MessageCircle, Calendar, Users, Heart, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { useMatches } from '../hooks/useMatches'
import { useAuth } from '../hooks/useAuth'
import { formatDate, getInitials } from '../lib/utils'
import { ChatModal } from './ChatModal'

export function MatchesTab() {
  const { user } = useAuth()
  const { matches, loading, error } = useMatches()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)

  const handleOpenChat = (chatId: string | null) => {
    if (chatId) {
      setSelectedChatId(chatId)
      setShowChatModal(true)
    }
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
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
            Error loading matches
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Matches</h2>
        <p className="text-gray-600">
          Connect with creators you've matched with
        </p>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💫</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No matches yet
          </h3>
          <p className="text-gray-600 mb-6">
            Keep applying to projects and creating your own to find your perfect collaborators!
          </p>
          <Button variant="primary" onClick={() => {
            // Switch to collabs tab
            const event = new CustomEvent('switchTab', { detail: 'collabs' })
            window.dispatchEvent(event)
          }}>
            Explore Projects
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            return (
              <Card key={match.id} hover>
                <CardContent className="p-0">
                  <div 
                    className="flex gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      console.log('User card clicked, match:', match.id, 'chat_id:', match.chat_id)
                      handleOpenChat(match.chat_id)
                    }}
                  >
                    {/* User Avatar */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
                      {match.other_user.avatar_url ? (
                        <img
                          src={match.other_user.avatar_url}
                          alt={match.other_user.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center">
                          <span className="text-white text-lg font-bold">
                            {getInitials(match.other_user.full_name)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Match Info */}
                    <div className="flex-1 min-w-0">
                      {/* User Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                            {match.other_user.full_name}
                            {match.other_user.is_verified && (
                              <Badge variant="success" size="sm">✓</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">@{match.other_user.username}</p>
                        </div>
                      </div>

                      {/* User Roles */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {match.other_user.roles.slice(0, 3).map((role) => (
                          <Badge key={role} variant="secondary" size="sm">
                            {role}
                          </Badge>
                        ))}
                        {match.other_user.roles.length > 3 && (
                          <Badge variant="secondary" size="sm">
                            +{match.other_user.roles.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Match Type and Projects */}
                      <div className="space-y-2 mb-3">
                        {match.match_type === 'direct' && (
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-pink-500 fill-current" />
                            <span className="text-sm font-medium text-gray-700">Direct Match</span>
                          </div>
                        )}
                        
                        {match.projects.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span className="text-sm font-medium text-gray-700">
                                Project{match.projects.length > 1 ? 's' : ''}:
                              </span>
                            </div>
                            <div className="space-y-1">
                              {match.projects.slice(0, 2).map((project) => (
                                <div key={project.id} className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">
                                      {project.title.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-700 truncate">{project.title}</span>
                                </div>
                              ))}
                              {match.projects.length > 2 && (
                                <div className="text-xs text-gray-500 ml-8">
                                  +{match.projects.length - 2} more project{match.projects.length > 3 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match Type Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        {match.match_type === 'both' && (
                          <Badge variant="default" size="sm">
                            <Heart className="w-3 h-3 mr-1 fill-current" />
                            Multiple Matches
                          </Badge>
                        )}
                        {match.match_type === 'project' && (
                          <Badge variant="secondary" size="sm">
                            <Users className="w-3 h-3 mr-1" />
                            Project Match
                          </Badge>
                        )}
                        {match.match_type === 'direct' && (
                          <Badge variant="success" size="sm">
                            <Heart className="w-3 h-3 mr-1 fill-current" />
                            Direct Match
                          </Badge>
                        )}
                      </div>

                      {/* Bottom Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>Latest: {formatDate(match.latest_match_date)}</span>
                        </div>

                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent card click
                            console.log('Chat button clicked, match:', match.id, 'chat_id:', match.chat_id)
                            handleOpenChat(match.chat_id)
                          }}
                          className="flex items-center gap-2"
                          disabled={!match.chat_id || match.chat_id === null}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {match.chat_id ? 'Chat' : 'No Chat'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => {
          setShowChatModal(false)
          setSelectedChatId(null)
        }}
        chatId={selectedChatId}
      />
    </div>
  )
}