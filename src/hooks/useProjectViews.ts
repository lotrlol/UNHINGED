import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProjectViews() {
  const { user } = useAuth()

  const recordView = useCallback(async (projectId: string) => {
    try {
      // Record the view (anonymous or authenticated)
      await supabase
        .from('project_views')
        .insert({
          project_id: projectId,
          user_id: user?.id || null
        })
    } catch (error) {
      // Silently ignore view tracking errors
      console.log('View tracking error (ignored):', error)
    }
  }, [user])

  const getProjectViews = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_views')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error fetching project views:', err)
      return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch views' }
    }
  }, [])

  return {
    recordView,
    getProjectViews
  }
}