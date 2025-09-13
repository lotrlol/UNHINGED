import React, { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Upload, Image as ImageIcon, Users, DollarSign, Tag, MapPin, Settings, Camera } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Badge } from './ui/Badge'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CREATOR_ROLES, COLLAB_TYPES, CREATIVE_TAGS } from '../lib/utils'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated?: () => void
}

interface ProjectData {
  title: string
  description: string
  roles_needed: string[]
  collab_type: 'Paid' | 'Unpaid' | 'Revenue Split'
  tags: string[]
  location: string
  is_remote: boolean
  nsfw: boolean
  cover_file: File | null
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    roles_needed: [],
    collab_type: 'Unpaid',
    tags: [],
    location: '',
    is_remote: false,
    nsfw: false,
    cover_file: null,
  })

  const steps = [
    { title: 'Project Basics', icon: Camera },
    { title: 'Looking For', icon: Users },
    { title: 'Collaboration', icon: DollarSign },
    { title: 'Tags & Style', icon: Tag },
    { title: 'Location', icon: MapPin },
    { title: 'Settings', icon: Settings },
  ]

  if (!isOpen) return null

  const updateProjectData = (updates: Partial<ProjectData>) => {
    setProjectData(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return projectData.title.trim() && projectData.description.trim()
      case 1:
        return projectData.roles_needed.length > 0
      case 2:
        return true // Collab type has default
      case 3:
        return true // Tags are optional
      case 4:
        return projectData.location.trim() || projectData.is_remote
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('Cover image must be less than 10MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }
      
      setError('')
      updateProjectData({ cover_file: file })
    }
  }

  const uploadCoverImage = async (file: File): Promise<string | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('covers')
        .upload(fileName, file)

      if (error) {
        console.error('Storage upload error:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(data.path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading cover image:', error)
      return null
    }
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let cover_url = null
      
      // Upload cover image if provided
      if (projectData.cover_file) {
        setError('Uploading cover image...')
        cover_url = await uploadCoverImage(projectData.cover_file)
        if (!cover_url) {
          throw new Error('Failed to upload cover image')
        }
        setError('') // Clear upload message
      }

      // Create project
      console.log('Creating project with data:', {
        creator_id: user.id,
        creator_type: 'profile',
        title: projectData.title,
        description: projectData.description,
        roles_needed: projectData.roles_needed,
        collab_type: projectData.collab_type,
        tags: projectData.tags,
        location: projectData.location || null,
        is_remote: projectData.is_remote,
        nsfw: projectData.nsfw,
        cover_url,
      })

      const { data, error } = await supabase
        .from('projects')
        .insert({
          creator_id: user.id,
          creator_type: 'profile',
          title: projectData.title,
          description: projectData.description,
          roles_needed: projectData.roles_needed,
          collab_type: projectData.collab_type,
          tags: projectData.tags,
          location: projectData.location || null,
          is_remote: projectData.is_remote,
          nsfw: projectData.nsfw,
          cover_url,
        })
        .select()
        .single()

      if (error) {
        console.error('Project creation error:', error)
        throw new Error(`Failed to create project: ${error.message}`)
      }

      console.log('Project created successfully:', data)

      setSuccess('Project created successfully! 🎉')
      
      // Reset form
      setProjectData({
        title: '',
        description: '',
        roles_needed: [],
        collab_type: 'Unpaid',
        tags: [],
        location: '',
        is_remote: false,
        nsfw: false,
        cover_file: null,
      })
      setCurrentStep(0)
      
      // Notify parent and close modal
      setTimeout(() => {
        onProjectCreated?.()
        onClose()
        setSuccess('')
      }, 2000)

    } catch (err: any) {
      console.error('Error creating project:', err)
      
      // Provide user-friendly error messages
      if (err.message?.includes('permission denied')) {
        setError('Permission denied. Please make sure you have completed your profile.')
      } else if (err.message?.includes('violates row-level security')) {
        setError('Unable to create project. Please try signing out and back in.')
      } else if (err.message?.includes('Upload failed')) {
        setError(err.message)
      } else {
        setError(err.message || 'Failed to create project. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setProjectData({
      title: '',
      description: '',
      roles_needed: [],
      collab_type: 'Unpaid',
      tags: [],
      location: '',
      is_remote: false,
      nsfw: false,
      cover_file: null,
    })
    setCurrentStep(0)
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Camera className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your project</h2>
              <p className="text-gray-600">What collaboration are you looking to create?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  value={projectData.title}
                  onChange={(e) => updateProjectData({ title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Fashion Photoshoot in Downtown LA"
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => updateProjectData({ description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your project, vision, timeline, and what you're looking for in collaborators..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {projectData.description.length}/1000 characters
                </p>
              </div>

              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload" className="cursor-pointer">
                    {projectData.cover_file ? (
                      <div className="space-y-2">
                        <ImageIcon className="w-8 h-8 text-green-600 mx-auto" />
                        <p className="text-sm text-green-600 font-medium">
                          {projectData.cover_file.name}
                        </p>
                        <p className="text-xs text-gray-500">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Click to upload a cover image
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Who are you looking for?</h2>
              <p className="text-gray-600">Select all the roles you need for this project</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => updateProjectData({ roles_needed: toggleArrayItem(projectData.roles_needed, role) })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    projectData.roles_needed.includes(role)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            {projectData.roles_needed.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-800 font-medium mb-2">Selected roles:</p>
                <div className="flex flex-wrap gap-2">
                  {projectData.roles_needed.map((role) => (
                    <Badge key={role} variant="default">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <DollarSign className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Collaboration type</h2>
              <p className="text-gray-600">How will collaborators be compensated?</p>
            </div>
            
            <div className="space-y-3">
              {COLLAB_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => updateProjectData({ collab_type: type as any })}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    projectData.collab_type === type
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  <div className="font-medium mb-1">{type}</div>
                  <div className="text-sm opacity-75">
                    {type === 'Paid' && 'Collaborators will receive monetary compensation'}
                    {type === 'Unpaid' && 'Collaborators work for experience, portfolio, or passion'}
                    {type === 'Revenue Split' && 'Collaborators share in project profits or revenue'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Tag className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Creative tags</h2>
              <p className="text-gray-600">Help others discover your project (optional)</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {CREATIVE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => updateProjectData({ tags: toggleArrayItem(projectData.tags, tag) })}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    projectData.tags.includes(tag)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {projectData.tags.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-xl">
                <p className="text-sm text-purple-800 font-medium mb-2">Selected tags:</p>
                <div className="flex flex-wrap gap-2">
                  {projectData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Where will this happen?</h2>
              <p className="text-gray-600">Set the location for your collaboration</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="remote"
                  checked={projectData.is_remote}
                  onChange={(e) => updateProjectData({ is_remote: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="remote" className="text-sm font-medium text-gray-700">
                  This is a remote collaboration
                </label>
              </div>

              {!projectData.is_remote && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={projectData.location}
                    onChange={(e) => updateProjectData({ location: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="City, State/Country"
                  />
                </div>
              )}

              {projectData.is_remote && (
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-green-800 text-sm">
                    🌍 Great! Remote collaborations open up opportunities with creators worldwide.
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Settings className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Final settings</h2>
              <p className="text-gray-600">Set content preferences for your project</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="nsfw"
                    checked={projectData.nsfw}
                    onChange={(e) => updateProjectData({ nsfw: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="nsfw" className="text-sm font-medium text-gray-900">
                    This project contains NSFW content
                  </label>
                </div>
                <p className="text-xs text-gray-600 ml-7">
                  Check this if your project involves explicit or adult-oriented content. This helps match you with creators who are comfortable with such projects.
                </p>
              </div>

              {/* Project Summary */}
              <div className="p-4 bg-purple-50 rounded-xl">
                <h3 className="font-medium text-purple-900 mb-3">Project Summary</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Title:</span> {projectData.title}</p>
                  <p><span className="font-medium">Looking for:</span> {projectData.roles_needed.join(', ')}</p>
                  <p><span className="font-medium">Type:</span> {projectData.collab_type}</p>
                  <p><span className="font-medium">Location:</span> {projectData.is_remote ? 'Remote' : projectData.location}</p>
                  {projectData.tags.length > 0 && (
                    <p><span className="font-medium">Tags:</span> {projectData.tags.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create Project</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    index < currentStep
                      ? 'bg-green-500 text-white'
                      : index === currentStep
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <h2 className="text-sm font-medium text-purple-600 text-center">
            {steps[currentStep].title}
          </h2>
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

          {renderStep()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Project...
                  </>
                ) : (
                  <>
                    Create Project
                    <Camera className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}