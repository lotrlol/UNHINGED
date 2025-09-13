import React, { useState } from 'react'
import { ProjectCard } from './ProjectCard'
import { FilterBar } from './FilterBar'
import { useProjects, ProjectFilters } from '../hooks/useProjects'
import { Loader2 } from 'lucide-react'

export function CollabsTab() {
  const [filters, setFilters] = useState<ProjectFilters>({})
  const { projects, loading, refetch } = useProjects(filters)

  const handleApply = (projectId: string) => {
    // This is now handled directly in ProjectCard component
  }

  const handleSkip = (projectId: string) => {
    // TODO: Implement skip logic (could track for algorithm)
    console.log('Skip project:', projectId)
  }

  // Refetch projects when component mounts (for refresh after creating new project)
  React.useEffect(() => {
    refetch?.()
  }, [refetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="pb-20">
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      
      <div className="p-4">
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No projects found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new collaborations!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onSkip={handleSkip}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}