import React, { useState } from 'react'
import { MapPin, Users, DollarSign, Clock, Heart, X } from 'lucide-react'
import { Card, CardContent, CardFooter } from './ui/Card'
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

  const handleApply = () => {
    handleApplyToProject()
  }

  const handleApplyToProject = async () => {
    setError('')
    setSuccess('')
    
    const { data, error } = await applyToProject(project.id)
    
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
    <Card hover className="max-w-sm mx-auto">
      {/* Cover Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-400 to-cyan-400">
        {project.cover_url ? (
          <img
            src={project.cover_url}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white text-6xl font-bold opacity-20">
              {project.title.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
        
        {/* Creator Avatar */}
        <div className="absolute -bottom-6 left-6">
          <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-white">
            {project.creator_avatar ? (
              <img
                src={project.creator_avatar}
                alt={project.creator_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-gray-600">
                {getInitials(project.creator_name)}
              </span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="pt-8">
        {/* Creator Info */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-gray-900">{project.creator_name}</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {project.creator_roles.slice(0, 2).map((role) => (
              <Badge key={role} variant="secondary" size="sm">
                {role}
              </Badge>
            ))}
            {project.creator_roles.length > 2 && (
              <Badge variant="secondary" size="sm">
                +{project.creator_roles.length - 2}
              </Badge>
            )}
          </div>
        </div>

        {/* Project Info */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">{project.title}</h4>
          <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>

          {/* Looking For */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Looking for:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {project.roles_needed.map((role) => (
                <Badge key={role} variant="default" size="sm">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" size="sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Details */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span>{project.collab_type}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{project.is_remote ? 'Remote' : project.location || 'Local'}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatDate(project.created_at)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-3">
        {/* Error/Success Messages */}
        {error && (
          <div className="w-full mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-xs text-center">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="w-full mb-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-xs text-center">{success}</p>
          </div>
        )}
        
        <Button
          variant="outline"
          size="md"
          onClick={handleSkip}
          className="flex-1 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Not Now
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleApply}
          disabled={loading || applied}
          className="flex-1 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
      </CardFooter>
    </Card>
  )
}