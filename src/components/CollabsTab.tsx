import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Users,
  DollarSign,
  Clock,
  Heart,
  X,
  Plus,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  Eye,
  Filter,
  Search,
  Calendar,
  Star,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ProjectWithProfile, useProjects } from '../hooks/useProjects';
import { formatDate, getInitials } from '../lib/utils';
import { useProjectApplications } from '../hooks/useProjectApplications';
import { CreateProjectModal } from './CreateProjectModal';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface CollabsTabProps {
  project?: ProjectWithProfile | null;
  onSkip?: (projectId: string) => void;
  onProjectCreated?: () => void;
}

export function CollabsTab({ onProjectCreated }: CollabsTabProps) {
  const { user } = useAuth();
  const { projects, loading, error, fetchProjects } = useProjects();
  const { applyToProject, loading: applicationLoading } = useProjectApplications();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [appliedProjects, setAppliedProjects] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    collab_type: '',
    is_remote: undefined as boolean | undefined,
    show_own: true,
  });

  // Fetch all projects including user's own
  useEffect(() => {
    fetchProjects({
      search: searchQuery,
      collab_type: filters.collab_type || undefined,
      is_remote: filters.is_remote,
    });
  }, [searchQuery, filters, fetchProjects]);

  const handleApply = async (projectId: string) => {
    const { error } = await applyToProject(projectId);
    if (error) {
      alert(error);
    } else {
      setAppliedProjects(prev => new Set([...prev, projectId]));
    }
  };

  const handleProjectCreated = () => {
    setShowCreateModal(false);
    onProjectCreated?.();
    fetchProjects(); // Refresh the list
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
  };

  const filteredProjects = projects.filter(project => {
    if (!filters.show_own && project.creator_id === user?.id) {
      return false;
    }
    return true;
  });

  const isOwnProject = (project: ProjectWithProfile) => project.creator_id === user?.id;

  if (loading) {
    return (
      <div className="p-4 pb-24">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 pb-24">
        <GlassCard className="p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error loading projects</h3>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            Try Again
          </Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white">Collaborations</h2>
            <p className="text-gray-300">
              Discover and join creative projects
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="ghost"
              className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, show_own: !prev.show_own }))}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.show_own
                  ? 'bg-purple-600/40 text-white border border-purple-500/50'
                  : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
              }`}
            >
              Show My Projects
            </button>

            {/* Quick Filters */}
            <select
              value={filters.collab_type}
              onChange={(e) => setFilters(prev => ({ ...prev, collab_type: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="">All Types</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Revenue Split">Revenue Split</option>
            </select>

            <select
              value={filters.is_remote === undefined ? '' : filters.is_remote.toString()}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                is_remote: e.target.value === '' ? undefined : e.target.value === 'true' 
              }))}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm"
            >
              <option value="">All Locations</option>
              <option value="true">Remote</option>
              <option value="false">Local</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
          <p className="text-gray-300 mb-6">
            {searchQuery || Object.values(filters).some(f => f !== '' && f !== undefined && f !== true)
              ? 'Try adjusting your search or filters'
              : 'Be the first to create a collaboration project!'
            }
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Project
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectThreadCard
              key={project.id}
              project={project}
              isExpanded={expandedProject === project.id}
              isOwnProject={isOwnProject(project)}
              hasApplied={appliedProjects.has(project.id)}
              onToggleExpand={() => toggleProjectExpansion(project.id)}
              onApply={() => handleApply(project.id)}
              applicationLoading={applicationLoading}
            />
          ))}
        </div>
      )}

      {/* Floating Action Button */}
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

      <CreateProjectModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}

// Project Thread Card Component
interface ProjectThreadCardProps {
  project: ProjectWithProfile;
  isExpanded: boolean;
  isOwnProject: boolean;
  hasApplied: boolean;
  onToggleExpand: () => void;
  onApply: () => void;
  applicationLoading: boolean;
}

function ProjectThreadCard({
  project,
  isExpanded,
  isOwnProject,
  hasApplied,
  onToggleExpand,
  onApply,
  applicationLoading,
}: ProjectThreadCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(Math.floor(Math.random() * 50) + 1); // Mock upvotes

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvoted(!upvoted);
    setUpvotes(prev => upvoted ? prev - 1 : prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <GlassCard className="overflow-hidden hover:bg-white/10 transition-all duration-200">
        {/* Thread Header - Always Visible */}
        <div 
          className="p-4 cursor-pointer"
          onClick={onToggleExpand}
        >
          <div className="flex gap-4">
            {/* Upvote Section */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <button
                onClick={handleUpvote}
                className={`p-1 rounded transition-colors ${
                  upvoted ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'
                }`}
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <span className={`text-sm font-medium ${upvoted ? 'text-orange-500' : 'text-gray-300'}`}>
                {upvotes}
              </span>
              <button className="p-1 text-gray-400 hover:text-blue-400 transition-colors">
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            {/* Project Content */}
            <div className="flex-1 min-w-0">
              {/* Header Info */}
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                    {project.creator_avatar ? (
                      <img
                        src={project.creator_avatar}
                        alt={project.creator_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-bold">
                        {getInitials(project.creator_name || 'U')}
                      </span>
                    )}
                  </div>
                  <span className="text-purple-300">r/collabs</span>
                  <span>•</span>
                  <span>Posted by u/{project.creator_name}</span>
                  {isOwnProject && (
                    <Badge className="bg-green-600/20 text-green-300 border-green-500/30 text-xs">
                      Your Project
                    </Badge>
                  )}
                </div>
                <span>•</span>
                <span>{formatDate(project.created_at)}</span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-white mb-2 hover:text-purple-300 transition-colors">
                {project.title}
              </h3>

              {/* Quick Info Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
                  <DollarSign className="w-3 h-3 mr-1" />
                  {project.collab_type}
                </Badge>
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                  <MapPin className="w-3 h-3 mr-1" />
                  {project.is_remote ? 'Remote' : project.location || 'Local'}
                </Badge>
                <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  {project.roles_needed.length} role{project.roles_needed.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {/* Description Preview */}
              <p className="text-gray-300 text-sm line-clamp-2 mb-3">
                {project.description}
              </p>

              {/* Thread Actions */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <button 
                  onClick={onToggleExpand}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{Math.floor(Math.random() * 20)} comments</span>
                </button>
                <button className="flex items-center gap-1 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  <span>Share</span>
                </button>
                <button className="flex items-center gap-1 hover:text-white transition-colors">
                  <Star className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <div className="flex items-center gap-1 ml-auto">
                  <Eye className="w-4 h-4" />
                  <span>{Math.floor(Math.random() * 500) + 50} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-white/10">
                <div className="pt-4 space-y-6">
                  {/* Cover Image */}
                  {project.cover_url && (
                    <div className="relative h-48 rounded-xl overflow-hidden">
                      <img
                        src={project.cover_url}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  )}

                  {/* Full Description */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">Project Description</h4>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                      {project.description}
                    </p>
                  </div>

                  {/* Detailed Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Roles Needed */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        Looking For
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.roles_needed.map((role) => (
                          <Badge key={role} className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <User className="w-4 h-4 text-pink-400" />
                        Project Creator
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center">
                          {project.creator_avatar ? (
                            <img
                              src={project.creator_avatar}
                              alt={project.creator_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-bold">
                              {getInitials(project.creator_name || 'U')}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{project.creator_name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {project.creator_roles?.slice(0, 2).map((role) => (
                              <Badge key={role} className="bg-pink-600/20 text-pink-300 border-pink-500/30 text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {project.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-cyan-400" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag} className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Details */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{project.collab_type}</div>
                      <div className="text-xs text-gray-400">Collaboration Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">
                        {project.is_remote ? 'Remote' : 'Local'}
                      </div>
                      <div className="text-xs text-gray-400">Work Style</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isOwnProject && (
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApply();
                        }}
                        disabled={applicationLoading || hasApplied}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        {applicationLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin mr-2" />
                            Applying...
                          </>
                        ) : hasApplied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Applied!
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            Apply to Collaborate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Creator
                      </Button>
                    </div>
                  )}

                  {isOwnProject && (
                    <div className="flex gap-3 pt-4 border-t border-white/10">
                      <Button
                        variant="ghost"
                        className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Applications
                      </Button>
                      <Button
                        variant="ghost"
                        className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Project
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}