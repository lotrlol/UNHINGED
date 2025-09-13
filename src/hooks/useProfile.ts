import { useEffect, useState } from 'react'
import { supabase, Tables, Inserts } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (error) {
          console.error('Error fetching profile:', error)
          setError(error.message)
        } else {
          if (data) {
            console.log('Profile loaded:', data)
          } else {
            console.log('No profile found for user:', user.id)
          }
          setProfile(data)
        }
      } catch (err) {
        console.error('Unexpected error fetching profile:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const updateProfile = async (updates: Partial<Omit<Tables<'profiles'>, 'id' | 'created_at'>>) => {
    if (!user) return { data: null, error: new Error('No user') }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        console.log('Profile updated:', data)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  const createProfile = async (profileData: Omit<Inserts<'profiles'>, 'id'>) => {
    if (!user) return { data: null, error: new Error('No user') }

    try {
      console.log('Creating profile with data:', { ...profileData, id: user.id })
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          ...profileData,
          id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error('Profile creation error:', error)
        throw error
      }

      if (data) {
        setProfile(data)
        console.log('Profile created:', data)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error creating profile:', error)
      return { data: null, error: error as Error }
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
  }
}