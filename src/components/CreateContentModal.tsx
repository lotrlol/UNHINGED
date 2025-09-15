import React, { useState, useRef } from 'react'
import {
  X,
  Image as ImageIcon,
  Play,
  Music,
  FileText,
  Check,
  Loader2,
  Plus,
} from 'lucide-react'
// Using custom button elements instead of Badge component
import { useContent } from '../hooks/useContent'
import { useAuth } from '../hooks/useAuth'
import { CREATIVE_TAGS } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface CreateContentModalProps {
  isOpen: boolean
  onClose: () => void
  onContentCreated?: () => void
}


export function CreateContentModal({ isOpen, onClose, onContentCreated }: CreateContentModalProps) {
  const { createContent } = useContent()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadMode, setUploadMode] = useState<'upload' | 'link'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  type ContentType = 'image' | 'video' | 'audio' | 'article'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'image' as ContentType,
    platform: '',
    external_url: '',
    thumbnail_url: '',
    tags: [] as string[],
    media_file: null as File | null,
  })

  // Handle escape key and prevent body scroll
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const toggleTag = (tag: string) => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter((t) => t !== tag)
      : [...formData.tags, tag]
    updateFormData({ tags: newTags })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      toast.error('File size must be less than 50MB')
      return
    }

    if (file.type.startsWith('image/')) {
      updateFormData({
        media_file: file,
        content_type: 'image',
        title: formData.title || file.name.split('.')[0],
      })
    } else if (file.type.startsWith('video/')) {
      updateFormData({
        media_file: file,
        content_type: 'video',
        title: formData.title || file.name.split('.')[0],
      } as any) // Type assertion needed due to TypeScript limitation
    } else {
      setError('Only image or video files allowed')
      toast.error('Only image or video files allowed')
      return
    }

    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let uploadedFileUrl: string | null = null

      if (formData.media_file && uploadMode === 'upload') {
        const fileExt = formData.media_file.name.split('.').pop()?.toLowerCase()
        const storagePath = user
          ? `${user.id}/${Date.now()}.${fileExt}`
          : `${Date.now()}.${fileExt}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('content-media')
          .upload(storagePath, formData.media_file)

        if (uploadError) throw new Error(uploadError.message)

        const { data: publicUrlData } = supabase.storage
          .from('content-media')
          .getPublicUrl(uploadData.path)

        uploadedFileUrl = publicUrlData.publicUrl
      }

      const finalData = {
        title: formData.title,
        description: formData.description || undefined,
        content_type: formData.content_type,
        platform: formData.platform || undefined,
        external_url: uploadedFileUrl || formData.external_url || undefined,
        thumbnail_url: uploadedFileUrl || formData.thumbnail_url || undefined,
        tags: formData.tags,
      }

      const { error } = await createContent(finalData)
      if (error) throw new Error(error)

      setSuccess('Content shared successfully 🎉')
      toast.success('Content shared successfully!')

      setFormData({
        title: '',
        description: '',
        content_type: 'image',
        platform: '',
        external_url: '',
        thumbnail_url: '',
        tags: [],
        media_file: null,
      })
      setUploadMode('upload')

      setTimeout(() => {
        onContentCreated?.()
        setSuccess('')
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to share content.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    formData.title.trim() &&
    ((uploadMode === 'upload' && formData.media_file) ||
      (uploadMode === 'link' && formData.external_url.trim()))

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col"
        >
          {/* Overlay */}
          <motion.div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Animated Background Blobs */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div 
              className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-600 rounded-full blur-3xl opacity-20"
              animate={{ rotate: 360 }}
              transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div 
              className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-full blur-3xl opacity-15"
              animate={{ rotate: -360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10">
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-300" />
                  </button>
                  <h2 className="text-lg font-bold text-white">Share New Content</h2>
                  <div className="w-10" />
                </div>

                {error && (
                  <div className="p-4 mb-4 text-sm text-red-400 bg-red-900/30 border border-red-800/50 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 mb-4 text-sm text-green-400 bg-green-900/30 border border-green-800/50 rounded-lg">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                  {/* Content Type Selection */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Content Type *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { value: 'image', label: 'Image', icon: ImageIcon },
                        { value: 'video', label: 'Video', icon: Play },
                        { value: 'audio', label: 'Audio', icon: Music },
                        { value: 'article', label: 'Article', icon: FileText },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateFormData({ content_type: type.value as ContentType })}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                            formData.content_type === type.value
                              ? 'bg-purple-500/20 border-purple-500/50 text-white'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <type.icon className="w-6 h-6 mb-2" />
                          <span className="text-xs font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      placeholder="Enter a title for your content"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Description Input */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      placeholder="Add a description (optional)"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {/* Upload/Link Toggle */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <button
                        type="button"
                        onClick={() => setUploadMode('upload')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          uploadMode === 'upload'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                          uploadMode === 'link'
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        Add Link
                      </button>
                    </div>

                    {uploadMode === 'upload' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Upload {formData.content_type === 'image' ? 'Image' : 'Media'} *
                        </label>
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="p-3 rounded-full bg-purple-500/10">
                              <Plus className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-sm text-gray-300">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">
                              {formData.content_type === 'image'
                                ? 'JPG, PNG, GIF (max 50MB)'
                                : formData.content_type === 'video'
                                ? 'MP4, WebM (max 50MB)'
                                : formData.content_type === 'audio'
                                ? 'MP3, WAV (max 50MB)'
                                : 'PDF, DOC, TXT (max 50MB)'}
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={
                              formData.content_type === 'image'
                                ? 'image/*'
                                : formData.content_type === 'video'
                                ? 'video/*'
                                : formData.content_type === 'audio'
                                ? 'audio/*'
                                : '.pdf,.doc,.docx,.txt'
                            }
                            onChange={handleFileSelect}
                            className="hidden"
                            required={uploadMode === 'upload'}
                          />
                        </div>
                        {formData.media_file && (
                          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span className="text-sm text-green-400">
                                  {formData.media_file.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateFormData({ media_file: null })}
                                className="text-gray-400 hover:text-white"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Content URL *
                        </label>
                        <input
                          type="url"
                          value={formData.external_url}
                          onChange={(e) => updateFormData({ external_url: e.target.value })}
                          placeholder="https://example.com/your-content"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                          required={uploadMode === 'link'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Platform Input */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Platform (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.platform}
                      onChange={(e) => updateFormData({ platform: e.target.value })}
                      placeholder="YouTube, Instagram, etc."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Tags Section */}
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Tags (Optional)
                    </label>
                    
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {CREATIVE_TAGS.slice(0, 18).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            formData.tags.includes(tag)
                              ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-500/50 text-white'
                              : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>

                    {formData.tags.length > 0 && (
                      <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex flex-wrap gap-2 mt-2">
                          {formData.tags.map((tag) => (
                            <div
                              key={tag}
                              className="px-2 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button (for mobile) */}
                  <div className="block sm:hidden">
                    <button
                      type="submit"
                      disabled={!canSubmit || loading}
                      className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          {uploadMode === 'upload' ? 'Uploading...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Share Content
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Fixed Bottom Submit Button (for desktop) */}
            <div className="hidden sm:block sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent backdrop-blur-md border-t border-white/10">
              <div className="max-w-4xl mx-auto">
                <motion.button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!canSubmit || loading}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {uploadMode === 'upload' ? 'Uploading...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Share Content
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}