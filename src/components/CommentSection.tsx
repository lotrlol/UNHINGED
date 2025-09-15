import React, { useState, useRef, useEffect } from 'react'
import { Heart, Reply, MoreHorizontal, Send, Loader2, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from './ui/Button'
import { useComments, Comment } from '../hooks/useComments'
import { useAuth } from '../hooks/useAuth'
import { formatDate, getInitials } from '../lib/utils'

interface CommentSectionProps {
  contentId: string
  className?: string
}

interface UserSuggestion {
  id: string
  username: string
  full_name: string
  avatar_url: string | null
}

export function CommentSection({ contentId, className = '' }: CommentSectionProps) {
  const { user } = useAuth()
  const { comments, loading, submitting, createComment, likeComment, deleteComment, searchUsers } = useComments(contentId)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showUserSuggestions, setShowUserSuggestions] = useState(false)
  const [userSuggestions, setUserSuggestions] = useState<UserSuggestion[]>([])
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(-1)
  const [selectedUsers, setSelectedUsers] = useState<UserSuggestion[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const replyInputRef = useRef<HTMLTextAreaElement>(null)

  // Handle @ mentions
  const handleInputChange = async (value: string, isReply = false) => {
    if (isReply) {
      setReplyContent(value)
    } else {
      setNewComment(value)
    }

    // Check for @ mentions
    const atIndex = value.lastIndexOf('@')
    if (atIndex !== -1) {
      const afterAt = value.substring(atIndex + 1)
      const spaceIndex = afterAt.indexOf(' ')
      const query = spaceIndex === -1 ? afterAt : afterAt.substring(0, spaceIndex)
      
      if (query.length > 0 && !query.includes(' ')) {
        setMentionQuery(query)
        setMentionStart(atIndex)
        const suggestions = await searchUsers(query)
        setUserSuggestions(suggestions)
        setShowUserSuggestions(true)
      } else {
        setShowUserSuggestions(false)
      }
    } else {
      setShowUserSuggestions(false)
    }
  }

  const selectUser = (selectedUser: UserSuggestion, isReply = false) => {
    const currentValue = isReply ? replyContent : newComment
    const beforeMention = currentValue.substring(0, mentionStart)
    const afterMention = currentValue.substring(mentionStart + mentionQuery.length + 1)
    const newValue = `${beforeMention}@${selectedUser.username} ${afterMention}`
    
    if (isReply) {
      setReplyContent(newValue)
    } else {
      setNewComment(newValue)
    }
    
    // Add to selected users for mention tracking
    if (!selectedUsers.find(u => u.id === selectedUser.id)) {
      setSelectedUsers(prev => [...prev, selectedUser])
    }
    
    setShowUserSuggestions(false)
    setMentionQuery('')
    setMentionStart(-1)
  }

  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1]
      const user = selectedUsers.find(u => u.username === username)
      if (user) {
        mentions.push(user.id)
      }
    }
    
    return mentions
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    const mentions = extractMentions(newComment)
    const { error } = await createComment(newComment.trim(), null, mentions)
    
    if (!error) {
      setNewComment('')
      setSelectedUsers([])
    }
  }

  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault()
    if (!replyContent.trim() || submitting) return

    const mentions = extractMentions(replyContent)
    const { error } = await createComment(replyContent.trim(), parentId, mentions)
    
    if (!error) {
      setReplyContent('')
      setReplyingTo(null)
      setSelectedUsers([])
    }
  }

  const handleLike = async (commentId: string) => {
    await likeComment(commentId)
  }

  const formatCommentContent = (content: string) => {
    // Replace @mentions with styled spans
    return content.replace(/@(\w+)/g, '<span class="text-purple-400 font-medium">@$1</span>')
  }

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const [showOptions, setShowOptions] = useState(false)
    const isOwner = user?.id === comment.user_id

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : 'mb-4'}`}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
          {comment.user.avatar_url ? (
            <img
              src={comment.user.avatar_url}
              alt={comment.user.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-xs font-bold">
              {getInitials(comment.user.full_name)}
            </span>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white/5 rounded-2xl px-4 py-3 backdrop-blur-sm border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white text-sm">{comment.user.full_name}</span>
              {comment.user.is_verified && (
                <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
              <span className="text-gray-400 text-xs">@{comment.user.username}</span>
              <span className="text-gray-500 text-xs">•</span>
              <span className="text-gray-500 text-xs">{formatDate(comment.created_at)}</span>
            </div>
            <div 
              className="text-gray-200 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }}
            />
          </div>

          {/* Comment Actions */}
          <div className="flex items-center gap-4 mt-2 text-xs">
            <button
              onClick={() => handleLike(comment.id)}
              className={`flex items-center gap-1 hover:text-pink-400 transition-colors ${
                comment.user_has_liked ? 'text-pink-500' : 'text-gray-400'
              }`}
            >
              <Heart className={`w-3 h-3 ${comment.user_has_liked ? 'fill-current' : ''}`} />
              <span>{comment.like_count > 0 ? comment.like_count : ''}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Reply className="w-3 h-3" />
                <span>Reply</span>
              </button>
            )}

            {comment.reply_count > 0 && !isReply && (
              <span className="text-gray-500">
                {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
              </span>
            )}

            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
                
                {showOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                    <div className="absolute top-full right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                      <button
                        onClick={async () => {
                          await deleteComment(comment.id)
                          setShowOptions(false)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors w-full text-left"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={replyInputRef}
                    value={replyContent}
                    onChange={(e) => handleInputChange(e.target.value, true)}
                    placeholder={`Reply to ${comment.user.full_name}...`}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none text-sm"
                    rows={2}
                    disabled={submitting}
                  />
                  
                  {/* User Suggestions for Reply */}
                  {showUserSuggestions && userSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 max-h-32 overflow-y-auto">
                      {userSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          onClick={() => selectUser(suggestion, true)}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 transition-colors w-full text-left"
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                            {suggestion.avatar_url ? (
                              <img src={suggestion.avatar_url} alt={suggestion.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs">{getInitials(suggestion.full_name)}</span>
                            )}
                          </div>
                          <div>
                            <div className="text-white text-sm">{suggestion.full_name}</div>
                            <div className="text-gray-400 text-xs">@{suggestion.username}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!replyContent.trim() || submitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3 py-2"
                >
                  {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </Button>
              </form>
            </motion.div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* New Comment Input */}
      {user && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0">
              {user.email ? (
                <span className="text-white text-xs font-bold">
                  {getInitials(user.email)}
                </span>
              ) : (
                <span className="text-white text-xs font-bold">U</span>
              )}
            </div>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newComment}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Add a comment... Use @ to mention someone"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                rows={3}
                disabled={submitting}
              />
              
              {/* User Suggestions */}
              {showUserSuggestions && userSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 max-h-40 overflow-y-auto">
                  {userSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => selectUser(suggestion)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors w-full text-left"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                        {suggestion.avatar_url ? (
                          <img src={suggestion.avatar_url} alt={suggestion.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-sm">{getInitials(suggestion.full_name)}</span>
                        )}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{suggestion.full_name}</div>
                        <div className="text-gray-400 text-xs">@{suggestion.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-gray-500">
                  {newComment.length}/500 characters
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || submitting}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-lg font-medium text-white mb-2">No comments yet</h3>
          <p className="text-gray-400 text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}