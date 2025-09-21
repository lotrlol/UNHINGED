import React, { useState, useRef } from 'react'
import {
  X,
  Check,
  Loader2,
  Plus,
} from 'lucide-react'
// Using custom button elements instead of Badge component
import { useContent } from '../hooks/useContent'
import { useAuth } from '../hooks/useAuth'
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [detectedContentType, setDetectedContentType] = useState<ContentType>('image')
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  type ContentType = 'image' | 'video' | 'audio' | 'article'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      toast.error('File size must be less than 50MB')
      return
    }

    // Auto-detect content type based on file type
    let contentType: ContentType = 'image'
    if (file.type.startsWith('video/')) {
      contentType = 'video'
    } else if (file.type.startsWith('audio/')) {
      contentType = 'audio'
    }

    setDetectedContentType(contentType)
    updateFormData({
      media_file: file,
      title: formData.title || file.name.split('.')[0],
    })

    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let uploadedFileUrl: string | null = null

      if (formData.media_file) {
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
        content_type: detectedContentType,
        external_url: uploadedFileUrl || undefined,
        thumbnail_url: uploadedFileUrl || undefined,
        tags: formData.tags,
      }

      const { error } = await createContent(finalData)
      if (error) throw new Error(error)

      setSuccess('Content shared successfully 🎉')
      toast.success('Content shared successfully!')

      // Close modal after successful upload
      setTimeout(() => {
        onContentCreated?.()
        setSuccess('')
        onClose()
      }, 1500)
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to share content.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = formData.title.trim() && formData.media_file

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-black"
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black"
            onClick={onClose}
          />
          

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-md border-b border-white/10">
                  <h2 className="text-xl font-bold text-white">Share Your Content</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5 text-gray-300" />
                  </button>
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

                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                  {/* Step Indicator */}
                  <div className="flex justify-center mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-2 ${currentStep === 1 ? 'text-purple-400' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 1 ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                          1
                        </div>
                        <span className="text-sm font-medium">Upload</span>
                      </div>
                      <div className="w-8 h-px bg-gray-600"></div>
                      <div className={`flex items-center space-x-2 ${currentStep === 2 ? 'text-purple-400' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep === 2 ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                          2
                        </div>
                        <span className="text-sm font-medium">Details</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 1: Upload Content */}
                  {currentStep === 1 && (
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-dashed border-purple-500/30 rounded-2xl p-6 sm:p-8 text-center">
                      <div className="max-w-md mx-auto">
                        <div className="mb-6">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <Plus className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-xl font-semibold text-white mb-2">Upload Your Content</h3>
                          <p className="text-gray-300 text-sm">Choose images, videos, or audio files</p>
                        </div>

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/5 transition-all duration-300 hover:border-purple-400/50"
                        >
                          <div className="space-y-2">
                            <p className="text-lg font-medium text-white">Click to browse files</p>
                            <p className="text-sm text-gray-400">
                              {formData.media_file
                                ? `${formData.media_file.name} selected`
                                : 'Images, Videos, Audio (max 50MB)'}
                            </p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*,audio/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            required
                          />
                        </div>

                        {formData.media_file && (
                          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="flex items-center justify-center space-x-3">
                              <Check className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 font-medium">File selected successfully</span>
                            </div>

                            {/* Media Preview */}
                            <div className="mt-4">
                              {formData.media_file.type.startsWith('image/') && (
                                <img
                                  src={URL.createObjectURL(formData.media_file)}
                                  alt="Preview"
                                  className="w-full max-w-xs max-h-40 object-contain rounded-lg mx-auto"
                                />
                              )}
                              {formData.media_file.type.startsWith('video/') && (
                                <video
                                  src={URL.createObjectURL(formData.media_file)}
                                  controls
                                  className="w-full max-w-sm max-h-40 mx-auto rounded-lg"
                                  preload="metadata"
                                />
                              )}
                              {formData.media_file.type.startsWith('audio/') && (
                                <audio
                                  src={URL.createObjectURL(formData.media_file)}
                                  controls
                                  className="w-full max-w-sm mx-auto"
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Content Details */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      {/* Media Preview from Step 1 */}
                      {formData.media_file && (
                        <div className="bg-gray-800/50 rounded-xl p-4">
                          <div className="flex items-center justify-center mb-3">
                            <span className="text-sm font-medium text-gray-300">Your Content</span>
                          </div>
                          <div className="flex justify-center">
                            {formData.media_file.type.startsWith('image/') && (
                              <img
                                src={URL.createObjectURL(formData.media_file)}
                                alt="Preview"
                                className="max-w-xs max-h-48 object-contain rounded-lg"
                              />
                            )}
                            {formData.media_file.type.startsWith('video/') && (
                              <video
                                src={URL.createObjectURL(formData.media_file)}
                                controls
                                className="max-w-sm max-h-48 rounded-lg"
                                preload="metadata"
                              />
                            )}
                            {formData.media_file.type.startsWith('audio/') && (
                              <audio
                                src={URL.createObjectURL(formData.media_file)}
                                controls
                                className="max-w-sm"
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {/* Title Input */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => updateFormData({ title: e.target.value })}
                          placeholder="Give your content a title..."
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                          required
                        />
                      </div>

                      {/* Description Input */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-300">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Add a description (optional). You can also add tags like #photography #nature #art"
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-2 rounded-lg text-gray-300 bg-gray-700 hover:bg-gray-600 transition-colors"
                    >
                      {currentStep === 1 ? 'Cancel' : 'Back'}
                    </button>

                    {currentStep === 1 && formData.media_file && (
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}

                    {currentStep === 2 && (
                      <button
                        type="submit"
                        disabled={!canSubmit || loading}
                        className="px-6 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Share Content
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}