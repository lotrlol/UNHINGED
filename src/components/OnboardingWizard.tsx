import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, User, Users, MapPin, Sparkles, Camera, Settings, ArrowRight } from 'lucide-react';
import { OnboardingGlassCard } from './ui/GlassCard';
import { useProfile } from '../hooks/useProfile';
import { CREATOR_ROLES, CREATIVE_TAGS } from '../lib/utils';
import { cn } from '../lib/utils';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
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

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
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
    { 
      title: 'Basic Info', 
      icon: User,
      description: 'Tell us your name and choose a unique username'
    },
    { 
      title: 'Your Roles', 
      icon: Camera,
      description: 'Select all the roles that describe you'
    },
    { 
      title: 'Skills & Interests', 
      icon: Sparkles,
      description: 'What specific skills do you bring?'
    },
    { 
      title: 'Looking For', 
      icon: Users,
      description: 'Select the types of creators you\'d like to collaborate with'
    },
    { 
      title: 'Creative Vibe', 
      icon: Sparkles,
      description: 'Choose words that describe your creative style'
    },
    { 
      title: 'Location', 
      icon: MapPin,
      description: 'This helps us show you relevant local collaborations'
    },
    { 
      title: 'Preferences', 
      icon: Settings,
      description: 'Set your content preferences'
    },
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

  const handleSubmit = async () => {
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

  const renderStep = (step: number) => {
    const stepClasses = 'space-y-6 py-2';
    const inputClasses = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-white placeholder-gray-400';
    const labelClasses = 'block text-sm font-medium text-purple-200 mb-2';
    const buttonBaseClasses = 'px-4 py-2 rounded-xl transition-all duration-200';
    const buttonActiveClasses = 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-500/30';
    const buttonInactiveClasses = 'bg-white/5 hover:bg-white/10 text-gray-300';
    const cardClasses = 'bg-gradient-to-br from-gray-900/70 via-gray-900/60 to-purple-900/20 border border-purple-900/30 hover:border-purple-800/50';
    const activeTextGradient = 'bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent';

    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <User className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>Let's get to know you</h2>
              <p className="text-purple-200/80">Tell us your name and choose a unique username</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClasses}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => updateProfileData({ full_name: e.target.value })}
                  className={inputClasses}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className={labelClasses}>
                  Username
                </label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => updateProfileData({ username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  className={inputClasses}
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
              <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>What do you create?</h2>
              <p className="text-purple-200/80">Select all the roles that describe you</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => updateProfileData({ roles: toggleArrayItem(profileData.roles, role) })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    profileData.roles.includes(role)
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-400/50 shadow-lg shadow-purple-900/20'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/30'
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
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>Your creative skills</h2>
              <p className="text-purple-200/80">What specific skills do you bring? (Optional)</p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Add a skill and press Enter"
                className={inputClasses}
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
                  <button
                    key={skill}
                    onClick={() => updateProfileData({ skills: profileData.skills.filter(s => s !== skill) })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-800/50 text-gray-200 hover:bg-gray-700/70 border border-gray-700/50 hover:border-purple-500/30`}
                  >
                    {skill} ×
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Users className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>Who do you want to work with?</h2>
              <p className="text-purple-200/80">Select the types of creators you'd like to collaborate with</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => updateProfileData({ looking_for: toggleArrayItem(profileData.looking_for, role) })}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    profileData.looking_for.includes(role)
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-400/50 shadow-lg shadow-purple-900/20'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/30'
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
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>What's your creative vibe?</h2>
              <p className="text-purple-200/80">Choose words that describe your creative style</p>
            </div>

            <div>
              <textarea
                value={profileData.tagline}
                onChange={(e) => updateProfileData({ tagline: e.target.value })}
                className={inputClasses}
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
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white border border-purple-400/50 shadow-lg shadow-purple-900/20'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:border-purple-500/30'
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
              <MapPin className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>Where are you based?</h2>
              <p className="text-purple-200/80">This helps us show you relevant local collaborations</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClasses}>
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => updateProfileData({ location: e.target.value })}
                  className={inputClasses}
                  placeholder="City, Country"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="remote"
                  checked={profileData.is_remote}
                  onChange={(e) => updateProfileData({ is_remote: e.target.checked })}
                  className="w-4 h-4 text-purple-400 rounded focus:ring-purple-500 bg-gray-700 border-gray-600"
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
              <Settings className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${activeTextGradient}`}>Final preferences</h2>
              <p className="text-purple-200/80">Set your content preferences</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800/30 rounded-xl border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="nsfw"
                    checked={profileData.nsfw_preference}
                    onChange={(e) => updateProfileData({ nsfw_preference: e.target.checked })}
                    className="w-4 h-4 text-purple-400 rounded focus:ring-purple-500 bg-gray-700 border-gray-600"
                  />
                  <label htmlFor="nsfw" className="text-sm font-medium text-purple-200">
                    Show NSFW content
                  </label>
                </div>
                <p className="text-xs text-purple-200/60 ml-7">
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        
        <OnboardingGlassCard
          title={steps[currentStep].title}
          description={steps[currentStep].description}
          currentStep={currentStep + 1}
          totalSteps={steps.length}
          onClose={onClose}
          onBack={currentStep > 0 ? () => setCurrentStep(currentStep - 1) : undefined}
          onNext={currentStep < steps.length - 1 ? () => setCurrentStep(currentStep + 1) : handleSubmit}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
          hideNavigation={loading}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="py-2"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-purple-200/80">Saving your profile...</p>
                </div>
              ) : (
                renderStep(currentStep)
              )}
            </motion.div>
          </AnimatePresence>
        </OnboardingGlassCard>
      </motion.div>
    </AnimatePresence>
  )
}