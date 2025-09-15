import React, { useState, useEffect } from 'react';
import {
  Info,
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
  User,
  Tag,
  Check,
  Settings,
  Globe,
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ProjectWithProfile, useProjects } from '../hooks/useProjects';
import { formatDate, getInitials } from '../lib/utils';
import { CreateProjectModal } from './CreateProjectModal';
import { useProjectApplications } from '../hooks/useProjectApplications';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useProjectViews } from '../hooks/useProjectViews';
import { ProjectCommentSection } from './ProjectCommentSection';
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
  const { recordView } = useProjectViews();
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
    // Create filters object without excluding user's own projects
    const projectFilters = {
      search: searchQuery || undefined,
      collab_type: filters.collab_type || undefined,
      is_remote: filters.is_remote,
    };
    
    fetchProjects(projectFilters);
  }, [searchQuery, filters.collab_type, filters.is_remote, fetchProjects]);

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
    // Refresh the list with current filters
    const projectFilters = {
      search: searchQuery || undefined,
      collab_type: filters.collab_type || undefined,
      is_remote: filters.is_remote,
    };
    fetchProjects(projectFilters);
  };

  const toggleProjectExpansion = (projectId: string) => {
    setExpandedProject(expandedProject === projectId ? null : projectId);
    
    // Record view when project is expanded
    if (expandedProject !== projectId) {
      recordView(projectId);
    }
  };

  const filteredProjects = projects.filter(project => {
    // Show all projects by default, including your own
    // Only filter out your own projects if show_own is explicitly set to false
    if (filters.show_own === false && project.creator_id === user?.id) {
      return false;
    }
    // Check if the current user has already applied
    const hasApplied = project.applications?.some(
      (app: { user_id: string }) => app.user_id === user?.id
    ) ?? false;
    return true;
  });

  const isOwnProject = (project: ProjectWithProfile) => project.creator_id === user?.id;
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

  // Update comment counts when projects change
  useEffect(() => {
    const counts: Record<string, number> = {};
    projects.forEach(project => {
      counts[project.id] = project.comment_count || 0;
    });
    setCommentCounts(counts);
  }, [projects]);

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
            
          </div>
          
        </div>

        {/* Search and Filters */}
        <div className="space-y-2 w-full px-0">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex flex-col w-full gap-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {showFilters ? 'Hide Filters' : 'Filter Projects'}
                </Button>
                
                {(filters.collab_type || filters.is_remote !== undefined || !filters.show_own) && (
                  <Button
                    onClick={() => setFilters({
                      collab_type: '',
                      is_remote: undefined,
                      show_own: true
                    })}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2.5 text-gray-400 hover:text-white"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-300 mb-2">Collaboration Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Paid', 'Unpaid', 'Revenue Split'].map((type) => (
                      <Button
                        key={type}
                        onClick={() => setFilters(prev => ({
                          ...prev,
                          collab_type: prev.collab_type === type ? '' : type
                        }))}
                        variant={filters.collab_type === type ? 'primary' : 'ghost'}
                        size="sm"
                        className={`text-xs h-7 px-3 text-white ${
                          filters.collab_type === type 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-white/5 hover:bg-white/10 text-white/90'
                        }`}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10">
                  <Button
                    onClick={() => setFilters(prev => ({ ...prev, is_remote: !prev.is_remote }))}
                    variant={filters.is_remote ? 'primary' : 'ghost'}
                    size="sm"
                    className={`text-xs h-7 px-3 text-white ${
                      filters.is_remote 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-white/5 hover:bg-white/10 text-white/90'
                    }`}
                  >
                    <Globe className="w-3 h-3 mr-1.5" />
                    Remote Only
                  </Button>
                  
                  <Button
                    onClick={() => setFilters(prev => ({ ...prev, show_own: !prev.show_own }))}
                    variant={!filters.show_own ? 'primary' : 'ghost'}
                    size="sm"
                    className={`text-xs h-7 px-3 text-white ${
                      !filters.show_own 
                        ? 'bg-purple-600 hover:bg-purple-700' 
                        : 'bg-white/5 hover:bg-white/10 text-white/90'
                    }`}
                  >
                    <User className="w-3 h-3 mr-1.5" />
                    {filters.show_own ? 'Hide My Projects' : 'Showing My Projects'}
                  </Button>
                </div>
              </div>
            )}
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
              commentCount={commentCounts[project.id] || project.comment_count || 0}
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
  hasApplied?: boolean;
  onToggleExpand: () => void;
  onApply?: () => void;
  applicationLoading?: boolean;
  commentCount: number;
}

function ProjectThreadCard({
  project: initialProject,
  isExpanded,
  isOwnProject,
  onToggleExpand,
  onApply,
  applicationLoading,
  commentCount,
}: ProjectThreadCardProps) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvotes, setUpvotes] = useState(Math.floor(Math.random() * 50) + 1);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [project, setProject] = useState<ProjectWithProfile & { views?: number }>({
    ...initialProject,
    description: initialProject.description || '',
    views: 0, // Temporary until we have proper view tracking
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    
    setProject(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Comment out unused function for now
  // const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter' && newTag.trim()) {
  //     e.preventDefault();
  //     if (!project.tags.includes(newTag.trim())) {
  //       setProject(prev => ({
  //         ...prev,
  //         tags: [...prev.tags, newTag.trim()]
  //       }));
  //     }
  //     setNewTag('');
  //   }
  // };

  // Comment out unused function for now
  // const removeTag = (tagToRemove: string) => {
  //   setProject(prev => ({
  //     ...prev,
  //     tags: prev.tags.filter(tag => tag !== tagToRemove)
  //   }));
  // };

  // Comment out unused function for now
  // const addRole = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter' && newRole.trim()) {
  //     e.preventDefault();
  //     if (!project.roles_needed.includes(newRole.trim())) {
  //       setProject(prev => ({
  //         ...prev,
  //         roles_needed: [...prev.roles_needed, newRole.trim()]
  //       }));
  //     }
  //     setNewRole('');
  //   }
  // };

  // Comment out unused function for now
  // const removeRole = (roleToRemove: string) => {
  //   setProject(prev => ({
  //     ...prev,
  //     roles_needed: prev.roles_needed.filter(role => role !== roleToRemove)
  //   }));
  // };
  
  const handleSave = async () => {
    try {
      // Prepare updates object with only the fields that exist in the schema
      const updates = {
        title: project.title,
        description: project.description || '',
        roles_needed: project.roles_needed
        // Removed updated_at since it doesn't exist in the schema
      };
      
      // Update the project in the database
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id);

      if (error) throw error;
      
      // Update the initial project data to match the saved state
      Object.assign(initialProject, updates);
      
      // Reset editing state
      setIsEditing(false);
      setShowAddRole(false);
      setNewRole('');
    } catch (error) {
      console.error('Error saving project:', error);
      // Revert to initial state on error
      setProject(initialProject);
    }
  };

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUpvoted(!upvoted);
    setUpvotes(prev => upvoted ? prev - 1 : prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative z-10"
    >
      <GlassCard className="overflow-hidden hover:bg-white/10 transition-all duration-200 relative">
        {/* Banner Background */}
        {project.cover_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-all duration-500"
            style={{
              backgroundImage: `url(${project.cover_url})`,
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
              maskImage: 'linear-gradient(to left, black 0%, black 50%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to left, black 0%, black 50%, transparent 100%)',
              zIndex: -1,
              transform: 'scale(1.02)',
            }}
          />
        )}
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
                
                  <span>•</span>
                  <span>By {project.creator_name}</span>
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
              <div className="relative group">
                {isEditing ? (
                  <input
                    type="text"
                    name="title"
                    value={project.title}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1 text-lg font-semibold text-white mb-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                ) : (
                  <h3 
                    className="text-lg font-semibold text-white mb-2 hover:text-purple-300 transition-colors cursor-text"
                    onClick={() => isOwnProject && setIsEditing(true)}
                  >
                    {project.title}
                    {isOwnProject && (
                      <button 
                        className="ml-2 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        </svg>
                      </button>
                    )}
                  </h3>
                )}
              </div>

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

              {/* Description */}
              <div className="relative group">
                {isEditing ? (
                  <textarea
                    name="description"
                    value={project.description}
                    onChange={handleInputChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 mb-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                  />
                ) : (
                  <p 
                    className="text-gray-300 text-sm line-clamp-2 mb-3 cursor-text whitespace-pre-line"
                    onClick={() => isOwnProject && setIsEditing(true)}
                  >
                    {project.description || <span className="text-gray-500 italic">Add a description...</span>}
                  </p>
                )}
              </div>
              
              {/* Edit Controls */}
              {isEditing && (
                <div className="flex justify-end gap-2 mb-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setProject(initialProject);
                      setIsEditing(false);
                    }}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={handleSave}
                    className="text-xs"
                  >
                    Save Changes
                  </Button>
                </div>
              )}

              {/* Thread Actions */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <button 
                  onClick={onToggleExpand}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{commentCount} comments</span>
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
                  <span>{project.views || 0} views</span>
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
              className="overflow-hidden relative"
            >
              {/* Background for expanded content */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 z-[-1]" />
              <div className="px-4 pb-4 border-t border-white/10 relative">
                <div className="pt-4 space-y-6">
                  {/* Project Header with Creator Info */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                    {/* Project Cover Image */}
                    {project.cover_url && (
                      <div className="relative h-32 w-full sm:w-48 rounded-xl overflow-hidden flex-shrink-0">
                        <img
                          src={project.cover_url}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}
                    
                    {/* Additional Project Details */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-400" />
                      Project Details
                    </h4>
                    {/* Additional project details can go here */}
                  </div>
                  </div>

                  {/* Full Description */}
                  <div className="relative">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-white">Project Description</h4>
                      {isOwnProject && !isEditing && (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          name="description"
                          value={project.description}
                          onChange={handleInputChange}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          rows={5}
                        />
                      </div>
                    ) : (
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {project.description || <span className="text-gray-500 italic">No description provided</span>}
                      </p>
                    )}
                  </div>

                  {/* Detailed Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Roles Needed */}
                    <div>
                     
                     
                      
                    </div>

                    {/* Creator Info */}
                    <div>
                      
                    </div>
                  </div>

                 
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
                          onApply && (
                            <button
                              onClick={onApply}
                              disabled={applicationLoading || appliedProjects.has(project.id)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                appliedProjects.has(project.id)
                                  ? 'bg-green-600/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                              }`}
                            >
                              {applicationLoading ? (
                                <span className="flex items-center gap-2">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Applying...
                                </span>
                              ) : appliedProjects.has(project.id) ? (
                                <span className="flex items-center gap-1">
                                  <Check className="w-4 h-4" /> Applied
                                </span>
                              ) : (
                                'Apply to Collaborate'
                              )}
                            </button>
                          );
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Apply to Collaborate
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

                  {/* Comments Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-400" />
                      Comments ({commentCount})
                    </h4>
                    <ProjectCommentSection 
                      projectId={project.id}
                      showPreview={false}
                      isExpanded={true}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}