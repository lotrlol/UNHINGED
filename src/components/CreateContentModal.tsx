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
import { GlassCard } from './ui/GlassCard'
import { useContent } from '../hooks/useContent'
import { useAuth } from '../hooks/useAuth'
import { CREATIVE_TAGS } from '../lib/utils'
import { supabase } from '../lib/supabase'

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

  if (!isOpen) return null

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
  const additionalTypes = CONTENT_TYPES.filter((t) => !t.primary)

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col pt-4 pb-4 px-4">
      <style>
        {`
          .space-y-8 > :not([hidden]) ~ :not([hidden]) {
            --tw-space-y-reverse: 0;
            margin-top: 0;
            margin-bottom: calc(2rem * var(--tw-space-y-reverse));
          }
        `}
      </style>
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        <GlassCard className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
          {/* Header */}
          <div className="flex-shrink-0 z-10 bg-gray-900/70 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Create New Content</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 pb-8">
            {/* Title */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full rounded-lg bg-gray-800/60 border border-white/10 text-white px-4 py-2"
                placeholder="Enter a title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-gray-800/60 border border-white/10 text-white px-4 py-2"
                placeholder="Enter a description"
              />
            </div>

            {/* Content type */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Content Type</label>
              <div className="grid grid-cols-2 gap-3">
                {primaryTypes.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateFormData({ content_type: opt.value })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border ${
                      formData.content_type === opt.value
                        ? 'bg-purple-600/80 text-white'
                        : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload mode toggle */}
            <div className="flex border border-white/10 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setUploadMode('upload')}
                className={`flex-1 py-2 ${
                  uploadMode === 'upload' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 py-2 ${
                  uploadMode === 'link' ? 'bg-white/10 text-white' : 'text-gray-400'
                }`}
              >
                Link
              </button>
            </div>

            {/* File upload or link input */}
            {uploadMode === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  formData.media_file
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-white/10 hover:border-white/20'
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
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-green-300">{formData.media_file.name}</p>
                      <p className="text-sm text-green-400">
                        {(formData.media_file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">Click to change file</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-purple-100/10 rounded-full flex items-center justify-center mx-auto">
                      {formData.content_type === 'image' ? (
                        <ImageIcon className="w-8 h-8 text-purple-400" />
                      ) : (
                        <Video className="w-8 h-8 text-purple-400" />
                      )}
                    </div>
                    <div>
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
            ) : (
              <div>
                <label className="block text-sm text-gray-300 mb-2">Content URL</label>
                <input
                  type="url"
                  value={formData.external_url}
                  onChange={(e) => updateFormData({ external_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full rounded-lg bg-gray-800/60 border border-white/10 text-white px-4 py-2"
                  required={uploadMode === 'link'}
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Tags (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {CREATIVE_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`cursor-pointer ${
                      formData.tags.includes(tag)
                        ? 'bg-purple-600/80 text-white border-purple-500/50'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-lg"
            >
              {loading ? 'Uploading...' : 'Share Content'}
            </Button>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
