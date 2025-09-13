import React, { useState } from 'react'
import { X, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { useAuth } from '../hooks/useAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'signin' | 'signup'
  onModeChange: (mode: 'signin' | 'signup') => void
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { signIn, signUp } = useAuth()

  if (!isOpen) return null

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

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setSuccess('')
  }

  const handleModeChange = (newMode: 'signin' | 'signup') => {
    resetForm()
    onModeChange(newMode)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signup' ? 'Join Unhinged' : 'Welcome Back'}
          </h2>
          <button
            onClick={() => {
              resetForm()
              onClose()
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="••••••••"
                required
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {mode === 'signup' ? 'Creating Account...' : 'Signing In...'}
              </div>
            ) : (
              mode === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => handleModeChange(mode === 'signup' ? 'signin' : 'signup')}
              className="ml-2 text-purple-600 hover:text-purple-700 font-medium"
              disabled={loading}
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}