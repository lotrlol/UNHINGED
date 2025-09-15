import React, { useState, useEffect } from 'react';
import { MessageCircle, Calendar, Users, Heart, Loader2, ChevronRight } from 'lucide-react';
import { FriendsGlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { useMatches } from '../hooks/useMatches';
import { useAuth } from '../hooks/useAuth';
import { formatDate, getInitials } from '../lib/utils';
import { ChatModal } from './ChatModal';
import { useChat } from '../hooks/useChat';

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
      document.body.style.overflow = 'hidden';
      setSelectedChatId(chatId);
      setShowChatModal(true);
    }
  };

  const handleCloseChat = () => {
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
      <div className="mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-white">Messages</h2>
        <p className="text-gray-300">
          Your ongoing conversations
        </p>
      </div>

      {/* Chat List */}
      {matches.length === 0 ? (
        <FriendsGlassCard className="p-8 text-center">
          <div className="text-6xl mb-6">💫</div>
          <h3 className="text-xl font-semibold text-white mb-3">
            No conversations yet
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
        <div className="space-y-2">
          {matches.map((match) => (
            <ChatListItem
              key={match.id}
              match={match}
              onOpenChat={handleOpenChat}
            />
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

// Chat List Item Component
interface ChatListItemProps {
  match: any;
  onOpenChat: (chatId: string | null) => void;
}

function ChatListItem({ match, onOpenChat }: ChatListItemProps) {
  const { messages, loading: messagesLoading } = useChat(match.chat_id);
  const lastMessage = messages[messages.length - 1];
  
  // Format last message time
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Truncate message content
  const truncateMessage = (content: string, maxLength: number = 50) => {
    // Handle media messages
    if (content.startsWith('[image]')) return '📷 Photo';
    if (content.startsWith('[video]')) return '🎥 Video';
    
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div
      className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-[0.98]"
      onClick={() => onOpenChat(match.chat_id)}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
          {match.other_user.avatar_url ? (
            <img
              src={match.other_user.avatar_url}
              alt={match.other_user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {getInitials(match.other_user.full_name)}
              </span>
            </div>
          )}
        </div>
        
        {/* Online status indicator (placeholder) */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-900 rounded-full"></div>
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">
              {match.other_user.full_name}
            </h3>
            {match.other_user.is_verified && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          
          {/* Time */}
          {lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatMessageTime(lastMessage.created_at)}
            </span>
          )}
        </div>

        {/* Last Message */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-300 truncate flex-1">
            {messagesLoading ? (
              <span className="text-gray-500">Loading...</span>
            ) : lastMessage ? (
              <>
                {lastMessage.sender_id === match.other_user.id ? '' : 'You: '}
                {truncateMessage(lastMessage.content)}
              </>
            ) : (
              <span className="text-gray-500 italic">Start a conversation...</span>
            )}
          </p>
          
          {/* Unread indicator and chevron */}
          <div className="flex items-center gap-2 ml-2">
            {/* Unread count placeholder */}
            {false && (
              <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Match context (projects) */}
        {match.projects.length > 0 && (
          <div className="mt-2 flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-400" />
            <span className="text-xs text-purple-300">
              {match.projects.length === 1 
                ? match.projects[0].title 
                : `${match.projects.length} shared projects`
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}