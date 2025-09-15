import React, { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Globe, Loader2, Users, DollarSign, Tag, MapPin, Settings, Camera, X } from 'lucide-react';

// Animation for the ping effect
const styles = `
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 0.8; }
    70% { transform: scale(1.8); opacity: 0; }
    100% { transform: scale(1.8); opacity: 0; }
  }
  .animate-ping-slow {
    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
`;

// Add the styles to the document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

import { Button } from './ui/Button'
import { ProjectFormGlassCard } from './ui/GlassCard'
import { supabase, insertIntoTable } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { CREATOR_ROLES } from '../lib/utils'

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
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

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

  // Utility function to toggle items in an array
  const toggleArrayItem = <T,>(arr: T[], item: T): T[] => {
    return arr.includes(item)
      ? arr.filter(i => i !== item)
      : [...arr, item];
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
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setCoverPreview(previewUrl)
      
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

      // Create project with proper typing
      const projectDataToInsert = {
        creator_id: user.id,
        creator_type: 'profile' as const,
        title: projectData.title,
        description: projectData.description,
        roles_needed: projectData.roles_needed,
        collab_type: projectData.collab_type,
        tags: projectData.tags,
        location: projectData.location || null,
        is_remote: projectData.is_remote,
        nsfw: projectData.nsfw,
        cover_url,
      } as const;  // Add const assertion to fix type inference

      console.log('Creating project with data:', projectDataToInsert)

      // Use the type-safe insert helper function
      const { data, error } = await insertIntoTable('projects', projectDataToInsert)

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
              <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Tell us about your project</h2>
              <p className="text-purple-200">Start by giving your project a name and description</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="projectTitle" className="block text-sm font-medium text-purple-200 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  id="projectTitle"
                  value={projectData.title}
                  onChange={(e) => updateProjectData({ title: e.target.value })}
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-800/50 rounded-lg text-white placeholder-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., Short Film Project"
                />
              </div>
              
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-purple-200 mb-1">
                  Description
                </label>
                <textarea
                  id="projectDescription"
                  value={projectData.description}
                  onChange={(e) => updateProjectData({ description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-800/50 rounded-lg text-white placeholder-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Describe your project in detail..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Cover Image (Optional)
                </label>
                <div className="space-y-4">
                {coverPreview ? (
                  <div className="relative group">
                    <img 
                      src={coverPreview} 
                      alt="Cover preview" 
                      className="w-full h-48 object-cover rounded-lg border border-purple-800/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null)
                        updateProjectData({ cover_file: null })
                        // Reset the file input
                        const input = document.getElementById('cover-upload') as HTMLInputElement
                        if (input) input.value = ''
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-black/90 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="cover-upload" 
                    className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-purple-800/50 rounded-lg cursor-pointer hover:bg-purple-900/20 transition-colors"
                  >
                    <div className="space-y-1 text-center">
                      <div className="flex items-center justify-center text-sm text-purple-300">
                        <span className="font-medium text-purple-400 hover:text-purple-300">Upload a file</span>
                        <span className="mx-2">or</span>
                        <span>drag and drop</span>
                      </div>
                      <p className="text-xs text-purple-400 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </label>
                )}
                <input 
                  id="cover-upload" 
                  name="cover-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
                {projectData.cover_file && (
                  <p className="mt-2 text-sm text-purple-300">
                    Selected: {projectData.cover_file.name}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Who are you looking for?</h2>
              <p className="text-purple-200">Select the roles you need for your project</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateProjectData({ roles_needed: toggleArrayItem(projectData.roles_needed, role) })}
                  className={`px-3 py-2 text-sm rounded-lg text-left transition-colors ${
                    projectData.roles_needed.includes(role)
                      ? 'bg-purple-600/30 text-white border border-purple-500/50'
                      : 'bg-purple-900/30 text-purple-200 border border-purple-800/50 hover:bg-purple-800/30'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mr-3 ${
                      projectData.roles_needed.includes(role)
                        ? 'bg-white border-white flex items-center justify-center'
                        : 'border-purple-400'
                    }`}>
                      {projectData.roles_needed.includes(role) && (
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      
      case 2: // Collaboration Type
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <DollarSign className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Collaboration Type</h2>
              <p className="text-purple-200">How would you like to collaborate on this project?</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Paid', 'Unpaid', 'Revenue Split'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateProjectData({ collab_type: type as 'Paid' | 'Unpaid' | 'Revenue Split' })}
                  className={`p-6 rounded-xl text-center transition-all ${
                    projectData.collab_type === type
                      ? 'bg-purple-600/30 text-white border border-purple-500/50'
                      : 'bg-purple-900/30 text-purple-200 border border-purple-800/50 hover:bg-purple-800/30'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {type === 'Paid' ? '💰' : type === 'Unpaid' ? '🤝' : '📊'}
                  </div>
                  <div className="font-medium">{type}</div>
                  <div className="text-xs mt-1 opacity-80">
                    {type === 'Paid' 
                      ? 'Fixed rate or hourly payment' 
                      : type === 'Unpaid' 
                        ? 'Volunteer or experience based' 
                        : 'Share of revenue/profits'}
                  </div>
                </button>
              ))}
            </div>
            
            {projectData.collab_type === 'Paid' && (
              <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-800/50">
                <p className="text-sm text-purple-200">
                  💡 Payment details can be discussed with potential collaborators after they apply.
                </p>
              </div>
            )}
          </div>
        );
        
      case 3: // Tags & Style
        const popularTags = [
          'Creative', 'Collaborative', 'Professional', 'Experimental',
          'High Quality', 'Beginner Friendly', 'Long Term', 'Short Term',
          'Passion Project', 'Portfolio Piece', 'Commercial', 'Non-Profit'
        ];
        
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Tag className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Tags & Style</h2>
              <p className="text-purple-200">Add tags that describe your project's style and vibe</p>
            </div>
            
            <div>
              <label htmlFor="projectTags" className="block text-sm font-medium text-purple-200 mb-2">
                Project Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {projectData.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-600/30 text-white"
                  >
                    {tag}
                    <button 
                      type="button"
                      onClick={() => {
                        updateProjectData({ 
                          tags: projectData.tags.filter(t => t !== tag) 
                        });
                      }}
                      className="ml-2 rounded-full hover:bg-purple-700/30 p-0.5"
                    >
                      <span className="sr-only">Remove {tag}</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  id="projectTags"
                  placeholder="Type and press Enter to add tags"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const newTag = e.currentTarget.value.trim();
                      if (!projectData.tags.includes(newTag)) {
                        updateProjectData({ 
                          tags: [...projectData.tags, newTag] 
                        });
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-4 py-2 bg-purple-900/30 border border-purple-800/50 rounded-lg text-white placeholder-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-xs text-purple-400">Enter</span>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-purple-300 mb-2">Popular tags:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags
                    .filter(tag => !projectData.tags.includes(tag))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!projectData.tags.includes(tag)) {
                            updateProjectData({ 
                              tags: [...projectData.tags, tag] 
                            });
                          }
                        }}
                        className="px-3 py-1 text-sm rounded-full bg-purple-800/50 text-purple-200 hover:bg-purple-700/50 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="projectStyle" className="block text-sm font-medium text-purple-200 mb-2">
                Project Style (Optional)
              </label>
              <textarea
                id="projectStyle"
                rows={4}
                placeholder="Describe the visual style, mood, or aesthetic you're aiming for..."
                className="w-full px-4 py-2 bg-purple-900/30 border border-purple-800/50 rounded-lg text-white placeholder-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        );
        
      case 4: // Location
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <MapPin className="w-12 h-12 text-purple-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white mb-2">Project Location</h2>
              <p className="text-purple-200">Where will this project take place?</p>
            </div>
            
            <div className="space-y-6">
              {/* Location Type Toggle */}
              <div className="relative bg-purple-900/20 p-1 rounded-xl border border-purple-800/30">
                <div className="flex">
                  <button
                    type="button"
                    onClick={() => updateProjectData({ is_remote: false, location: '' })}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      !projectData.is_remote 
                        ? 'bg-purple-700/50 text-white shadow-sm' 
                        : 'text-purple-300 hover:text-white hover:bg-purple-800/30'
                    }`}
                  >
                    In-Person
                  </button>
                  <button
                    type="button"
                    onClick={() => updateProjectData({ is_remote: true, location: 'Remote' })}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      projectData.is_remote 
                        ? 'bg-purple-700/50 text-white shadow-sm' 
                        : 'text-purple-300 hover:text-white hover:bg-purple-800/30'
                    }`}
                  >
                    Remote
                  </button>
                </div>
              </div>
              
              {/* Location Input */}
              {!projectData.is_remote ? (
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={projectData.location}
                      onChange={(e) => updateProjectData({ location: e.target.value })}
                      placeholder="Enter city, state, or country"
                      className="w-full pl-10 pr-4 py-3 bg-purple-900/30 border border-purple-800/50 rounded-lg text-white placeholder-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-purple-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-purple-300">Popular locations:</p>
                    <div className="flex flex-wrap gap-2">
                      {['New York', 'Los Angeles', 'London', 'Tokyo', 'Berlin', 'Sydney'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => updateProjectData({ location: loc })}
                          className="px-3 py-1.5 text-sm rounded-full bg-purple-900/40 text-purple-200 hover:bg-purple-800/50 border border-purple-800/50 hover:border-purple-700/70 transition-colors"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800/30 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-800/30 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-300" />
                  </div>
                  <p className="text-purple-200 text-sm">
                    Your project will be visible to creators worldwide.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 5: // Settings
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Settings className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Almost There!</h2>
              <p className="text-purple-200">Review your project details</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <h3 className="font-medium text-purple-200 mb-3">Project Overview</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex">
                    <span className="w-24 text-purple-400">Title:</span>
                    <span className="text-white">{projectData.title || 'Not specified'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-purple-400">Description:</span>
                    <span className="text-white flex-1">
                      {projectData.description || 'No description provided'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-purple-400">Looking for:</span>
                    <span className="text-white">
                      {projectData.roles_needed.length > 0 
                        ? projectData.roles_needed.join(', ')
                        : 'No roles specified'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-purple-400">Type:</span>
                    <span className="text-white">{projectData.collab_type}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-purple-400">Location:</span>
                    <span className="text-white">
                      {projectData.is_remote 
                        ? 'Remote' 
                        : projectData.location || 'Not specified'}
                    </span>
                  </div>
                  {projectData.tags.length > 0 && (
                    <div className="flex">
                      <span className="w-24 text-purple-400">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {projectData.tags.map(tag => (
                          <span 
                            key={tag}
                            className="px-2 py-0.5 text-xs rounded-full bg-purple-800/50 text-purple-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-800/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-purple-200">Content Settings</h3>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="nsfw"
                    checked={projectData.nsfw}
                    onChange={(e) => updateProjectData({ nsfw: e.target.checked })}
                    className="h-4 w-4 text-purple-500 rounded focus:ring-purple-500 border-purple-700 bg-purple-800/50"
                  />
                  <label htmlFor="nsfw" className="ml-2 text-sm text-purple-200">
                    This project contains NSFW content
                  </label>
                </div>
                <p className="mt-2 text-xs text-purple-400">
                  {projectData.nsfw 
                    ? '⚠️ Your project will be marked as containing adult content.'
                    : 'Select if your project contains explicit or adult-oriented content.'}
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <ProjectFormGlassCard 
      currentStep={currentStep}
      totalSteps={steps.length}
      onClose={onClose}
      className={success ? 'flex flex-col' : ''}
    >
      {/* Error and success messages */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-800 text-red-100 text-sm">
          {error}
        </div>
      )}

      {success ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Project Created!</h3>
          <p className="text-purple-200 mb-8">Your project has been successfully created.</p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full sm:w-auto bg-purple-900/30 hover:bg-purple-800/50 text-white border border-purple-800/50"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                onClose();
                onProjectCreated?.();
              }}
              className="w-full sm:w-auto bg-purple-600/30 hover:bg-purple-700/30 text-white"
            >
              View Project
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-1 pb-24">
            {renderStep()}
          </div>

          {/* Fixed Navigation buttons */}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm p-4 border-t border-purple-800/30 z-50">
            <div className="max-w-3xl mx-auto flex justify-between items-center">
              <div className="h-10 flex items-center">
                {currentStep > 0 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    variant="ghost"
                    className="h-10 text-purple-300 hover:bg-purple-800/30 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                ) : (
                  <div className="w-0" />
                )}
              </div>

              <div className="h-10 flex items-center">
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="h-10 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Project'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      )}
    </ProjectFormGlassCard>
  )
}