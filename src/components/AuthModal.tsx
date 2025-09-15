import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, CheckCircle, AlertCircle, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { AuthGlassCard } from './ui/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, mode, onModeChange, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { signIn, signUp } = useAuth()

  // Close on escape key
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password)
        if (error) {
          throw error
        }
        
        if (data.user && !data.session) {
          // Email confirmation required
          setSuccess('Please check your email and click the confirmation link to complete your registration!')
          setEmail('')
          setPassword('')
        } else if (data.session) {
          // User is signed in immediately (email confirmation disabled)
          setSuccess('Account created successfully!')
          setTimeout(() => {
            onClose()
            if (onSuccess) onSuccess()
          }, 1500)
        }
      } else {
        const { data, error } = await signIn(email, password)
        if (error) {
          throw error
        }
        
        if (data.session) {
          setSuccess('Welcome back!')
          setTimeout(() => {
            onClose()
            if (onSuccess) onSuccess()
          }, 1000)
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      
      // Provide user-friendly error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.')
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.')
      } else if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Form reset is handled by individual state setters when needed

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <AuthGlassCard 
              title={mode === 'signin' ? 'Welcome back' : 'Create an account'}
              onClose={onClose}
              className="relative overflow-visible"
            >
              {/* Auth Mode Tabs */}
              <div className="flex border-b border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => onModeChange('signin')}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${mode === 'signin' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => onModeChange('signup')}
                  className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </button>
              </div>
              
              <p className="text-gray-300 text-sm text-center mb-6">
                {mode === 'signin' 
                  ? 'Sign in to access your account and continue creating' 
                  : 'Join our community of creators and start collaborating today'}
              </p>
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                        placeholder="Email address"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
                        placeholder={mode === 'signin' ? 'Password' : 'Create a password'}
                        minLength={mode === 'signup' ? 6 : undefined}
                        required
                        disabled={loading}
                      />
                    </div>
                    {mode === 'signin' && (
                      <div className="mt-1.5 flex justify-end">
                        <button
                          type="button"
                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          onClick={() => {}}
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all',
                      mode === 'signin' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600' 
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
                      'text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                      'disabled:opacity-70 disabled:cursor-not-allowed',
                      loading && 'opacity-80'
                    )}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      <>
                        {loading ? (
                          <span>Please wait...</span>
                        ) : (
                          <>
                            <span>{mode === 'signin' ? 'Sign in' : 'Create account'}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>

              <div className="mt-6 pt-5 border-t border-white/10">
                <p className="text-center text-sm text-gray-400">
                  {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    disabled={loading}
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </AuthGlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}