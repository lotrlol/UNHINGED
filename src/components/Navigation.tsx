import React from 'react';
import { Users, Video, MessageCircle, User, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavigationGlassCard } from './ui/GlassCard';

interface NavigationProps {
  activeTab: 'collabs' | 'content' | 'discover' | 'matches' | 'profile';
  onTabChange: (tab: 'collabs' | 'content' | 'discover' | 'matches' | 'profile') => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'collabs' as const, label: 'Collabs', icon: Users },
    { id: 'content' as const, label: 'Content', icon: Video },
    { id: 'discover' as const, label: 'Discover', icon: Compass },
    { id: 'matches' as const, label: 'Messages', icon: MessageCircle },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-2 sm:px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <NavigationGlassCard className="w-full px-1 sm:px-3 py-1 sm:py-2">
          {/* Main tabs */}
          <div className="flex items-center justify-around gap-0 sm:gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex flex-col items-center justify-center px-2 sm:px-3 py-1 sm:py-2 rounded-xl transition-all duration-300
                    ${isActive ? 'text-white' : 'text-gray-300 hover:text-white'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600/40 to-pink-600/40 rounded-xl backdrop-blur-md"
                      layoutId="activeTab"
                      transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    />
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-gray-300'}`} />
                    <span className="text-[10px] sm:text-xs mt-0.5 sm:mt-1 font-medium">{tab.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </NavigationGlassCard>
      </motion.div>
    </nav>
  );
}
