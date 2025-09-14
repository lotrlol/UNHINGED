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
} from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { AuthGlassCard } from './ui/GlassCard'
import { useContent } from '../hooks/useContent'
import { useAuth } from '../hooks/useAuth'
import { CREATIVE_TAGS } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

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
      setError(err.message || 'Failed to share content.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    formData.title.trim() &&
    ((uploadMode === 'upload' && formData.media_file) ||
      (uploadMode === 'link' && formData.external_url.trim()))

  const primaryTypes = CONTENT_TYPES.filter((t) => t.primary)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
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
            className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthGlassCard 
              title="Create New Content"
              onClose={onClose}
              className="relative overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error/Success Messages */}
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm">
                    {success}
                  </div>
                )}

                {/* Title and Description Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                      placeholder="Describe your content..."
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Content Type and Upload Mode Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Content Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Content Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {primaryTypes.map((type) => {
                        const Icon = type.icon
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => updateFormData({ content_type: type.value })}
                            className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border transition-all ${
                              formData.content_type === type.value
                                ? 'bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-purple-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium text-sm">{type.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Upload Mode Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      How to add content?
                    </label>
                    <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setUploadMode('upload')}
                        className={`flex-1 py-3 px-3 font-medium transition-all text-sm ${
                          uploadMode === 'upload'
                            ? 'bg-purple-600/50 text-white'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <Upload className="w-4 h-4 inline mr-2" />
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode('link')}
                        className={`flex-1 py-3 px-3 font-medium transition-all text-sm ${
                          uploadMode === 'link'
                            ? 'bg-purple-600/50 text-white'
                            : 'text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <LinkIcon className="w-4 h-4 inline mr-2" />
                        Link
                      </button>
                    </div>
                  </div>
                </div>

                {/* File Upload or Link Input */}
                {uploadMode === 'upload' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Upload {formData.content_type === 'image' ? 'Image' : 'Video'} *
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
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
                        <div className="space-y-2">
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-8 h-8 text-green-400" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-green-300">{formData.media_file.name}</p>
                            <p className="text-sm text-green-400">
                              {(formData.media_file.size / (1024 * 1024)).toFixed(1)} MB
                            </p>
                          </div>
                          <p className="text-xs text-gray-400">Click to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto">
                            {formData.content_type === 'image' ? (
                              <ImageIcon className="w-8 h-8 text-purple-400" />
                            ) : (
                              <Video className="w-8 h-8 text-purple-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="font-medium text-gray-300">
                              Click to upload your {formData.content_type === 'image' ? 'image' : 'video'}
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
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
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
                    <p className="text-xs text-gray-500 mt-1">
                      Link to your content on other platforms
                    </p>

                    {/* Platform field for external links */}
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
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Tags (Optional)
                  </label>
                  <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {CREATIVE_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                          formData.tags.includes(tag)
                            ? 'bg-gradient-to-r from-purple-600/60 to-pink-600/60 text-white border border-purple-500/50'
                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <p className="text-xs text-purple-300 mb-2">Selected tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className="bg-purple-600/40 text-purple-200 border-purple-500/30 text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={!canSubmit || loading}
                    className="w-full py-3 px-4 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/20 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {uploadMode === 'upload' ? 'Uploading...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Share Content
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </AuthGlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}