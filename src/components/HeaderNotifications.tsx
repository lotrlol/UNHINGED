import React, { useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useFriendRequests } from '../hooks/useFriendRequests'
import { FriendRequestsModal } from './FriendRequestsModal'
import { supabase } from '../lib/supabase'

export function HeaderNotifications() {
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const { receivedRequests } = useFriendRequests()
  const pendingCount = receivedRequests.filter(req => req.status === 'pending').length

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
        {/* Friend Requests Bell */}
        <motion.button
          onClick={() => setShowFriendRequests(true)}
          className="relative p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 transition-all shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-gray-900"
            >
              <span className="text-white text-xs font-bold">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            </motion.div>
          )}
        </motion.button>

        {/* Discrete Logout Button */}
        <motion.button
          onClick={handleLogout}
          className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-gray-300 hover:text-red-300 hover:bg-red-900/20 transition-all shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Friend Requests Modal */}
      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
    </>
  )
}