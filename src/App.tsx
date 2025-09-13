import * as React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation } from './components/Navigation';
import { CollabsTab } from './components/CollabsTab';
import { ContentTab } from './components/ContentTab';
import { DiscoverTab } from './components/DiscoverTab';
import { MatchesTab } from './components/MatchesTab';
import { ProfileTab } from './components/ProfileTab';
import { AuthModal } from './components/AuthModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { NotificationBell } from './components/NotificationBell';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { useInView } from 'react-intersection-observer';

type Tab = 'collabs' | 'content' | 'discover' | 'matches' | 'profile';

interface TabComponentProps {
  // Add any common props that your tab components might need
}

type TabComponent = React.FC<TabComponentProps>;

// Define the shape of our tab components
const tabComponents = {
  collabs: CollabsTab,
  content: ContentTab,
  discover: DiscoverTab,
  matches: MatchesTab,
  profile: ProfileTab
} as const;

// Create a type from the object keys
type TabComponentsType = typeof tabComponents;

// Create a union type of all tab names
type TabKey = keyof typeof tabComponents;

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const [activeTab, setActiveTab] = useState<Tab>('collabs')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [mounted, setMounted] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user && !profileLoading && !profile && !authLoading) {
      setShowOnboarding(true)
    } else if (profile) {
      setShowOnboarding(false)
    }
  }, [user, profile, profileLoading, authLoading])

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    if (!profile) {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
  }

  const handleAuthModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
  };

  // Loading state with glass effect
  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30 dark:from-gray-900/95 dark:to-gray-800/95">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 max-w-md w-full mx-4 text-center"
        >
          <div className="w-16 h-16 rounded-full border-4 border-primary-200 dark:border-primary-800 border-t-primary-500 dark:border-t-primary-400 animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Loading</h2>
          <p className="text-gray-600 dark:text-gray-300">Getting things ready for you...</p>
        </motion.div>
      </div>
    );
  }

  // Auth state with glass effect
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30 dark:from-gray-900/95 dark:to-gray-800/95 relative overflow-hidden">
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
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-panel p-8 max-w-md w-full relative z-10 transform hover:scale-[1.02] transition-all duration-500"
        >
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
              CollabSpace
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              Connect with creators and find your next collaboration
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAuthModal(true)}
              className="glass-button bg-gradient-to-r from-primary-500 to-secondary-500 text-white w-full py-3 px-6 rounded-xl font-medium hover:shadow-lg hover:shadow-primary-500/20 transition-all duration-300"
            >
              Get Started
              <span className="ml-2">→</span>
            </motion.button>
          </div>
        </motion.div>
        
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

  // Main app layout with glass effect
  const ActiveTab = tabComponents[activeTab as TabKey];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-secondary-50/30 dark:from-gray-900/95 dark:to-gray-800/95 relative overflow-x-hidden">
      {/* Background blobs */}
      <motion.div 
        className="blob blob-1"
        animate={{
          x: [0, 10, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 20,
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
          duration: 25,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 2
        }}
      />
      
      <AnimatePresence mode="wait">
        {showOnboarding ? (
          <OnboardingWizard onComplete={handleOnboardingComplete} />
        ) : (
          <>
            {/* Glass header */}
            <motion.header 
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
              className="glass sticky top-0 z-40 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/30"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    CollabSpace
                  </h1>
                  <div className="flex items-center space-x-4">
                    <NotificationBell />
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAuthModal(true)}
                      className="glass-button flex items-center space-x-2 px-4 py-2 text-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      <span>My Account</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.header>

            <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

            <main 
              ref={ref}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <ActiveTab />
                </motion.div>
              </AnimatePresence>
            </main>
          </>
        )}
      </AnimatePresence>

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
};

export default App;