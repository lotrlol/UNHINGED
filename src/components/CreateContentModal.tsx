import React, { useState, useRef } from 'react'
import { X, Upload, Link, Image as ImageIcon, Play, Music, FileText, Camera, Video, Plus } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Badge } from './ui/Badge'
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
  { value: 'image', label: 'Photo', icon: ImageIcon, description: 'Upload your photos', primary: true },
  { value: 'video', label: 'Video', icon: Play, description: 'Upload your videos', primary: true },
  { value: 'audio', label: 'Audio', icon: Music, description: 'Share music tracks', primary: false },
  { value: 'article', label: 'Article', icon: FileText, description: 'Written content', primary: false }
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
    media_file: null as File | null
  })

  if (!isOpen) return null

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const toggleTag = (tag: string) => {
    const newTags = formData.tags.includes(tag)
      ? formData.tags.filter(t => t !== tag)
      : [...formData.tags, tag]
    updateFormData({ tags: newTags })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB')
        return
      }
      
      // Auto-detect content type based on file
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      
      if (isImage) {
        updateFormData({ 
          media_file: file, 
          content_type: 'image',
          title: formData.title || file.name.split('.')[0]
        })
      } else if (isVideo) {
        updateFormData({ 
          media_file: file, 
          content_type: 'video',
          title: formData.title || file.name.split('.')[0]
        })
      } else {
        setError('Please select an image or video file')
        return
      }
      
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let uploadedFileUrl = null
      
      // Handle file upload to Supabase Storage
      if (formData.media_file && uploadMode === 'upload') {
        try {
          const fileExt = formData.media_file.name.split('.').pop()?.toLowerCase()
          const storagePath = user ? `${user.id}/${Date.now()}.${fileExt}` : `${Date.now()}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('content-media')
            .upload(storagePath, formData.media_file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            throw new Error(`Upload failed: ${uploadError.message}`)
          }

          // Get public URL
          const { data: publicUrlData } = supabase.storage
            .from('content-media')
            .getPublicUrl(uploadData.path)

          uploadedFileUrl = publicUrlData.publicUrl
          console.log('File uploaded successfully:', uploadedFileUrl)
        } catch (uploadErr) {
          console.error('File upload error:', uploadErr)
          throw new Error(`Upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}. Please ensure you are logged in and try again.`)
        }
      }

      let finalData = {
        title: formData.title,
        description: formData.description || undefined,
        content_type: formData.content_type,
        platform: formData.platform || undefined,
        external_url: uploadedFileUrl || formData.external_url || undefined,
        thumbnail_url: uploadedFileUrl || formData.thumbnail_url || undefined,
        tags: formData.tags
      }

      console.log('Creating content with data:', finalData)

      const { error } = await createContent(finalData)

      if (error) {
        throw new Error(error)
      }

      setSuccess('Content shared successfully! 🎉')
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        content_type: 'image',
        platform: '',
        external_url: '',
        thumbnail_url: '',
        tags: [],
        media_file: null
      })
      setUploadMode('upload')
      
      setTimeout(() => {
        onContentCreated?.()
        setSuccess('')
      }, 1500)

    } catch (err: any) {
      console.error('Error creating content:', err)
      setError(err.message || 'Failed to share content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'image',
      platform: '',
      external_url: '',
      thumbnail_url: '',
      tags: [],
      media_file: null
    })
    setUploadMode('upload')
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const canSubmit = formData.title.trim() && (
    (uploadMode === 'upload' && formData.media_file) ||
    (uploadMode === 'link' && formData.external_url.trim())
  )

  const primaryTypes = CONTENT_TYPES.filter(type => type.primary)
  const additionalTypes = CONTENT_TYPES.filter(type => !type.primary)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Share Your Content</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600">
            Upload your photos and videos to showcase your creative work
          </p>
        </CardHeader>

        <CardContent>
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Mode Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setUploadMode('upload')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  uploadMode === 'upload'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                Upload Media
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('link')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  uploadMode === 'link'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Link className="w-4 h-4" />
                Share Link
              </button>
            </div>

            {/* Primary Content Types (Photos & Videos) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Type *
              </label>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {primaryTypes.map(({ value, label, icon: Icon, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateFormData({ content_type: value })}
                    className={`p-4 rounded-xl text-left transition-all border-2 ${
                      formData.content_type === value
                        ? 'bg-purple-100 text-purple-800 border-purple-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-6 h-6" />
                      <span className="font-semibold text-lg">{label}</span>
                    </div>
                    <p className="text-sm opacity-75">{description}</p>
                  </button>
                ))}
              </div>

              {/* Additional Content Types */}
              <details className="group">
                <summary className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 mb-3">
                  <Plus className="w-4 h-4 group-open:rotate-45 transition-transform" />
                  More content types
                </summary>
                <div className="grid grid-cols-2 gap-3">
                  {additionalTypes.map(({ value, label, icon: Icon, description }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => updateFormData({ content_type: value })}
                      className={`p-3 rounded-lg text-left transition-all border-2 ${
                        formData.content_type === value
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{label}</span>
                      </div>
                      <p className="text-xs opacity-75">{description}</p>
                    </button>
                  ))}
                </div>
              </details>
            </div>

            {/* Media Upload Section */}
            {uploadMode === 'upload' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your {formData.content_type === 'image' ? 'Photo' : 'Video'} *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer bg-purple-50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={formData.content_type === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {formData.media_file ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        {formData.content_type === 'image' ? (
                          <ImageIcon className="w-8 h-8 text-green-600" />
                        ) : (
                          <Video className="w-8 h-8 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-green-700">{formData.media_file.name}</p>
                        <p className="text-sm text-green-600">
                          {(formData.media_file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">Click to change file</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                        {formData.content_type === 'image' ? (
                          <Camera className="w-8 h-8 text-purple-600" />
                        ) : (
                          <Video className="w-8 h-8 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          Click to upload your {formData.content_type === 'image' ? 'photo' : 'video'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formData.content_type === 'image' ? 'PNG, JPG, GIF' : 'MP4, MOV, AVI'} up to 50MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Link Section */}
            {uploadMode === 'link' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <input
                    type="text"
                    value={formData.platform}
                    onChange={(e) => updateFormData({ platform: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="YouTube, Instagram, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content URL *
                  </label>
                  <div className="relative">
                    <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={formData.external_url}
                      onChange={(e) => updateFormData({ external_url: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Give your content a catchy title..."
                maxLength={100}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Tell people about your content..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tags (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {CREATIVE_TAGS.slice(0, 12).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`p-2 rounded-lg text-sm font-medium transition-all ${
                      formData.tags.includes(tag)
                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {formData.tags.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl">
                  <p className="text-sm text-purple-800 font-medium mb-2">Selected tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="default"
                        className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                        onClick={() => toggleTag(tag)}
                      >
                        #{tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                disabled={!canSubmit || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sharing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Share Content
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}