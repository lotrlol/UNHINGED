import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LandingGlassCard } from './components/ui/GlassCard';
import { Navigation } from './components/Navigation';
import { CollabsTab } from './components/CollabsTab';
import ContentTab from './components/ContentTab';
import { DiscoverTab } from './components/DiscoverTab';
import { MatchesTab } from './components/MatchesTab';
import { ProfileTab } from './components/ProfileTab';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { HeaderNotifications } from './components/HeaderNotifications';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useProjects } from './hooks/useProjects';
import { supabase } from './lib/supabase';

type Tab = 'collabs' | 'content' | 'discover' | 'matches' | 'profile';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('collabs')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userClosedOnboarding, setUserClosedOnboarding] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile();
  const { projects, refetch: refetchProjects } = useProjects();

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Only auto-show onboarding if user hasn't explicitly closed it
    if (!userClosedOnboarding) {
      if (user && !profileLoading && !authLoading) {
        if (!profile) {
          setShowOnboarding(true)
        } else if (!profile.onboarding_completed) {
          setShowOnboarding(true)
        } else {
          setShowOnboarding(false)
        }
      }
    }
  }, [user, profile, profileLoading, authLoading, userClosedOnboarding])

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    if (!profile && !userClosedOnboarding) {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Any additional logic for when onboarding is completed successfully
  };

  const handleOnboardingClose = () => {
    console.log('handleOnboardingClose called');
    setShowOnboarding(false);
    setUserClosedOnboarding(true); // Prevent auto-reopening
  };

  const handleAuthModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  // Loading state with glass effect
  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 pb-20">
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8 max-w-md w-full mx-4 text-center"
          >
            <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-800 border-t-primary-500 dark:border-t-primary-400 animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Loading</h2>
            <p className="text-gray-600 dark:text-gray-300">Getting things ready for you...</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Auth state with glass effect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-900 to-purple-900/30 relative overflow-hidden">
        {/* Animated background blobs */}
        <motion.div 
          className="blob blob-1"
          animate={{
            x: [0, 10, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
        <motion.div 
          className="blob blob-2"
          animate={{
            x: [0, -15, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 2
          }}
        />
        <motion.div 
          className="blob blob-3"
          animate={{
            x: [0, 10, -5, 0],
            y: [0, -5, 10, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: 1
          }}
        />
        
        <LandingGlassCard
          title="UNHINGED"
          description="Connect with creators and find your next collaboration"
          ctaText="Get Started"
          onCtaClick={() => setShowAuthModal(true)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mt-6">
            <p className="text-sm text-purple-200/80">Join our community of creators and collaborators</p>
          </div>
        </LandingGlassCard>
        
        <AnimatePresence>
          {showAuthModal && (
            <AuthModal
              isOpen={showAuthModal}
              onClose={() => setShowAuthModal(false)}
              mode={authMode}
              onModeChange={handleAuthModeChange}
              onSuccess={handleAuthSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Temporary logout function
  const tempLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Main app layout with glass effect
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header Notifications */}
      <HeaderNotifications />
      
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
        {/* Background blobs */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
          <div className="absolute top-1/3 -right-4 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Main content area with padding to account for fixed navigation */}
        <main className="flex-1 container mx-auto px-4 py-6 pb-32 sm:pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full"
            >
              {activeTab === 'collabs' && (
                projects.length > 0 ? (
                  <CollabsTab 
                    project={projects[0]} 
                    onSkip={() => {}} 
                    onProjectCreated={refetchProjects}
                  />
                ) : (
                  <CollabsTab 
                    project={null as any} 
                    onSkip={() => {}} 
                    onProjectCreated={refetchProjects}
                  />
                )
              )}
              {activeTab === 'content' && <ContentTab />}
              {activeTab === 'discover' && <DiscoverTab />}
              {activeTab === 'matches' && <MatchesTab />}
              {activeTab === 'profile' && <ProfileTab />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Fixed bottom navigation */}
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={handleAuthModeChange}
        onSuccess={handleAuthSuccess}
      />
      
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingWizard 
            isOpen={showOnboarding} 
            onClose={handleOnboardingClose}
            onComplete={handleOnboardingComplete}
          />
        )}
      </AnimatePresence>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

export default App;