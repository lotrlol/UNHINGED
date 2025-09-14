import React, { useState } from 'react'
import { MapPin, Users, DollarSign, Clock, Heart, X } from 'lucide-react'
import { ProjectGlassCard } from './ui/GlassCard'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { ProjectWithProfile } from '../hooks/useProjects'
import { formatDate, getInitials } from '../lib/utils'
import { useProjectApplications } from '../hooks/useProjectApplications'

interface ProjectCardProps {
  project: ProjectWithProfile
  onSkip?: (projectId: string) => void
}

export function ProjectCard({ project, onSkip }: ProjectCardProps) {
  const { applyToProject, loading } = useProjectApplications()
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleApply = async () => {
    setError('')
    setSuccess('')
    const { error } = await applyToProject(project.id)
    if (error) {
      setError(error)
    } else {
      setApplied(true)
      setSuccess('Application sent! 🎉')
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleSkip = () => {
    onSkip?.(project.id)
  }

  return (
    <div className="relative max-w-sm mx-auto overflow-hidden rounded-2xl">
      {/* Blurred background image */}
      {project.cover_url ? (
        <div className="absolute inset-0 -z-10">
          <img
            src={project.cover_url}
            alt=""
            className="w-full h-full object-cover scale-110 blur-lg brightness-50"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-900/80 to-pink-900/80" />
      )}
      
      <ProjectGlassCard className="w-full h-full bg-black/40 backdrop-blur-sm">
        {/* Image / Cover */}
        <div className="relative h-64">
          {project.cover_url ? (
            <img
              src={project.cover_url}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-pink-900/40">
              <div className="text-white text-6xl font-bold opacity-20">
                {project.title.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {/* Dark gradient overlay to blend into info area */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {/* Creator avatar (glass chip) */}
        <div className="absolute -bottom-8 left-6">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border-4 border-black/40 shadow-lg overflow-hidden flex items-center justify-center">
            {project.creator_avatar ? (
              <img
                src={project.creator_avatar}
                alt={project.creator_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white/70">
                {getInitials(project.creator_name)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="p-6 pt-10 space-y-4">
        {/* Creator and roles */}
        <div>
          <h3 className="font-bold text-lg text-white">{project.creator_name}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.creator_roles.slice(0, 2).map((role) => (
              <Badge key={role} className="bg-purple-900/40 text-purple-200 border border-purple-700">
                {role}
              </Badge>
            ))}
            {project.creator_roles.length > 2 && (
              <Badge className="bg-purple-900/40 text-purple-200 border border-purple-700">
                +{project.creator_roles.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Project title & description */}
        <div className="space-y-1">
          <h4 className="font-semibold text-xl text-white">{project.title}</h4>
          <p className="text-gray-300 text-sm line-clamp-3">{project.description}</p>
        </div>

        {/* Roles needed */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-gray-300">Looking for</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.roles_needed.map((role) => (
              <Badge key={role} className="bg-pink-900/40 text-pink-200 border border-pink-700">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} className="bg-blue-900/40 text-blue-200 border border-blue-700">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Vertical details */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span>{project.collab_type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>{project.is_remote ? 'Remote' : project.location || 'Local'}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>

        {/* Status message */}
        {error && (
          <div className="w-full p-2 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-xs text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="w-full p-2 bg-green-900/30 border border-green-700 rounded-lg text-green-200 text-xs text-center">
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSkip}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                       bg-black/40 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
          >
            <X className="w-4 h-4" />
            Not Now
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || applied}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
                       bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 
                       text-white transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
                Applying...
              </>
            ) : applied ? (
              <>✓ Applied!</>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                Let's Collab!
              </>
            )}
          </Button>
        </div>
      </div>
    </ProjectGlassCard>
    </div>
  )
}
