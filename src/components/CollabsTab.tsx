import React, { useState } from 'react';
import {
  MapPin,
  Users,
  DollarSign,
  Clock,
  Heart,
  X,
  Plus,
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ProjectWithProfile } from '../hooks/useProjects';
import { formatDate, getInitials } from '../lib/utils';
import { useProjectApplications } from '../hooks/useProjectApplications';
import { CreateProjectModal } from './CreateProjectModal';

interface CollabsTabProps {
  project: ProjectWithProfile | null;
  onSkip?: (projectId: string) => void;
  onProjectCreated?: () => void;
}

export function CollabsTab({ project, onSkip, onProjectCreated }: CollabsTabProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { applyToProject, loading } = useProjectApplications();
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApply = async () => {
    if (!project) return;
    
    setError('');
    setSuccess('');
    const { error } = await applyToProject(project.id);
    if (error) {
      setError(error);
    } else {
      setApplied(true);
      setSuccess('Application sent! 🎉');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleSkip = () => {
    if (project) {
      onSkip?.(project.id);
    }
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    onProjectCreated?.();
  };

  // Floating action button for creating new collaborations
  const CreateFab = () => (
    <div className="fixed bottom-24 right-8 z-50">
      <div className="relative w-16 h-16">
        <button
          onClick={() => setShowCreateModal(true)}
          className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-lg border border-white/10 text-white shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center z-10"
          aria-label="Create new collaboration"
        >
          <Plus className="h-8 w-8" />
        </button>
        <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 blur-xl animate-ping" />
      </div>
    </div>
  );

  if (!project) {
    return (
      <div className="relative p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-white mb-2">No projects to show</h3>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Start your creative journey by posting your first collaboration project!
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-purple-500/20 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </Button>
          </div>
        </GlassCard>
        
        <CreateProjectModal 
          isOpen={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          onProjectCreated={handleProjectCreated}
        />
        <CreateFab />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen p-4 pb-24">
      <CreateFab />
      
      <div className="max-w-sm mx-auto">
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
        
        <GlassCard className="w-full h-full bg-black/40 backdrop-blur-sm overflow-hidden rounded-2xl">
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
                {project.creator_roles?.slice(0, 2).map((role) => (
                  <Badge key={role} className="bg-purple-900/40 text-purple-200 border border-purple-700">
                    {role}
                  </Badge>
                ))}
                {project.creator_roles && project.creator_roles.length > 2 && (
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
                           text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
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
        </GlassCard>
      </div>

      <CreateProjectModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}