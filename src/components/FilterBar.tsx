import React, { useState } from 'react'
import { Filter, MapPin, Users, DollarSign, Tag, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { CREATOR_ROLES, COLLAB_TYPES, CREATIVE_TAGS } from '../lib/utils'
import { ProjectFilters } from '../hooks/useProjects'

interface FilterBarProps {
  filters: ProjectFilters
  onFiltersChange: (filters: ProjectFilters) => void
}

export function FilterBar({ filters, onFiltersChange }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false)

  const updateFilter = (key: keyof ProjectFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleRole = (role: string) => {
    const currentRoles = filters.roles || []
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role]
    updateFilter('roles', newRoles)
  }

  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    updateFilter('tags', newTags)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ).length

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="default" size="sm">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.roles?.map(role => (
              <Badge key={role} variant="default" className="flex items-center gap-1">
                {role}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => toggleRole(role)}
                />
              </Badge>
            ))}
            {filters.collab_type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.collab_type}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('collab_type', undefined)}
                />
              </Badge>
            )}
            {filters.is_remote !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.is_remote ? 'Remote' : 'Local'}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => updateFilter('is_remote', undefined)}
                />
              </Badge>
            )}
            {filters.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                #{tag}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => toggleTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="border-t border-gray-200 p-4 space-y-6">
          {/* Roles */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Looking for roles</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CREATOR_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.roles?.includes(role)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Collaboration Type */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Collaboration type</h3>
            </div>
            <div className="flex gap-2">
              {COLLAB_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => updateFilter('collab_type', filters.collab_type === type ? undefined : type)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    filters.collab_type === type
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Location</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateFilter('is_remote', filters.is_remote === false ? undefined : false)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filters.is_remote === false
                    ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Local
              </button>
              <button
                onClick={() => updateFilter('is_remote', filters.is_remote === true ? undefined : true)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  filters.is_remote === true
                    ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Remote
              </button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-purple-600" />
              <h3 className="font-medium text-gray-900">Creative tags</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {CREATIVE_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.tags?.includes(tag)
                      ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* NSFW Toggle */}
          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filters.show_nsfw || false}
                onChange={(e) => updateFilter('show_nsfw', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">Show NSFW content</span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}