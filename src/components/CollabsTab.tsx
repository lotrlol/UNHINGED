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
      project: ProjectWithProfile;
      onSkip?: (projectId: string) => void;
  onProjectCreated?: () => void;
    }

    export function CollabsTab({ project, onSkip }: CollabsTabProps) {
      const [showCreateModal, setShowCreateModal] = useState(false);
      
      // Floating action button for creating new collaborations
      const CreateFab = () => (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center z-50"
          aria-label="Create new collaboration"
        >
          <Plus className="h-8 w-8" />
        </button>
      );
      
      if (!project) {
        return (
          <>
            <GlassCard className="p-8 text-center text-gray-400">
              <div className="flex flex-col items-center space-y-6">
                <p className="text-lg">No project data available</p>
                <p className="text-sm text-gray-500">Click the + button below to create a new collaboration</p>
              </div>
            </GlassCard>
            <CreateProjectModal 
              isOpen={showCreateModal} 
              onClose={() => setShowCreateModal(false)}
              onProjectCreated={() => {
                setShowCreateModal(false);
                // You might want to add a refresh callback here
              }}
            />
            <CreateFab />
          </>
        );
      }
      const { applyToProject, loading } = useProjectApplications();
      const [applied, setApplied] = useState(false);
      const [error, setError] = useState('');
      const [success, setSuccess] = useState('');

      const handleApply = async () => {
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
        onSkip?.(project.id);
      };

      return (
        <div className="relative min-h-screen">
          <CreateFab />
          <GlassCard
            className="relative w-full max-w-2xl mx-auto overflow-hidden rounded-3xl backdrop-blur-xl
            bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/10
            shadow-xl shadow-black/50 hover:shadow-purple-700/40 hover:scale-[1.02] transition-all"
          >
          {/* Cover image and overlay */}
          <div className="relative h-80">
            {project.cover_url ? (
              <img
                src={project.cover_url}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600/40 to-cyan-600/40">
                <div className="text-7xl font-extrabold text-white/20">
                  {project.title.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            {/* Gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent" />
            {/* Creator avatar */}
            <div className="absolute -bottom-10 left-6">
              <div
                className="w-24 h-24 rounded-full border border-white/20 shadow-lg overflow-hidden
                bg-black/40 backdrop-blur-md flex items-center justify-center"
              >
                {project.creator_avatar ? (
                  <img
                    src={project.creator_avatar}
                    alt={project.creator_name || 'Creator'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white/70">
                    {project.creator_name ? getInitials(project.creator_name) : '?'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content section */}
          <div className="px-8 pb-8 pt-14 space-y-6">
            {/* Creator name and roles */}
            <div>
              <h3 className="text-white text-3xl font-bold">
                {project.creator_name}
              </h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {project.creator_roles?.slice(0, 3).map((role: string) => (
                  <Badge
                    key={role}
                    className="bg-purple-800/40 text-purple-200 border border-purple-600/50 backdrop-blur-sm"
                  >
                    {role}
                  </Badge>
                ))}
                {project.creator_roles && project.creator_roles.length > 3 && (
                  <Badge
                    className="bg-purple-800/40 text-purple-200 border border-purple-600/50 backdrop-blur-sm"
                  >
                    +{project.creator_roles.length - 3}
                  </Badge>
                )}
              </div>
            </div>

            {/* Project title and description */}
            <div>
              <h4 className="text-white text-2xl font-semibold leading-tight">
                {project.title}
              </h4>
              <p className="mt-2 text-gray-300 text-sm leading-relaxed line-clamp-3">
                {project.description}
              </p>
            </div>

            {/* Roles needed */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-medium text-gray-300">
                  Looking for
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.roles_needed?.slice(0, 3).map((role: string) => (
                  <Badge
                    key={role}
                    className="bg-pink-900/40 text-pink-200 border border-pink-700/50 backdrop-blur-sm"
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            {project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {project.tags.slice(0, 5).map((tag: string) => (
                  <Badge
                    key={tag}
                    className="bg-blue-900/40 text-blue-200 border border-blue-700/50 backdrop-blur-sm"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Collaboration details */}
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span>{project.collab_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>
                  {project.is_remote
                    ? 'Remote'
                    : project.location || 'Local'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="w-3 h-3" />
                <span>{formatDate(project.created_at)}</span>
              </div>
            </div>

            {/* Feedback messages */}
            {error && (
              <div
                className="w-full p-2 text-center text-xs bg-red-900/40
              border border-red-700/40 rounded-md text-red-200"
              >
                {error}
              </div>
            )}
            {success && (
              <div
                className="w-full p-2 text-center text-xs bg-green-900/40
              border border-green-700/40 rounded-md text-green-200"
              >
                {success}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                onClick={handleSkip}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                bg-black/40 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white
                transition-colors backdrop-blur-sm"
              >
                <X className="w-4 h-4" />
                Not Now
              </Button>

              <Button
export function CollabsTab({ project, onSkip, onProjectCreated }: CollabsTabProps) {
                disabled={loading || applied}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700
                disabled:opacity-50 disabled:pointer-events-none text-white font-medium transition-all"
              >
                {loading ? (
      className="fixed bottom-24 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-lg border border-white/10 text-white shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 flex items-center justify-center z-50"
                    <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                    Applying...
                  </>
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 blur-xl animate-ping" />
                ) : applied ? (
                  <>✓ Applied!</>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    Let’s&nbsp;Collab!
                  </>
                )}
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
            onProjectCreated?.();
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }
