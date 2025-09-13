import React, { useState, useEffect } from 'react'
import { Navigation } from './components/Navigation'
import { CollabsTab } from './components/CollabsTab'
import { ContentTab } from './components/ContentTab'
import { DiscoverTab } from './components/DiscoverTab'
import { MatchesTab } from './components/MatchesTab'
import { ProfileTab } from './components/ProfileTab'
import { AuthModal } from './components/AuthModal'
import { OnboardingWizard } from './components/OnboardingWizard'
import { NotificationBell } from './components/NotificationBell'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'

type Tab = 'collabs' | 'content' | 'discover' | 'matches' | 'profile'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('collabs')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to CollabSpace</h1>
          <p className="text-gray-600 mb-8">Connect with creators and find your next collaboration</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Get Started
          </button>
        </div>
        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showOnboarding ? (
        <OnboardingWizard
          onComplete={handleOnboardingComplete}
        />
      ) : (
        <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">CollabSpace</h1>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                Account
              </button>
            </div>
          </div>
        </div>
      </header>

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'collabs' && <CollabsTab />}
        {activeTab === 'content' && <ContentTab />}
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'matches' && <MatchesTab />}
        {activeTab === 'profile' && <ProfileTab />}
      </main>
        </>
      )}

      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}

export default App