import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar, Users, Heart, Loader2 } from 'lucide-react';
import { FriendsGlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useMatches } from '../hooks/useMatches';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getInitials } from '../lib/utils';
import { ChatModal } from './ChatModal';

export function MatchesTab() {
  const { user } = useAuth();
  const { matches, loading, error } = useMatches();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenChat = (chatId: string | null) => {
    if (chatId) {
      // Disable body scroll when modal is open
      document.body.style.overflow = 'hidden';
      setSelectedChatId(chatId);
      setShowChatModal(true);
    }
  };

  const handleCloseChat = () => {
    // Re-enable body scroll when modal is closed
    document.body.style.overflow = 'auto';
    setShowChatModal(false);
    setSelectedChatId(null);
  };

  if (!isClient) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-20">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Error loading connections
          </h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-pink-500"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20 relative">
      {/* Semi-transparent overlay that blocks interaction with content below */}
      {showChatModal && (
        <div 
          className="fixed inset-0 bg-black/70 z-[9997] pointer-events-auto"
          onClick={handleCloseChat}
        />
      )}
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-white">Your Connections</h2>
        <p className="text-gray-300">
          Connect and collaborate with your matches
        </p>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <FriendsGlassCard className="p-8 text-center">
          <div className="text-6xl mb-6">💫</div>
          <h3 className="text-xl font-semibold text-white mb-3">
            No connections yet
          </h3>
          <p className="text-gray-300 mb-6">
            Your perfect collaborators are waiting! Start connecting with creators now.
          </p>
          <Button 
            variant="primary" 
            onClick={() => {
              const event = new CustomEvent('switchTab', { detail: 'collabs' });
              window.dispatchEvent(event);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition-opacity"
          >
            Explore Projects
          </Button>
        </FriendsGlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <FriendsGlassCard
              key={match.id}
              className="mb-4 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20"
              variant="elevated"
            >
              <div 
                className="p-6 cursor-pointer"
                onClick={() => handleOpenChat(match.chat_id)}
              >
                {/* User Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-500/50 shadow-lg">
                    {match.other_user.avatar_url ? (
                      <img
                        src={match.other_user.avatar_url}
                        alt={match.other_user.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-xl font-bold">
                          {getInitials(match.other_user.full_name)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                      {match.other_user.full_name}
                      {match.other_user.is_verified && (
                        <Badge variant="success" size="sm" className="ml-1">✓</Badge>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {match.other_user.roles.slice(0, 3).map((role) => (
                        <Badge 
                          key={role}
                          variant="secondary" 
                          size="sm"
                          className="bg-white/10 text-gray-200 hover:bg-white/20"
                        >
                          {role}
                        </Badge>
                      ))}
                      {match.other_user.roles.length > 3 && (
                        <Badge 
                          variant="secondary" 
                          size="sm"
                          className="bg-white/10 text-gray-400 hover:bg-white/20"
                        >
                          +{match.other_user.roles.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Projects */}
                    {match.projects.length > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                          <Users className="w-4 h-4" />
                          <span>Shared Projects</span>
                        </div>
                        <div className="space-y-2">
                          {match.projects.slice(0, 2).map((project) => (
                            <div key={project.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                              <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">
                                  {project.title.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-white truncate">{project.title}</span>
                            </div>
                          ))}
                          {match.projects.length > 2 && (
                            <div className="text-xs text-gray-400 pl-10">
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
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-purple-200">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Matched {formatDate(match.created_at)}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:opacity-90 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenChat(match.chat_id);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" />
                      Message
                    </Button>
                </div>
              </div>
            </FriendsGlassCard>
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && selectedChatId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <ChatModal 
            isOpen={showChatModal} 
            onClose={handleCloseChat} 
            chatId={selectedChatId} 
          />
        </div>
      )}
    </div>
  );
}