import React, { useState, useRef } from 'react'
import {
  X,
  Upload,
  Image as ImageIcon,
  Play,
  Music,
  FileText,
  Video,
  Plus,
  Link as LinkIcon,
  Check,
  Camera,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
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

const CONTENT_TYPES = [
  { value: 'image', label: 'Photo', icon: ImageIcon, primary: true },
  { value: 'video', label: 'Video', icon: Play, primary: true },
  { value: 'audio', label: 'Audio', icon: Music, primary: false },
  { value: 'article', label: 'Article', icon: FileText, primary: false },
] as const

export function CreateContentModal({ isOpen, onClose, onContentCreated }: CreateContentModalProps) {
  const { createContent } = useContent()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadMode, setUploadMode] = useState<'upload' | 'link'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'image' as const,
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
      })
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

  const primaryTypes = CONTENT_TYPES.filter((t) => t.primary)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900"
      >
        {/* Animated background blobs */}
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

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 bg-black/40 backdrop-blur-md border-b border-white/10">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">Create New Content</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto pb-20">
          <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-300"
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Camera className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Content Details</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormData({ title: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      placeholder="Enter a catchy title"
                      required
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.title.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                      placeholder="Describe your content..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Content Type Section */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-semibold text-white">Content Type</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {primaryTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormData({ content_type: type.value })}
                        className={`flex items-center justify-center gap-3 px-4 py-4 rounded-xl border transition-all ${
                          formData.content_type === type.value
                            ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-purple-500/50 text-white shadow-lg'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{type.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Upload Method Section */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Upload className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">How to add content?</h3>
                </div>

                <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`flex-1 py-4 px-4 font-medium transition-all flex items-center justify-center gap-2 ${
                      uploadMode === 'upload'
                        ? 'bg-purple-600/50 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('link')}
                    className={`flex-1 py-4 px-4 font-medium transition-all flex items-center justify-center gap-2 ${
                      uploadMode === 'link'
                        ? 'bg-purple-600/50 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    External Link
                  </button>
                </div>

                {/* File Upload or Link Input */}
                {uploadMode === 'upload' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Upload {formData.content_type === 'image' ? 'Image' : 'Video'} *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        formData.media_file
                          ? 'border-green-500/30 bg-green-500/5'
                          : 'border-white/20 hover:border-purple-500/50 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        accept={formData.content_type === 'image' ? 'image/*' : 'video/*'}
                        className="hidden"
                      />
                      {formData.media_file ? (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8 text-green-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-green-300">{formData.media_file.name}</p>
                            <p className="text-sm text-green-400">
                              {(formData.media_file.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                          <p className="text-xs text-gray-400">Tap to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                            {formData.content_type === 'image' ? (
                              <ImageIcon className="w-8 h-8 text-purple-400" />
                            ) : (
                              <Video className="w-8 h-8 text-purple-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-300">
                              Tap to upload your {formData.content_type === 'image' ? 'image' : 'video'}
                            </p>
                            <p className="text-sm text-gray-400">
                              {formData.content_type === 'image' ? 'JPG, PNG, GIF' : 'MP4, MOV, AVI'} up to 50MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
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

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Platform
                      </label>
                      <input
                        type="text"
                        value={formData.platform}
                        onChange={(e) => updateFormData({ platform: e.target.value })}
                        placeholder="e.g., YouTube, Instagram, SoundCloud"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      />
                    </div>

                    {uploadMode === 'link' && formData.content_type === 'video' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Thumbnail URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={formData.thumbnail_url}
                          onChange={(e) => updateFormData({ thumbnail_url: e.target.value })}
                          placeholder="https://example.com/thumbnail.jpg"
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags Section */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-lg">🏷️</span>
                  <h3 className="text-lg font-semibold text-white">Tags (Optional)</h3>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {CREATIVE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.tags.includes(tag)
                          ? 'bg-gradient-to-r from-purple-600/60 to-pink-600/60 text-white border border-purple-500/50 shadow-lg'
                          : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {formData.tags.length > 0 && (
                  <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <p className="text-sm text-purple-300 mb-3 font-medium">Selected tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-purple-600/40 text-purple-200 border-purple-500/30 cursor-pointer hover:bg-red-600/40 hover:text-red-200 transition-colors"
                          onClick={() => toggleTag(tag)}
                        >
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Fixed Bottom Submit Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent backdrop-blur-md border-t border-white/10">
          <div className="max-w-2xl mx-auto">
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
      </motion.div>
    </AnimatePresence>
  )
}