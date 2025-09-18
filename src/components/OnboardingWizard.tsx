import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User, Users, Camera, Sparkles, Settings, X, Check, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '../types/database';

const ROLE_SKILLS: Record<string, string[]> = {
  '📸 Photographer': [
    'Composition', 'Lighting', 'Editing', 'Retouching', 'Framing',
    'Focus', 'Exposure', 'Angles', 'Color', 'Storytelling',
    'Directing', 'Workflow', 'Printing', 'Cropping', 'Styling',
    'Posing', 'Timing'
  ],
  '👗 Model': [
    'Posing', 'Expression', 'Posture', 'Walking', 'Styling',
    'Endurance', 'Adaptability', 'Confidence', 'Awareness', 'Branding',
    'Portfolio', 'Etiquette', 'Fitness', 'Balance', 'Versatility',
    'Presence', 'Marketing'
  ],
  '🎵 Musician': [
    'Technique', 'Theory', 'Ear', 'Rhythm', 'Timing',
    'Improvisation', 'Composition', 'Notation', 'Dynamics', 'Performance',
    'Harmony', 'Practice', 'Versatility', 'Discipline', 'Expression',
    'Collaboration', 'Networking'
  ],
  '🎤 Singer': [
    'Range', 'Breathing', 'Pitch', 'Tone', 'Diction',
    'Vibrato', 'Harmony', 'Projection', 'Control', 'Emotion',
    'Improvisation', 'Presence', 'Recording', 'Interpretation', 'Endurance',
    'Versatility', 'Health'
  ],
  '🎚️ Producer': [
    'Mixing', 'Mastering', 'Sampling', 'Arrangement', 'Sounddesign',
    'Sequencing', 'Automation', 'Layering', 'Recording', 'Editing',
    'Composing', 'Resampling', 'Looping', 'Engineering', 'Workflow',
    'Collaboration', 'Networking'
  ],
  '🎬 Director': [
    'Vision', 'Storyboarding', 'Blocking', 'Casting', 'Pacing',
    'Framing', 'Leadership', 'Collaboration', 'Communication', 'Storytelling',
    'Creativity', 'Planning', 'Problem-solving', 'Adaptability', 'Focus',
    'Innovation', 'Management'
  ],
  '🎭 Actor': [
    'Memorization', 'Improvisation', 'Projection', 'Diction', 'Presence',
    'Emotion', 'Movement', 'Adaptability', 'Timing', 'Awareness',
    'Expression', 'Listening', 'Collaboration', 'Versatility', 'Discipline',
    'Concentration', 'Confidence'
  ],
  '✍️ Writer': [
    'Grammar', 'Syntax', 'Vocabulary', 'Clarity', 'Structure',
    'Creativity', 'Research', 'Storytelling', 'Editing', 'Proofreading',
    'Consistency', 'Flow', 'Voice', 'Style', 'Imagination',
    'Discipline', 'Persuasion'
  ],
  '🎨 Designer': [
    'Typography', 'Layout', 'Color', 'Branding', 'Sketching',
    'Prototyping', 'Wireframing', 'Illustration', 'Animation', 'Composition',
    'Creativity', 'Usability', 'Aesthetics', 'Innovation', 'Adaptability',
    'Collaboration', 'Presentation'
  ],
  '🖌️ Artist': [
    'Drawing', 'Painting', 'Shading', 'Sculpting', 'Sketching',
    'Color', 'Texture', 'Perspective', 'Composition', 'Creativity',
    'Imagination', 'Observation', 'Expression', 'Style', 'Technique',
    'Discipline', 'Innovation'
  ],
  '💃 Dancer': [
    'Rhythm', 'Balance', 'Flexibility', 'Stamina', 'Strength',
    'Choreography', 'Expression', 'Timing', 'Coordination', 'Memory',
    'Improvisation', 'Awareness', 'Musicality', 'Versatility', 'Precision',
    'Presence', 'Discipline'
  ],
  '🎥 Videographer': [
    'Framing', 'Lighting', 'Shooting', 'Storyboarding', 'Composition',
    'Pacing', 'Stability', 'Movement', 'Focus', 'Angles',
    'Recording', 'Editing', 'Storytelling', 'Directing', 'Workflow',
    'Equipment', 'Color'
  ],
  '✂️ Editor': [
    'Cutting', 'Sequencing', 'Timing', 'Trimming', 'Syncing',
    'Effects', 'Transitions', 'Grading', 'Color', 'Rendering',
    'Workflow', 'Audio', 'Pacing', 'Storytelling', 'Continuity',
    'Creativity', 'Precision'
  ],
  '💄 Makeup Artist': [
    'Contouring', 'Blending', 'Shading', 'Highlighting', 'Styling',
    'Hygiene', 'Color', 'Matching', 'Liner', 'Brows',
    'Lashes', 'Foundation', 'Texture', 'Creativity', 'Precision',
    'Tools', 'Trends'
  ],
  '👔 Stylist': [
    'Matching', 'Layering', 'Accessorizing', 'Tailoring', 'Coordination',
    'Grooming', 'Trendspotting', 'Shopping', 'Wardrobe', 'Versatility',
    'Branding', 'Adaptability', 'Creativity', 'Presentation', 'Networking',
    'Balance', 'Confidence'
  ],
  '🎧 DJ': [
    'Mixing', 'Beatmatching', 'Scratching', 'Looping', 'Sampling',
    'Transitioning', 'Layering', 'EQing', 'Cueing', 'Reading',
    'Timing', 'Phrasing', 'Blending', 'Remixing', 'Creativity',
    'Presence', 'Energy'
  ],
  '📱 Influencer': [
    'Branding', 'Storytelling', 'Marketing', 'Networking', 'Consistency',
    'Engagement', 'Creativity', 'Strategy', 'Authenticity', 'Aesthetics',
    'Communication', 'Outreach', 'Negotiation', 'Adaptability', 'Analytics',
    'Promotion', 'Collaboration'
  ]
};

// Memoize the skills for roles to prevent re-shuffling
const roleSkillsCache = new Map<string, string[]>();

const getSkillsForRoles = (roles: string[]): string[] => {
  if (roles.length === 0) return [];
  
  // Create a cache key based on the sorted roles
  const cacheKey = [...roles].sort().join(',');
  
  // Return cached result if available
  if (roleSkillsCache.has(cacheKey)) {
    return roleSkillsCache.get(cacheKey)!;
  }
  
  // Get all skills for selected roles
  let allSkills: string[] = [];
  roles.forEach(role => {
    // Find the role in ROLE_SKILLS by matching the role name without emoji
    const roleKey = Object.keys(ROLE_SKILLS).find(key => 
      key.includes(role)
    );
    
    if (roleKey && ROLE_SKILLS[roleKey]) {
      allSkills = [...allSkills, ...ROLE_SKILLS[roleKey]];
    }
  });
  
  // Remove duplicates while preserving order
  const uniqueSkills = allSkills.filter((skill, index, self) => 
    self.indexOf(skill) === index
  );
  
  let result: string[];
  
  // If we have more than 17 skills, take the first 17 from the original order
  if (uniqueSkills.length > 17) {
    // Sort the unique skills to ensure consistent order
    const sortedSkills = [...uniqueSkills].sort((a, b) => a.localeCompare(b));
    // Take first 17 from the sorted list
    result = sortedSkills.slice(0, 17);
  } else {
    result = uniqueSkills;
  }
  
  // Cache the result
  roleSkillsCache.set(cacheKey, result);
  
  return result;
};
import { useProfile } from '../hooks/useProfile';
import { CREATOR_ROLES, CREATIVE_TAGS } from '../lib/utils';

// Helper function to extract keywords from description
const extractKeywords = (text: string, possibleKeywords: string[]): string[] => {
  if (!text) return [];
  return possibleKeywords.filter(keyword => 
    new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i').test(text.toLowerCase())
  );
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ProfileData {
  id?: string;
  username: string;
  full_name: string;
  roles: string[];
  skills: string[];
  looking_for: string[];
  tagline: string;
  bio?: string | null;
  vibe_words: string[];
  location: string;
  is_remote: boolean;
  nsfw_preference: boolean;
  avatar_url?: string | null;
  avatar_path?: string | null;
  cover_url?: string | null;
  banner_url?: string | null;
  banner_path?: string | null;
  is_verified?: boolean;
  phone_verified?: boolean;
  flagged?: boolean;
  onboarding_completed?: boolean;
  created_at?: string;
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const { createProfile, fetchProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customLookingFor, setCustomLookingFor] = useState('');
  const [vibeDescription, setVibeDescription] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCustomLookingForInput, setShowCustomLookingForInput] = useState(false);
  const prevStepRef = useRef<number>(-1);
  
  // Location state
  const [locationInput, setLocationInput] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  
  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    full_name: '',
    roles: [],  // This should be an array of strings
    skills: [],
    looking_for: [],
    tagline: '',
    vibe_words: [],
    location: '',
    is_remote: false,
    nsfw_preference: false,
    avatar_url: null,
    avatar_path: null,
    banner_url: null,
    banner_path: null,
    is_verified: false,
    phone_verified: false,
    flagged: false,
    onboarding_completed: false
  });
  
  // Carousel state
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 0: none, 1: next, -1: prev
  
  // Carousel categories
  const COLLAB_CATEGORIES = [
    {
      id: 'opportunities',
      title: 'Opportunities',
      options: ['Paid Work', 'Revenue Share', 'Commercial Work', 'Brand Partnerships']
    },
    {
      id: 'collaborations',
      title: 'Collaborations',
      options: ['Creative Partnerships', 'Skill Exchange', 'Mentorship', 'Networking']
    },
    {
      id: 'projects',
      title: 'Projects',
      options: ['Portfolio Building', 'Passion Projects', 'Event Coverage', 'Content Creation']
    },
    {
      id: 'other',
      title: 'Other',
      options: ['Teaching', 'Learning', 'Exposure', 'Fun Projects']
    }
  ];
  
  // Carousel navigation functions
  const handleSelectOption = (option: string) => {
    // Toggle selection
    const newLookingFor = toggleArrayItem(profileData.looking_for, option);
    updateProfileData({ looking_for: newLookingFor });
    
    // Auto-advance to next category if not the last one
    if (currentCategoryIndex < COLLAB_CATEGORIES.length - 1) {
      setDirection(1);
      setTimeout(() => {
        setCurrentCategoryIndex(prev => prev + 1);
        setDirection(0);
      }, 300);
    }
  };

  const goToNext = () => {
    if (currentCategoryIndex < COLLAB_CATEGORIES.length - 1) {
      setDirection(1);
      setTimeout(() => {
        setCurrentCategoryIndex(prev => prev + 1);
        setDirection(0);
      }, 300);
    }
  };

  const goToPrev = () => {
    if (currentCategoryIndex > 0) {
      setDirection(-1);
      setTimeout(() => {
        setCurrentCategoryIndex(prev => prev - 1);
        setDirection(0);
      }, 300);
    }
  };

  const getSlidePosition = (index: number) => {
    if (direction === 0) {
      return index === currentCategoryIndex ? 0 : index > currentCategoryIndex ? 100 : -100;
    } else if (direction === 1) {
      return index === currentCategoryIndex ? -100 : index > currentCategoryIndex ? 100 : -200;
    } else {
      return index === currentCategoryIndex ? 100 : index > currentCategoryIndex ? 200 : 0;
    }
  };
  
  
  // Initialize location input with profile data
  useEffect(() => {
    if (profileData.location) {
      setLocationInput(profileData.location);
    }
  }, [profileData.location]);
  
  // Update profile data when location input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput !== profileData.location) {
        updateProfileData({ location: locationInput });
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [locationInput]);
  
  // Detect user's current location
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setIsDetectingLocation(true);
    setLocationError('');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      const { latitude, longitude } = position.coords;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'UNHINGED/1.0 (https://unhinged.app; contact@unhinged.app)'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      const country = data.address?.country || '';
      const locationString = [city, country].filter(Boolean).join(', ') || 'Unknown location';
      
      setLocationInput(locationString);
      updateProfileData({ 
        location: locationString,
        is_remote: false 
      });
      
    } catch (error) {
      console.error('Error detecting location:', error);
      if (error instanceof GeolocationPositionError) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission was denied. Please enable it in your browser settings.');
            setPermissionStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('The request to get your location timed out. Please try again.');
            break;
          default:
            setLocationError('Could not determine your location. Please enter it manually.');
        }
      } else {
        setLocationError('Could not determine your location. Please enter it manually.');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Handle permission response from user
  const handlePermissionResponse = async (granted: boolean) => {
    setShowPermissionPrompt(false);
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      await detectLocation();
    } else {
      setLocationError('Location access was denied. Please enter your location manually.');
    }
  };

  // Check geolocation permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if ('permissions' in navigator && 'geolocation' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          setPermissionStatus(permissionStatus.state);
          
          permissionStatus.onchange = () => {
            setPermissionStatus(permissionStatus.state);
          };
        } catch (error) {
          console.error('Error checking geolocation permission:', error);
        }
      }
    };
    
    checkPermission();
  }, []);

  // Auto-detect location when on step 5 with granted permission
  useEffect(() => {
    const detectLocationIfNeeded = async () => {
      if (currentStep === 5 && permissionStatus === 'granted' && !locationInput) {
        await detectLocation();
      }
    };
    
    detectLocationIfNeeded();
  }, [currentStep, permissionStatus, locationInput]);

  // Update local state when profile data changes or step changes
  useEffect(() => {
    if (currentStep === 4 && prevStepRef.current !== 4) {
      setVibeDescription(profileData.tagline || '');
    }
    prevStepRef.current = currentStep;
  }, [currentStep, profileData.tagline]);

  const handleAddCustomLookingFor = () => {
    const lookingForItem = customLookingFor.trim();
    if (lookingForItem && !profileData.looking_for.includes(lookingForItem)) {
      setProfileData(prev => ({ ...prev, looking_for: [...prev.looking_for, lookingForItem] }));
      setCustomLookingFor('');
      setShowCustomLookingForInput(false);
    }
  };

  const steps = [
    {
      title: 'Welcome to UNHINGED',
      description: 'Let\'s set up your profile to connect with other creatives',
      icon: <Sparkles className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'Your Profile',
      description: 'Tell us a bit about yourself',
      icon: <User className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'What are your creative roles?',
      description: 'Select or enter your primary creative focuses',
      icon: <User className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'Your skills',
      description: 'Add 3-5 skills that best represent your expertise',
      icon: <Settings className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'What are you looking for?',
      description: 'Help others understand how they can collaborate with you',
      icon: <Users className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'Describe your creative vibe',
      description: 'What words capture your style and approach?',
      icon: <Camera className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'Where are you based?',
      description: 'Share your location to connect with creatives nearby',
      icon: <MapPin className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'Content Preferences',
      description: 'Customize your content viewing experience',
      icon: <Eye className="w-6 h-6 text-purple-400" />
    },
    {
      title: 'Final touches',
      description: 'Review and complete your profile',
      icon: <Check className="w-6 h-6 text-purple-400" />
    },
  ];

  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleNext = async () => {
    // If this is the last step, submit the form
    if (currentStep === steps.length - 2) {
      await handleSubmit();
    } else {
      // Otherwise, just go to the next step
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('Starting profile submission...');
    
    // Generate a random username if not provided
    const generatedUsername = `user_${Math.random().toString(36).substr(2, 8)}`;
    
    // Prepare the data to be saved with only the fields that exist in the database schema
    const dataToSave: Omit<Database['public']['Tables']['profiles']['Insert'], 'id' | 'created_at' | 'updated_at'> = {
      username: profileData.username.trim() || generatedUsername,
      full_name: profileData.full_name.trim() || 'New User',
      roles: Array.isArray(profileData.roles) ? profileData.roles : [],
      skills: Array.isArray(profileData.skills) ? profileData.skills : [],
      looking_for: Array.isArray(profileData.looking_for) ? profileData.looking_for : [],
      vibe_words: Array.isArray(profileData.vibe_words) ? profileData.vibe_words : [],
      tagline: profileData.tagline || '',
      bio: profileData.bio || null,
      location: profileData.location || null,
      is_remote: Boolean(profileData.is_remote),
      nsfw_preference: Boolean(profileData.nsfw_preference),
      avatar_url: profileData.avatar_url || null,
      avatar_path: profileData.avatar_path || null,
      banner_url: profileData.banner_url || null,
      banner_path: profileData.banner_path || null,
      cover_url: profileData.cover_url || null,
      is_verified: false,
      phone_verified: false,
      flagged: false,
      onboarding_completed: true,
    };
    
    console.log('Prepared profile data for submission:', JSON.stringify(dataToSave, null, 2));
    
    console.log('Profile data to be saved:', JSON.stringify(dataToSave, null, 2));
    
    setIsLoading(true);
    try {
      console.log('Calling createProfile with data:', dataToSave);
      const { data, error } = await createProfile(dataToSave);
      
      if (error) {
        console.error('Error from createProfile:', error);
        throw error;
      }
      
      console.log('Profile created successfully:', data);
      
      // Move to the success step
      setCurrentStep(steps.length - 1);
      
      // Show success message
      toast.success('Profile created successfully!');
      
      // Give the profile time to update before closing
      try {
        console.log('Refreshing profile data...');
        await fetchProfile();
        console.log('Profile data refreshed successfully');
      } catch (err) {
        console.warn('Error refreshing profile data:', err);
        // Continue even if refresh fails
      }
      
      // Close the wizard with a small delay to ensure UI updates
      setTimeout(() => {
        console.log('Completing onboarding...');
        onComplete();
      }, 500);
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Failed to save profile. Please try again.');
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to save profile') 
      };
    } finally {
      console.log('Profile submission completed');
      setIsLoading(false);
    }
  };

  // Define handlers for role selection
  const handleRoleSelect = (role: string) => {
    const newRoles = [...selectedRoles];
    if (!newRoles.includes(role)) {
      newRoles.push(role);
    }
    setSelectedRoles(newRoles);
    updateProfileData({ roles: newRoles });
  };
  
  const handleCustomRoleAdd = () => {
    if (customRole.trim()) {
      const newRoles = [...selectedRoles, customRole.trim()];
      setSelectedRoles(newRoles);
      updateProfileData({ roles: newRoles });
      setCustomRole('');
    }
  };

  // Render the current step
  const renderStep = (step: number) => {
    const currentStepData = steps[step];
    
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70">{currentStepData.description}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
              <p className="text-white/80 text-center text-sm">
                We'll guide you through a few quick steps to set up your profile and connect you with other creatives.
              </p>
            </div>
          </div>
        );
        
      case 1: // Profile Information
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Your Profile</h3>
              <p className="text-white/70 mb-6">Let's start with the basics</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white/70 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={profileData.full_name}
                  onChange={(e) => updateProfileData({ full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Your full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white/70 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/50">
                    @
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={profileData.username}
                    onChange={(e) => {
                      // Only allow alphanumeric characters, underscores, and hyphens
                      const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
                      updateProfileData({ username: value });
                    }}
                    className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="username"
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <p className="mt-1 text-xs text-white/50">
                  {profileData.username ? `${profileData.username.length}/30 characters` : '3-30 characters, letters, numbers, _ and - only'}
                </p>
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-white/50">
                  * Required fields. You can update this information later in your profile settings.
                </p>
              </div>
            </div>
          </div>
        );
      
      case 1: // Role selection
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70 mb-6">{currentStepData.description}</p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {['📸 Photographer', '👗 Model', '💄 MUA', '🎨 Stylist'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedRoles.includes(role)
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-1">{role.split(' ')[0]}</div>
                    <div className="text-sm font-medium">{role.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
              
              <div className="relative mt-4">
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Or enter your own role"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {customRole && (
                  <button
                    onClick={handleCustomRoleAdd}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      
      case 2: // Skills
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70 mb-6">{currentStepData.description}</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {profileData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                    <span className="text-sm">{skill}</span>
                    <button
                      onClick={() => {
                        setProfileData(prev => ({
                          ...prev,
                          skills: prev.skills.filter((_, i) => i !== index)
                        }));
                      }}
                      className="ml-1.5 text-white/50 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customSkill.trim()) {
                      if (!profileData.skills.includes(customSkill.trim())) {
                        setProfileData(prev => ({
                          ...prev,
                          skills: [...prev.skills, customSkill.trim()]
                        }));
                      }
                      setCustomSkill('');
                    }
                  }}
                  placeholder="Type a skill and press Enter"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {customSkill && (
                  <button
                    onClick={() => {
                      if (customSkill.trim() && !profileData.skills.includes(customSkill.trim())) {
                        setProfileData(prev => ({
                          ...prev,
                          skills: [...prev.skills, customSkill.trim()]
                        }));
                        setCustomSkill('');
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {showSuggestions && profileData.roles?.length > 0 && ROLE_SKILLS[profileData.roles[0]] && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-white/50">SUGGESTED SKILLS</span>
                    <button 
                      onClick={() => setShowSuggestions(false)}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ROLE_SKILLS[profileData.roles[0]]
                      .filter(skill => !profileData.skills.includes(skill))
                      .map((skill, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (!profileData.skills.includes(skill)) {
                              setProfileData(prev => ({
                                ...prev,
                                skills: [...prev.skills, skill]
                              }));
                            }
                          }}
                          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors"
                        >
                          {skill}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 3: // What are you looking for
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70 mb-6">{currentStepData.description}</p>
            </div>
            
            <div className="space-y-4">
              {/* Selected items */}
              {profileData.looking_for.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileData.looking_for.map((item, index) => (
                    <div key={index} className="flex items-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full px-4 py-2">
                      <span className="text-sm font-medium text-white">{item}</span>
                      <button
                        onClick={() => {
                          setProfileData(prev => ({
                            ...prev,
                            looking_for: prev.looking_for.filter((_, i) => i !== index)
                          }));
                        }}
                        className="ml-2 -mr-1 p-1 text-white/60 hover:text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Search and add new */}
              <div className="relative">
                <input
                  type="text"
                  value={customLookingFor}
                  onChange={(e) => setCustomLookingFor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customLookingFor.trim()) {
                      if (!profileData.looking_for.includes(customLookingFor.trim())) {
                        setProfileData(prev => ({
                          ...prev,
                          looking_for: [...prev.looking_for, customLookingFor.trim()]
                        }));
                      }
                      setCustomLookingFor('');
                    }
                  }}
                  placeholder="Type and press Enter to add"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {customLookingFor && (
                  <button
                    onClick={() => {
                      if (customLookingFor.trim() && !profileData.looking_for.includes(customLookingFor.trim())) {
                        setProfileData(prev => ({
                          ...prev,
                          looking_for: [...prev.looking_for, customLookingFor.trim()]
                        }));
                        setCustomLookingFor('');
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Suggestions */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-medium text-white/50">POPULAR CHOICES</span>
                  {showSuggestions ? (
                    <button 
                      onClick={() => setShowSuggestions(false)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Hide suggestions
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowSuggestions(true)}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Show suggestions
                    </button>
                  )}
                </div>
                
                {showSuggestions && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { text: '🤝 Collaboration', value: 'Collaboration' },
                      { text: '💰 Paid Work', value: 'Paid Work' },
                      { text: '📷 TFP', value: 'TFP' },
                      { text: '🎓 Mentorship', value: 'Mentorship' },
                      { text: '🌐 Networking', value: 'Networking' },
                      { text: '✨ Creative Exchange', value: 'Creative Exchange' },
                      { text: '🎨 Portfolio Building', value: 'Portfolio Building' },
                      { text: '💡 Feedback', value: 'Feedback' },
                      { text: '🎭 Creative Direction', value: 'Creative Direction' },
                      { text: '📸 Test Shoots', value: 'Test Shoots' },
                      { text: '🎥 Video Projects', value: 'Video Projects' },
                      { text: '🎤 Voice Work', value: 'Voice Work' }
                    ]
                    .filter(item => !profileData.looking_for.includes(item.value))
                    .map((item, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!profileData.looking_for.includes(item.value)) {
                            setProfileData(prev => ({
                              ...prev,
                              looking_for: [...prev.looking_for, item.value]
                            }));
                          }
                        }}
                        className="flex items-center justify-center text-center p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm text-white/90 hover:text-white"
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Help text */}
              <p className="text-xs text-white/50 mt-4">
                Add what you're looking for in your creative journey. This helps others understand how they can collaborate with you.
              </p>
            </div>
          </div>
        );
      
      case 4: // Describe your creative vibe
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70 mb-6">{currentStepData.description}</p>
            </div>
            
            <div className="space-y-6">
              {/* Selected vibe words */}
              {profileData.vibe_words.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/70">Your vibe</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileData.vibe_words.map((word, index) => (
                      <div key={index} className="flex items-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-full px-4 py-2">
                        <span className="text-sm font-medium text-white">{word}</span>
                        <button
                          onClick={() => {
                            setProfileData(prev => ({
                              ...prev,
                              vibe_words: prev.vibe_words.filter((_, i) => i !== index)
                            }));
                          }}
                          className="ml-2 -mr-1 p-1 text-white/60 hover:text-white transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Vibe word input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="vibeInput" className="text-sm font-medium text-white/70">Add vibe words</label>
                  <span className="text-xs text-white/50">{profileData.vibe_words.length}/5</span>
                </div>
                <div className="relative">
                  <input
                    id="vibeInput"
                    type="text"
                    value={vibeDescription}
                    onChange={(e) => setVibeDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && vibeDescription.trim() && profileData.vibe_words.length < 5) {
                        if (!profileData.vibe_words.includes(vibeDescription.trim())) {
                          setProfileData(prev => ({
                            ...prev,
                            vibe_words: [...prev.vibe_words, vibeDescription.trim()]
                          }));
                          setVibeDescription('');
                        }
                      }
                    }}
                    placeholder="Type a word and press Enter"
                    disabled={profileData.vibe_words.length >= 5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {vibeDescription && profileData.vibe_words.length < 5 && (
                    <button
                      onClick={() => {
                        if (vibeDescription.trim() && !profileData.vibe_words.includes(vibeDescription.trim())) {
                          setProfileData(prev => ({
                            ...prev,
                            vibe_words: [...prev.vibe_words, vibeDescription.trim()]
                          }));
                          setVibeDescription('');
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {profileData.vibe_words.length >= 5 && (
                  <p className="text-xs text-amber-400 mt-1">Maximum of 5 vibe words reached</p>
                )}
              </div>
              
              {/* Vibe categories */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-white/70">Popular vibes</h4>
                  <button 
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {showSuggestions ? 'Hide suggestions' : 'Show suggestions'}
                  </button>
                </div>
                
                {showSuggestions && (
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-xs text-white/50 mb-2">STYLES</h5>
                      <div className="flex flex-wrap gap-2">
                        {['Minimalist', 'Vintage', 'Futuristic', 'Grunge', 'Ethereal', 'Bold', 'Dark', 'Pastel']
                          .filter(word => !profileData.vibe_words.includes(word))
                          .map((word, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                if (profileData.vibe_words.length < 5) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    vibe_words: [...prev.vibe_words, word]
                                  }));
                                }
                              }}
                              disabled={profileData.vibe_words.length >= 5}
                              className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {word}
                            </button>
                          ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-xs text-white/50 mb-2 mt-4">ENERGY</h5>
                      <div className="flex flex-wrap gap-2">
                        {['Energetic', 'Chill', 'Intense', 'Playful', 'Dramatic', 'Calm', 'Dynamic', 'Moody']
                          .filter(word => !profileData.vibe_words.includes(word))
                          .map((word, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                if (profileData.vibe_words.length < 5) {
                                  setProfileData(prev => ({
                                    ...prev,
                                    vibe_words: [...prev.vibe_words, word]
                                  }));
                                }
                              }}
                              disabled={profileData.vibe_words.length >= 5}
                              className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {word}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Help text */}
              <p className="text-xs text-white/50 mt-6">
                Choose 3-5 words that best describe your creative style and approach. This helps others get a sense of your aesthetic and working style.
              </p>
            </div>
          </div>
        );
      
      case 5: // Where are you based?
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70 mb-6">{currentStepData.description}</p>
            </div>
            
            <div className="space-y-6">
              {/* Location Input */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="locationInput" className="text-sm font-medium text-white/70">Your location</label>
                  {isDetectingLocation && (
                    <span className="flex items-center text-xs text-purple-400">
                      <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Detecting...
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <input
                    id="locationInput"
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onBlur={() => updateProfileData({ location: locationInput })}
                    placeholder="City, Country"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={detectLocation}
                    disabled={isDetectingLocation}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/70 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Use my current location"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
                
                {locationError && (
                  <p className="text-xs text-amber-400 mt-1">{locationError}</p>
                )}
              </div>
              
              {/* Remote Work Toggle */}
              <div className="pt-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white/90">Open to remote work</span>
                    <span className="text-xs text-white/50">Shows you're available for remote collaborations</span>
                  </div>
                  <div className="relative inline-flex items-center h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                    <input
                      type="checkbox"
                      checked={profileData.is_remote}
                      onChange={() => updateProfileData({ is_remote: !profileData.is_remote })}
                      className="sr-only"
                    />
                    <span 
                      className={`${profileData.is_remote ? 'bg-purple-600' : 'bg-white/20'} inline-block h-6 w-11 rounded-full transition-colors duration-200 ease-in-out`}
                    >
                      <span 
                        className={`${profileData.is_remote ? 'translate-x-6' : 'translate-x-1'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-1`}
                      />
                    </span>
                  </div>
                </label>
              </div>
              
              {/* Help text */}
              <p className="text-xs text-white/50 mt-6">
                Your location helps connect you with local opportunities, while the remote work option shows you're open to collaborations worldwide.
              </p>
            </div>
          </div>
        );
        
      case 6: // Content Preferences
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70 mb-6">Customize your content preferences and viewing experience</p>
            </div>
            
            <div className="space-y-6">
              {/* NSFW Toggle */}
              <div className="p-5 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">Content Settings</h4>
                  
                  <div className="pt-2">
                    <label className="flex items-start justify-between cursor-pointer group">
                      <div className="flex flex-col pr-4">
                        <span className="text-base font-medium text-white/90">Show NSFW content</span>
                        <p className="text-sm text-white/60 mt-1">
                          Enable to view and create 18+ content. NSFW content is hidden by default for all users.
                        </p>
                      </div>
                      <div className="relative inline-flex items-center h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 mt-1">
                        <input
                          type="checkbox"
                          checked={profileData.nsfw_preference}
                          onChange={() => updateProfileData({ nsfw_preference: !profileData.nsfw_preference })}
                          className="sr-only"
                        />
                        <span 
                          className={`${profileData.nsfw_preference ? 'bg-purple-600' : 'bg-white/20'} inline-block h-6 w-11 rounded-full transition-colors duration-200 ease-in-out`}
                        >
                          <span 
                            className={`${profileData.nsfw_preference ? 'translate-x-6' : 'translate-x-1'} pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out mt-1`}
                          />
                        </span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <p className="text-sm text-white/70">
                      These settings help us tailor your experience and ensure you see content that matches your preferences.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terms & Conditions */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="terms" className="text-sm text-white/70">
                  I agree to the{' '}
                  <a href="/terms" className="text-purple-400 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-purple-400 hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
          </div>
        );
        
      case 7: // Success Step
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center mb-6">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Profile Complete!</h3>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Your profile has been successfully created. You're all set to start connecting with other creatives!
            </p>
            <button
              onClick={onComplete}
              className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all transform hover:scale-[1.02] active:scale-95"
            >
              Get Started
            </button>
          </div>
        );
        
      case 6: // Review & Complete
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Review Your Profile</h3>
              <p className="text-white/70 mb-6">Make sure everything looks good before we create your profile</p>
            </div>
            
            {/* Profile Preview Card */}
            <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              {/* Banner */}
              <div className="h-32 bg-gradient-to-r from-purple-600/30 to-pink-600/30"></div>
              
              {/* Profile Header */}
              <div className="px-6 pb-6 -mt-12">
                <div className="flex items-end justify-between">
                  <div className="flex items-end space-x-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-2 border-white/20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center overflow-hidden shadow-lg">
                        {profileData.avatar_url ? (
                          <img 
                            src={profileData.avatar_url} 
                            alt={profileData.full_name || 'Profile'} 
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <User className="w-12 h-12 text-white/60" />
                        )}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-2 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-white mb-1">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        <p className="text-white text-xs">Change Photo</p>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{profileData.full_name || 'Your Name'}</h2>
                      <p className="text-purple-300">@{profileData.username || 'username'}</p>
                      {profileData.tagline && (
                        <p className="text-white/70 mt-1 text-sm">{profileData.tagline}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Location & Remote Status */}
                <div className="mt-4 flex items-center space-x-4">
                  {profileData.location && (
                    <div className="flex items-center text-sm text-white/70">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                  {profileData.is_remote && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                      Remote Available
                    </span>
                  )}
                </div>
                
                
                {/* Roles & Skills */}
                <div className="mt-6 space-y-4">
                  {profileData.roles && profileData.roles.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">ROLES</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.roles.map((role, index) => (
                          <span key={index} className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profileData.skills && profileData.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">SKILLS</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.slice(0, 10).map((skill, index) => (
                          <span key={index} className="px-3 py-1 bg-white/5 text-white/80 rounded-full text-sm border border-white/10">
                            {skill}
                          </span>
                        ))}
                        {profileData.skills.length > 10 && (
                          <span className="px-3 py-1 bg-white/5 text-white/50 rounded-full text-sm">
                            +{profileData.skills.length - 10} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {profileData.looking_for && profileData.looking_for.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">LOOKING FOR</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.looking_for.map((item, index) => (
                          <span key={index} className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profileData.vibe_words && profileData.vibe_words.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-white/70 mb-2">VIBE</h4>
                      <div className="flex flex-wrap gap-2">
                        {profileData.vibe_words.map((word, index) => (
                          <span key={index} className="px-3 py-1 bg-white/5 text-white/80 rounded-full text-sm border border-white/10">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Content Preferences */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h4 className="text-sm font-medium text-white/70 mb-3">CONTENT PREFERENCES</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-white/80">NSFW Content</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      profileData.nsfw_preference 
                        ? 'bg-purple-500/20 text-purple-300' 
                        : 'bg-white/5 text-white/60'
                    }`}>
                      {profileData.nsfw_preference ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Help text */}
            <p className="text-xs text-white/50 text-center">
              Your profile is ready to go! Click "Complete Profile" to save your information and start connecting with other creatives.
            </p>
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 mb-4">
                {currentStepData.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{currentStepData.title}</h3>
              <p className="text-white/70">{currentStepData.description}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
              <p className="text-white/80 text-center text-sm">
                This step is coming soon!
              </p>
            </div>
          </div>
        );
    }
  }

  // ... (rest of the code remains the same)
  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-50 w-full bg-gradient-to-b from-gray-900/90 via-purple-900/80 to-transparent backdrop-blur-sm border-b border-white/5">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/5 text-gray-300 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-white/10 mx-1"></div>
                <div className="text-sm font-medium text-white/90">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-0.5 w-full bg-white/5">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>

          {/* Main content */}
          <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="h-full flex flex-col"
              >
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-white/80 text-sm font-medium">Saving your profile...</p>
                  </div>
                ) : (
                  <div className="space-y-6 sm:space-y-8 flex-1 flex flex-col">
                  
                    
                    <div className="flex-1 overflow-y-auto -mx-2 px-2 sm:mx-0 sm:px-0">
                      {renderStep(currentStep)}
                    </div>

                    {/* Navigation buttons */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      {currentStep > 0 && (
                        <button
                          onClick={handleBack}
                          className="flex-1 sm:flex-none sm:w-auto px-6 py-3.5 rounded-xl font-medium bg-white/5 hover:bg-white/10 text-white/90 transition-colors border border-white/10 hover:border-white/20"
                        >
                          Back
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3.5 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {currentStep === steps.length - 2 ? 'Saving...' : 'Loading...'}
                          </>
                        ) : currentStep === steps.length - 2 ? (
                          'Complete Profile'
                        ) : (
                          'Continue'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}