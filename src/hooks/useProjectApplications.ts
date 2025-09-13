import { useState, useCallback } from 'react'
import { supabase } from "../lib/supabase";

import { useAuth } from './useAuth'

export interface ProjectApplication {
  id: string
  project_id: string
  applicant_id: string
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
  decided_at: string | null
}

export function useProjectApplications() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyToProject = useCallback(async (projectId: string) => {
    if (!user) {
      return { data: null, error: 'Must be logged in to apply' }
    }

    try {
      setLoading(true)
      setError(null)

      // Check if user already applied
      const { data: existingApplication } = await supabase
        .from('project_applications')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('applicant_id', user.id)
        .maybeSingle()

      if (existingApplication) {
        return { 
          data: null, 
          error: existingApplication.status === 'pending' 
            ? 'You have already applied to this project' 
            : `You have already ${existingApplication.status} this project`
        }
      }

      // Create application
      const { data: application, error: applicationError } = await supabase
        .from('project_applications')
        .insert({
          project_id: projectId,
          applicant_id: user.id,
          status: 'pending'
        })
        .select()
        .single()

      if (applicationError) throw applicationError

      // Get project details for notification
      const { data: project } = await supabase
        .from('projects')
        .select('title, creator_id')
        .eq('id', projectId)
        .single()

      // Get applicant profile for notification
      const { data: applicantProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single()

      // Create notification for project creator
      if (project && applicantProfile) {
        await supabase
          .from('notifications')
          .insert({
            user_id: project.creator_id,
            type: 'application',
            title: 'New Collaboration Application',
            content: `${applicantProfile.full_name} (@${applicantProfile.username}) wants to collaborate on "${project.title}"`,
            data: {
              project_id: projectId,
              application_id: application.id,
              applicant_id: user.id
            }
          })
      }

      // Check if this creates a match (mutual interest)
      await checkForMatch(projectId, user.id)

      return { data: application, error: null }
    } catch (err) {
      console.error('Error applying to project:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply to project'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const checkForMatch = async (projectId: string, applicantId: string) => {
    try {
      // Get project details
      const { data: projectData } = await supabase
        .from('projects')
        .select('title, creator_id')
        .eq('id', projectId)
        .single()

      if (!projectData) {
        console.error('Project not found for match creation')
        return
      }

      // Get applicant profile
      const { data: applicantProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', applicantId)
        .single()

      if (!applicantProfile) {
        console.error('Applicant profile not found for match creation')
        return
      }

      // For now, create a match when someone applies (simplified matching logic)
      // Later this can be enhanced with mutual interest logic
      
      // Check if match already exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', applicantId)
        .maybeSingle()

      if (existingMatch) {
        console.log('Match already exists')
        return
      }

      // Create chat first
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          project_id: projectId
        })
        .select()
        .single()

      if (chatError) {
        console.error('Error creating chat:', chatError)
        throw chatError
      }

      // Add both users to the chat
      const { error: membersError } = await supabase
        .from('chat_members')
        .insert([
          { chat_id: chat.id, user_id: projectData.creator_id },
          { chat_id: chat.id, user_id: applicantId }
        ])

      if (membersError) {
        console.error('Error adding chat members:', membersError)
        throw membersError
      }

      // Create match with proper creator_id
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          project_id: projectId,
          creator_id: projectData.creator_id,
          user_id: applicantId,
          chat_id: chat.id
        })
        .select()
        .single()

      if (matchError) {
        console.error('Error creating match:', matchError)
        throw matchError
      }

      console.log('Match created successfully:', match)

      // Notify both users
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: projectData.creator_id,
            type: 'match',
            title: 'New Match!',
            content: `${applicantProfile.full_name} wants to collaborate on "${projectData.title}"!`,
            data: {
              project_id: projectId,
              match_id: match.id,
              user_id: applicantId
            }
          },
          {
            user_id: applicantId,
            type: 'match',
            title: 'New Match!',
            content: `You matched with "${projectData.title}"!`,
            data: {
              project_id: projectId,
              match_id: match.id,
              user_id: projectData.creator_id
            }
          }
        ])
    } catch (err) {
      console.error('Error checking for match:', err)
    }
  }

  const getUserApplications = useCallback(async () => {
    if (!user) return { data: [], error: 'Must be logged in' }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          projects (
            title,
            creator_id,
            cover_url
          )
        `)
        .eq('applicant_id', user.id)
        .order('applied_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error fetching applications:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications'
      return { data: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const getProjectApplications = useCallback(async (projectId: string) => {
    if (!user) return { data: [], error: 'Must be logged in' }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('project_applications')
        .select(`
          *,
          profiles (
            full_name,
            username,
            avatar_url,
            roles,
            tagline
          )
        `)
        .eq('project_id', projectId)
        .order('applied_at', { ascending: false })

      if (error) throw error

      return { data: data || [], error: null }
    } catch (err) {
      console.error('Error fetching project applications:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch applications'
      return { data: [], error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateApplicationStatus = useCallback(async (
    applicationId: string, 
    status: 'accepted' | 'rejected'
  ) => {
    if (!user) return { data: null, error: 'Must be logged in' }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('project_applications')
        .update({
          status,
          decided_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select(`
          *,
          projects (title, creator_id),
          profiles (full_name, username)
        `)
        .single()

      if (error) throw error

      // Create notification for applicant
      if (data) {
        await supabase
          .from('notifications')
          .insert({
            user_id: data.applicant_id,
            type: 'application',
            title: `Application ${status === 'accepted' ? 'Accepted' : 'Declined'}`,
            content: `Your application for "${data.projects?.title}" has been ${status}.`,
            data: {
              project_id: data.project_id,
              application_id: applicationId,
              status
            }
          })
      }

      return { data, error: null }
    } catch (err) {
      console.error('Error updating application:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update application'
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    applyToProject,
    getUserApplications,
    getProjectApplications,
    updateApplicationStatus,
    loading,
    error
  }
}