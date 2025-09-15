import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, User, Users, Camera, Sparkles, Settings, X, Check } from 'lucide-react';

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
import { OnboardingGlassCard } from './ui/GlassCard';
import { useProfile } from '../hooks/useProfile';
import { CREATOR_ROLES, CREATIVE_TAGS } from '../lib/utils';

// Helper function to extract keywords from description
const extractKeywords = (text: string, possibleKeywords: string[]): string[] => {
  if (!text) return [];
  return possibleKeywords.filter(keyword => 
    new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i').test(text.toLowerCase())
  );
};

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ProfileData {
  username: string;
  full_name: string;
  roles: string[];
  skills: string[];
  looking_for: string[];
  tagline: string;
  vibe_words: string[];
  location: string;
  is_remote: boolean;
  nsfw_preference: boolean;
}

export function OnboardingWizard({ isOpen, onClose, onComplete }: OnboardingWizardProps) {
  const { createProfile } = useProfile();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [customRole, setCustomRole] = useState('');
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomSkillInput, setShowCustomSkillInput] = useState(false);
  const [customLookingFor, setCustomLookingFor] = useState('');
  const [showCustomLookingForInput, setShowCustomLookingForInput] = useState(false);
  const [vibeDescription, setVibeDescription] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const prevStepRef = useRef<number>(-1);
  
  // Location state
  const [locationInput, setLocationInput] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<PermissionState>('prompt');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

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
  });
  
  // Initialize location input with profile data
  useEffect(() => {
    if (profileData.location) {
      setLocationInput(profileData.location);
    }
  }, [profileData.location]);
  
  // Initialize vibe description with profile tagline
  useEffect(() => {
    if (profileData.tagline) {
      setVibeDescription(profileData.tagline);
    }
  }, [profileData.tagline]);
  
  // Handle permission response from user
  const handlePermissionResponse = async (granted: boolean) => {
    setShowPermissionPrompt(false);
    setPermissionStatus(granted ? 'granted' : 'denied');
    
    if (granted) {
      await getCurrentLocation();
    } else {
      setLocationError('Location access was denied. Please enter your location manually.');
    }
  };

  // Get current location using geolocation API
  const getCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsDetectingLocation(false);
      return;
    }

    setIsDetectingLocation(true);
    setLocationError('');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject, 
          { 
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 
          }
        );
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
        throw new Error(`Nominatim API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
      const country = data.address?.country || '';
      const locationString = [city, country].filter(Boolean).join(', ') || 'Unknown location';
      
      setLocationInput(locationString);
      setProfileData(prev => ({ 
        ...prev, 
        location: locationString,
        is_remote: false 
      }));
      
    } catch (error) {
      console.error('Error getting location:', error);
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

  // Handle location form submission
  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      setProfileData(prev => ({ 
        ...prev, 
        location: locationInput.trim() 
      }));
      handleNext();
    }
  };

  // Detect location with permission handling
  const detectLocation = async () => {
    if (permissionStatus === 'granted') {
      await getCurrentLocation();
    } else if (permissionStatus === 'denied') {
      setLocationError('Location permission was denied. Please enable it in your browser settings.');
    } else {
      // For 'prompt' status, show our custom permission prompt
      setShowPermissionPrompt(true);
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
      title: 'Basic Info', 
      icon: User,
      description: 'Tell us your name and choose a unique username'
    },
    { 
      title: 'Your Roles', 
      icon: Camera,
      description: 'What kind of creator are you?'
    },
    { 
      title: 'Skills', 
      icon: Sparkles,
      description: 'What are you good at?'
    },
    { 
      title: 'Looking For', 
      icon: Users,
      description: 'What are you looking for in a collaboration?'
    },
    { 
      title: 'Vibe', 
      icon: Sparkles,
      description: 'Describe your creative style'
    },
    { 
      title: 'Location', 
      icon: MapPin,
      description: 'Where are you based?'
    },
    { 
      title: 'Preferences', 
      icon: Settings,
      description: 'Set your preferences'
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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
    console.log('Profile data to be saved:', JSON.stringify(profileData, null, 2));
    
    setIsLoading(true);
    try {
      console.log('Calling createProfile with data:', profileData);
      const { data, error } = await createProfile(profileData);
      
      if (error) {
        console.error('Error from createProfile:', error);
        throw error;
      }
      
      console.log('Profile created successfully:', data);
      onComplete();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Show error to user if needed
      alert('Failed to save profile. Please check the console for more details.');
    } finally {
      console.log('Profile submission completed');
      setIsLoading(false);
    }
  };

  const renderStep = (step: number) => {
    const inputClasses = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all text-white placeholder-gray-400';
    const buttonClasses = 'px-6 py-3 rounded-xl font-medium transition-all';
    const primaryButtonClasses = `${buttonClasses} bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white`;
    const secondaryButtonClasses = `${buttonClasses} bg-white/5 hover:bg-white/10 text-white`;

    switch (step) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => updateProfileData({ full_name: e.target.value })}
                  className={inputClasses}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => updateProfileData({ username: e.target.value })}
                  className={inputClasses}
                  placeholder="yourusername"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className={primaryButtonClasses}
                disabled={!profileData.full_name || !profileData.username}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 1: // Roles
        const handleAddCustomRole = () => {
          if (customRole.trim() && !profileData.roles.includes(customRole.trim())) {
            updateProfileData({ 
              roles: [...profileData.roles, customRole.trim()] 
            });
            setCustomRole('');
            setShowCustomRoleInput(false);
          }
        };

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {CREATOR_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => updateProfileData({ 
                    roles: toggleArrayItem(profileData.roles, role) 
                  })}
                  className={`p-2 rounded-lg text-sm transition-all flex items-center justify-center ${
                    profileData.roles.includes(role)
                      ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white border border-purple-400/50 shadow-md shadow-purple-900/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {profileData.roles.includes(role) && (
                    <Check className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{role}</span>
                </button>
              ))}
              
              {!showCustomRoleInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomRoleInput(true)}
                  className="p-2 rounded-lg text-sm transition-all flex items-center justify-center bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/30"
                >
                  <span className="truncate">+ Other</span>
                </button>
              ) : (
                <div className="col-span-3 flex gap-2 mt-2">
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter custom role"
                    className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomRole()}
                    autoFocus
                  />
                  <button
                    onClick={handleAddCustomRole}
                    disabled={!customRole.trim()}
                    className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Selected roles chips */}
            {profileData.roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profileData.roles.map((role) => (
                  <div key={role} className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm">
                    <span className="mr-2">{role}</span>
                    <button
                      onClick={() => updateProfileData({ 
                        roles: profileData.roles.filter(r => r !== role) 
                      })}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-white/10">
              <button
                onClick={handleBack}
                className={`${secondaryButtonClasses} text-sm px-4 py-2`}
              >
                Back
              </button>
              <div className="text-xs text-gray-400 flex items-center">
                {profileData.roles.length} {profileData.roles.length === 1 ? 'role' : 'roles'} selected
              </div>
              <button
                onClick={handleNext}
                className={`${primaryButtonClasses} text-sm px-5 py-2`}
                disabled={profileData.roles.length === 0}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 2: // Skills
        const handleAddCustomSkill = () => {
          const skill = customSkill.trim();
          if (skill && !profileData.skills.includes(skill)) {
            updateProfileData({ 
              skills: [...profileData.skills, skill]
            });
            setCustomSkill('');
            setShowCustomSkillInput(false);
          }
        };

        // Get relevant skills based on selected roles
        const relevantSkills = getSkillsForRoles(profileData.roles);
        const noRolesSelected = profileData.roles.length === 0;

        return (
          <div className="space-y-4">
            {noRolesSelected ? (
              <div className="text-center py-4 text-yellow-400">
                Please select at least one role in the previous step
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {relevantSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => updateProfileData({ 
                    skills: toggleArrayItem(profileData.skills, skill) 
                  })}
                  className={`p-2 rounded-lg text-sm transition-all flex items-center justify-center ${
                    profileData.skills.includes(skill)
                      ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white border border-purple-400/50 shadow-md shadow-purple-900/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {profileData.skills.includes(skill) && (
                    <Check className="w-4 h-4 mr-1.5 flex-shrink-0" />
                  )}
                  <span className="truncate">{skill}</span>
                </button>
                ))}
                
                {!showCustomSkillInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomSkillInput(true)}
                    className="p-2 rounded-lg text-sm transition-all flex items-center justify-center bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/30"
                    disabled={noRolesSelected}
                  >
                    <span className="truncate">+ Add Skill</span>
                  </button>
                ) : (
                  <div className="col-span-3 flex gap-2 mt-2">
                    <input
                      type="text"
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder="Enter a skill"
                      className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                      autoFocus
                    />
                    <button
                      onClick={handleAddCustomSkill}
                      disabled={!customSkill.trim()}
                      className="px-3 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Selected skills chips */}
            {profileData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profileData.skills.map((skill) => (
                  <div key={skill} className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm">
                    <span className="mr-2">{skill}</span>
                    <button
                      onClick={() => updateProfileData({ 
                        skills: profileData.skills.filter(s => s !== skill) 
                      })}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-white/10">
              <button
                onClick={handleBack}
                className={`${secondaryButtonClasses} text-sm px-4 py-2`}
              >
                Back
              </button>
              <div className="text-xs text-gray-400 flex items-center">
                {profileData.skills.length} {profileData.skills.length === 1 ? 'skill' : 'skills'} selected
                {!noRolesSelected && (
                  <span className="ml-2 text-gray-500">
                    (Based on: {profileData.roles.join(', ')})
                  </span>
                )}
              </div>
              <button
                onClick={handleNext}
                className={`${primaryButtonClasses} text-sm px-5 py-2`}
                disabled={profileData.skills.length === 0 || noRolesSelected}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 3: // Looking For
        const COLLAB_OPTIONS = [
          'Paid Work',
          'Unpaid Collaborations',
          'Revenue Share',
          'Portfolio Building',
          'Networking',
          'Mentorship',
          'Skill Exchange',
          'Creative Partnerships',
          'Exposure',
          'Fun Projects',
          'Commercial Work',
          'Passion Projects',
          'Event Coverage',
          'Content Creation',
          'Brand Partnerships',
          'Teaching Opportunities',
          'Learning Opportunities'
        ];

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {COLLAB_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateProfileData({ 
                    looking_for: toggleArrayItem(profileData.looking_for, option) 
                  })}
                  className={`py-2.5 px-3 rounded-lg text-sm transition-all flex items-center justify-center ${
                    profileData.looking_for.includes(option)
                      ? 'bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-white border border-purple-400/50 shadow-md shadow-purple-900/30'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {profileData.looking_for.includes(option) && (
                    <Check className="w-4 h-4 mr-2 flex-shrink-0" />
                  )}
                  <span className="truncate">{option}</span>
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => setShowCustomLookingForInput(!showCustomLookingForInput)}
                className="p-2 rounded-lg text-sm transition-all flex items-center justify-center bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/30"
              >
                <span className="truncate">+ Add Other Interest</span>
              </button>
              
              {showCustomLookingForInput && (
                <div className="col-span-3 flex gap-2">
                  <input
                    type="text"
                    value={customLookingFor}
                    onChange={(e) => setCustomLookingFor(e.target.value)}
                    placeholder="Enter a collaboration type"
                    className="flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomLookingFor()}
                    autoFocus
                  />
                  <button
                    onClick={handleAddCustomLookingFor}
                    disabled={!customLookingFor.trim()}
                    className="px-4 py-2 bg-purple-600/80 hover:bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Add Option
                  </button>
                </div>
              )}
            </div>

            {/* Selected options */}
            {profileData.looking_for.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">You're looking for:</h4>
                <div className="flex flex-wrap gap-2">
                  {profileData.looking_for.map((item) => (
                    <div key={item} className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1 text-sm">
                      <span className="mr-2">{item}</span>
                      <button
                        onClick={() => updateProfileData({ 
                          looking_for: profileData.looking_for.filter(i => i !== item) 
                        })}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-white/10 mt-6">
              <button
                onClick={handleBack}
                className={`${secondaryButtonClasses} text-sm px-4 py-2`}
              >
                Back
              </button>
              <div className="text-xs text-gray-400 flex items-center">
                {profileData.looking_for.length} {profileData.looking_for.length === 1 ? 'option' : 'options'} selected
              </div>
              <button
                onClick={handleNext}
                className={`${primaryButtonClasses} text-sm px-5 py-2`}
                disabled={profileData.looking_for.length === 0}
              >
                Next
              </button>
            </div>
          </div>
        );

      case 4: // Vibe
        const handleVibeSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          if (vibeDescription.trim()) {
            updateProfileData({ 
              tagline: vibeDescription,
              vibe_words: extractKeywords(vibeDescription, CREATIVE_TAGS)
            });
          }
        };

        const handleSuggestionClick = (suggestion: string) => {
          setVibeDescription(prev => 
            prev ? `${prev}, ${suggestion}` : suggestion
          );
        };

        return (
          <div className="space-y-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">What's your creative vibe?</h3>
                <p className="text-gray-400 text-sm mb-6">
                  In your own words, describe your creative energy, style, or approach. 
                  What makes your work unique? This will help others connect with your creative essence.
                </p>
                
                <form onSubmit={handleVibeSubmit} className="mb-6">
                  <div className="relative">
                    <textarea
                      value={vibeDescription}
                      onChange={(e) => setVibeDescription(e.target.value)}
                      placeholder="E.g., 'Dreamy, ethereal portraits with a touch of nostalgia' or 'Bold, high-energy street photography'"
                      className="w-full h-32 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                      {vibeDescription.length}/120
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      {showSuggestions ? 'Hide suggestions' : 'Need inspiration?'}
                      <Sparkles size={14} className={showSuggestions ? 'text-yellow-400' : ''} />
                    </button>
                    <button
                      type="submit"
                      disabled={!vibeDescription.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Save Vibe
                    </button>
                  </div>
                </form>

                {showSuggestions && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-300">Common vibe words</h4>
                      <span className="text-xs text-gray-500">Click to add</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CREATIVE_TAGS.slice(0, 12).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleSuggestionClick(tag)}
                          className="px-3 py-1.5 text-sm rounded-full bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 hover:border-white/20 transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t border-white/10">
                <button
                  onClick={handleBack}
                  className={`${secondaryButtonClasses} text-sm px-4 py-2`}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className={`${primaryButtonClasses} text-sm px-5 py-2`}
                  disabled={!profileData.tagline}
                >
                  {profileData.tagline ? 'Next' : 'Skip for now'}
                </button>
              </div>
            </div>
          </div>
        );

      case 5: // Location
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white mb-2">Where are you based?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Let others know where you're located. This helps with local collaborations and networking.
              </p>
              
              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      placeholder="Enter your city and country"
                      className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={isDetectingLocation}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={permissionStatus === 'denied' ? 'Location permission denied' : 'Use my current location'}
                    >
                      {isDetectingLocation ? (
                        <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <MapPin className={`w-5 h-5 ${permissionStatus === 'denied' ? 'text-red-400' : 'text-purple-400'}`} />
                      )}
                    </button>
                  </div>
                  
                  {locationError && (
                    <p className="mt-2 text-sm text-red-400">{locationError}</p>
                  )}
                  
                  {showPermissionPrompt && (
                    <div className="mt-3 p-3 bg-blue-900/30 border border-blue-800/50 rounded-lg text-sm">
                      <p className="text-blue-200 mb-2">Allow access to your location to automatically detect your city.</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handlePermissionResponse(true)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                        >
                          Allow
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermissionResponse(false)}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-sm"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center">
                    <input
                      type="checkbox"
                      id="remoteWork"
                      checked={profileData.is_remote}
                      onChange={(e) => updateProfileData({ is_remote: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                    />
                    <label htmlFor="remoteWork" className="ml-2 text-sm text-gray-300">
                      I'm open to remote work
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors ${!locationInput.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!locationInput.trim()}
                  >
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 6: // Preferences
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-medium text-white mb-2">Your Preferences</h3>
              <p className="text-gray-400 text-sm mb-6">
                Customize your experience and privacy settings.
              </p>
              
              <div className="space-y-6">
                {/* NSFW Preference */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="flex items-center h-5">
                        <input
                          id="nsfw-preference"
                          name="nsfw-preference"
                          type="checkbox"
                          checked={profileData.nsfw_preference}
                          onChange={(e) => updateProfileData({ nsfw_preference: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="nsfw-preference" className="font-medium text-white">
                        Show NSFW content
                      </label>
                      <p className="text-gray-400 mt-1">
                        Enable this to view content that may not be suitable for all audiences.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Remote Work Preference */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="flex items-center h-5">
                        <input
                          id="remote-preference"
                          name="remote-preference"
                          type="checkbox"
                          checked={profileData.is_remote}
                          onChange={(e) => updateProfileData({ is_remote: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="remote-preference" className="font-medium text-white">
                        Open to remote work
                      </label>
                      <p className="text-gray-400 mt-1">
                        Let others know you're available for remote collaborations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6">
                <button
                  onClick={handleBack}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-colors"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-medium text-white mb-2">Step not found</h3>
              <p className="text-gray-400 text-sm mb-6">This step doesn't exist or is under development.</p>
            </div>
            <div className="flex justify-between pt-4">
              <button
                onClick={handleBack}
                className={secondaryButtonClasses}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className={primaryButtonClasses}
              >
                Next
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            // Close the wizard when clicking outside the content
            if (e.target === e.currentTarget) {
              console.log('Overlay clicked');
              onClose();
            }
          }}
        >
          <div 
            className="w-full max-w-2xl mx-4 relative"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking inside the card
          >
            <OnboardingGlassCard className="w-full overflow-hidden max-h-[90vh] flex flex-col">
              <div className="relative p-6 pb-4 flex-1 overflow-y-auto">
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log('Close button clicked');
                    onClose();
                  }}
                  className="absolute top-4 right-4 z-50 p-1.5 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="py-2 h-full flex flex-col"
                  >
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-200/80">Saving your profile...</p>
                      </div>
                    ) : (
                      <div className="space-y-6 flex-1 flex flex-col">
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                            {steps[currentStep].title}
                          </h2>
                          <p className="text-purple-200/70 text-sm">{steps[currentStep].description}</p>
                          <div className="text-purple-200/70 text-xs mt-2">
                            Step {currentStep + 1} of {steps.length}
                          </div>
                        </div>
                        <div className="flex-1">
                          {renderStep(currentStep)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </OnboardingGlassCard>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// All helper functions are now included above
