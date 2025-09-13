import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Check, User, Users, MapPin, Sparkles, Camera, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent, CardHeader } from './ui/Card'
import { Badge } from './ui/Badge'
import { useProfile } from '../hooks/useProfile'
import { CREATOR_ROLES, CREATIVE_TAGS } from '../lib/utils'

interface OnboardingWizardProps {
  onComplete: () => void
}

interface ProfileData {
  username: string
  full_name: string
  roles: string[]
  skills: string[]
  looking_for: string[]
  tagline: string
  vibe_words: string[]
  location: string
  is_remote: boolean
  nsfw_preference: boolean
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { createProfile } = useProfile()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    full_name: '',
    roles: [],
    skills: [],
    looking_for: [],
    tagline: '',
    vibe_words: [],
    location: '',
    is_remote: false,
    nsfw_preference: false,
  })

  const steps = [
    { title: 'Basic Info', icon: User },
    { title: 'Your Roles', icon: Camera },
    { title: 'Skills & Interests', icon: Sparkles },
    { title: 'Looking For', icon: Users },
    { title: 'Creative Vibe', icon: Sparkles },
    { title: 'Location', icon: MapPin },
    { title: 'Preferences', icon: Settings },
  ]

  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }))
  }

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item]
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return profileData.username.trim() && profileData.full_name.trim()
      case 1:
        return profileData.roles.length > 0
      case 2:
        return true // Skills are optional
      case 3:
        return profileData.looking_for.length > 0
      case 4:
        return profileData.vibe_words.length >= 1
      case 5:
        return profileData.location.trim()
      case 6:
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

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { error } = await createProfile(profileData)
      if (error) {
        console.error('Error creating profile:', error)
        alert('Failed to create profile. Please try again.')
      } else {
        onComplete()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's get to know you</h2>
              <p className="text-gray-600">Tell us your name and choose a unique username</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => updateProfileData({ full_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => updateProfileData({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your_username"
                />
                <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and underscores</p>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Camera className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you create?</h2>
              <p className="text-gray-600">Select all the roles that describe you</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => updateProfileData({ roles: toggleArrayItem(profileData.roles, role) })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    profileData.roles.includes(role)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your creative skills</h2>
              <p className="text-gray-600">What specific skills do you bring? (Optional)</p>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const skill = e.currentTarget.value.trim()
                    if (skill && !profileData.skills.includes(skill)) {
                      updateProfileData({ skills: [...profileData.skills, skill] })
                      e.currentTarget.value = ''
                    }
                  }
                }}
              />
              
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                    onClick={() => updateProfileData({ skills: profileData.skills.filter(s => s !== skill) })}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Who do you want to work with?</h2>
              <p className="text-gray-600">Select the types of creators you'd like to collaborate with</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => updateProfileData({ looking_for: toggleArrayItem(profileData.looking_for, role) })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    profileData.looking_for.includes(role)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your creative vibe?</h2>
              <p className="text-gray-600">Choose words that describe your creative style</p>
            </div>
            
            <div>
              <textarea
                value={profileData.tagline}
                onChange={(e) => updateProfileData({ tagline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
                placeholder="Write a short tagline about yourself..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {CREATIVE_TAGS.map((word) => (
                <button
                  key={word}
                  onClick={() => updateProfileData({ vibe_words: toggleArrayItem(profileData.vibe_words, word) })}
                  className={`p-2 rounded-lg text-sm font-medium transition-all ${
                    profileData.vibe_words.includes(word)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  }`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <MapPin className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Where are you based?</h2>
              <p className="text-gray-600">This helps us show you relevant local collaborations</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => updateProfileData({ location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remote"
                  checked={profileData.is_remote}
                  onChange={(e) => updateProfileData({ is_remote: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="remote" className="text-sm text-gray-700">
                  I'm open to remote collaborations
                </label>
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Settings className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Final preferences</h2>
              <p className="text-gray-600">Set your content preferences</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="nsfw"
                    checked={profileData.nsfw_preference}
                    onChange={(e) => updateProfileData({ nsfw_preference: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="nsfw" className="text-sm font-medium text-gray-900">
                    Show NSFW content
                  </label>
                </div>
                <p className="text-xs text-gray-600 ml-7">
                  This includes explicit or adult-oriented creative projects. You can change this later in settings.
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
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
                  {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <h1 className="text-sm font-medium text-purple-600 text-center">
            {steps[currentStep].title}
          </h1>
        </CardHeader>

        <CardContent>
          {renderStep()}
          
          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            
            {currentStep === steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleComplete}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
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