import React, { useState } from 'react'
import { Search, Filter, X, MapPin, Users, Sparkles, Star, SortAsc, ChevronDown } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card, CardContent } from './ui/Card'
import { CREATOR_ROLES, CREATIVE_TAGS } from '../lib/utils'
import { DiscoveryFilters as UserDiscoveryFilters } from '../hooks/useUserDiscovery'

interface DiscoveryFiltersProps {
  filters: UserDiscoveryFilters
  onFiltersChange: (filters: UserDiscoveryFilters) => void
  userCount: number
  totalCount: number
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'verified', label: 'Verified First' },
  { value: 'name', label: 'Name A-Z' }
]

export function DiscoveryFilters({ filters, onFiltersChange, userCount, totalCount }: DiscoveryFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const updateFilter = (key: keyof UserDiscoveryFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleArrayFilter = (key: 'roles' | 'looking_for' | 'skills' | 'vibe_words', item: string) => {
    const currentArray = filters[key] || []
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item]
    updateFilter(key, newArray.length > 0 ? newArray : undefined)
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount = Object.values(filters).filter(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ).length

  const currentSortOption = SORT_OPTIONS.find(option => option.value === filters.sort_by) || SORT_OPTIONS[0]

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search and Quick Filters */}
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              placeholder="Search by name, role, skills, or interests..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
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

              {/* Sort Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2"
                >
                  <SortAsc className="w-4 h-4" />
                  {currentSortOption.label}
                  <ChevronDown className="w-4 h-4" />
                </Button>
                
                {showSortMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowSortMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[160px]">
                      {SORT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateFilter('sort_by', option.value as any)
                            setShowSortMenu(false)
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            filters.sort_by === option.value ? 'bg-purple-50 text-purple-700' : ''
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Quick Filters */}
              <button
                onClick={() => updateFilter('is_verified', filters.is_verified ? undefined : true)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.is_verified
                    ? 'bg-green-100 text-green-800 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className="w-3 h-3 inline mr-1" />
                Verified
              </button>

              <button
                onClick={() => updateFilter('is_remote', filters.is_remote ? undefined : true)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.is_remote
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🌍 Remote
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Results Count */}
              <span className="text-sm text-gray-600">
                {userCount} of {totalCount} creators
              </span>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-red-600"
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.roles?.map(role => (
                <Badge key={role} variant="default" className="flex items-center gap-1">
                  {role}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleArrayFilter('roles', role)}
                  />
                </Badge>
              ))}
              {filters.looking_for?.map(role => (
                <Badge key={role} variant="secondary" className="flex items-center gap-1">
                  Looking for: {role}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleArrayFilter('looking_for', role)}
                  />
                </Badge>
              ))}
              {filters.skills?.map(skill => (
                <Badge key={skill} variant="success" className="flex items-center gap-1">
                  Skill: {skill}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => toggleArrayFilter('skills', skill)}
                  />
                </Badge>
              ))}
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  📍 {filters.location}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => updateFilter('location', undefined)}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-6">
            {/* Roles */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-gray-900">Creator Roles</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {CREATOR_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleArrayFilter('roles', role)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      filters.roles?.includes(role)
                        ? 'bg-purple-100 text-purple-800 border-2 border-purple-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Looking For */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-pink-600" />
                <h3 className="font-medium text-gray-900">Looking to Collaborate With</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {CREATOR_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleArrayFilter('looking_for', role)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      filters.looking_for?.includes(role)
                        ? 'bg-pink-100 text-pink-800 border-2 border-pink-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Creative Vibes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <h3 className="font-medium text-gray-900">Creative Vibes</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {CREATIVE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleArrayFilter('vibe_words', tag)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors text-left ${
                      filters.vibe_words?.includes(tag)
                        ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium text-gray-900">Location</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={filters.location || ''}
                  onChange={(e) => updateFilter('location', e.target.value || undefined)}
                  placeholder="City, State, Country..."
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.is_remote || false}
                      onChange={(e) => updateFilter('is_remote', e.target.checked || undefined)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Open to remote work</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Skills Input */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-600" />
                <h3 className="font-medium text-gray-900">Skills</h3>
              </div>
              <input
                type="text"
                placeholder="Type a skill and press Enter to add..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const skill = e.currentTarget.value.trim()
                    if (skill && !(filters.skills || []).includes(skill)) {
                      toggleArrayFilter('skills', skill)
                      e.currentTarget.value = ''
                    }
                  }
                }}
              />
              {filters.skills && filters.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {filters.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="success"
                      className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                      onClick={() => toggleArrayFilter('skills', skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}