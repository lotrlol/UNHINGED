import React from 'react'
import { Users, Video, Heart, User, Compass } from 'lucide-react'

interface NavigationProps {
  activeTab: 'collabs' | 'content' | 'discover' | 'matches' | 'profile'
  onTabChange: (tab: 'collabs' | 'content' | 'discover' | 'matches' | 'profile') => void
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'collabs' as const, label: 'Collabs', icon: Users },
    { id: 'content' as const, label: 'Content', icon: Video },
    { id: 'discover' as const, label: 'Discover', icon: Compass },
    { id: 'matches' as const, label: 'Matches', icon: Heart },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ]

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}