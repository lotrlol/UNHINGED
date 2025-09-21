import React, { useState } from 'react'
import { Search, Filter, X, MapPin, Users, Sparkles, Star, SortAsc, ChevronDown } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { FilterGlassCard } from './ui/GlassCard'
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
    // Pass an empty object to trigger the includePassed logic in useUserDiscovery
    onFiltersChange({} as any)
  }

  const activeFilterCount = Object.values(filters).filter(value =>
    Array.isArray(value) ? value.length > 0 : value !== undefined
  ).length

  const currentSortOption = SORT_OPTIONS.find(option => option.value === filters.sort_by) || SORT_OPTIONS[0]

  return (
    <FilterGlassCard variant="elevated" className="mb-6 overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value || undefined)}
            placeholder="Search by name, role, skills, or interests..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 backdrop-blur-sm transition-all"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter Toggle */}
            <Button
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 bg-black/40 text-gray-200 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="bg-gradient-to-r from-purple-600/60 to-pink-600/60 text-white border-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {/* Sort Dropdown */}
            <div className="relative">
              <Button
                size="sm"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 bg-black/40 text-gray-200 hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm"
              >
                <SortAsc className="w-4 h-4" />
                {currentSortOption.label}
                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </Button>

              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute top-full left-0 mt-2 rounded-xl backdrop-blur-xl bg-black/70 shadow-lg z-50 min-w-[160px]">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          updateFilter('sort_by', option.value as any)
                          setShowSortMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                          filters.sort_by === option.value
                            ? 'bg-gradient-to-r from-pink-600/40 to-purple-600/40 text-white'
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
                filters.is_verified
                  ? 'bg-green-900/60 text-green-200 border-green-700/50 backdrop-blur-sm'
                  : 'bg-black/30 text-gray-300 border-white/10 hover:bg-white/5 backdrop-blur-sm hover:text-green-200'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Verified</span>
            </button>

            <button
              onClick={() => updateFilter('is_remote', filters.is_remote ? undefined : true)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
                filters.is_remote
                  ? 'bg-blue-900/60 text-blue-200 border-blue-700/50 backdrop-blur-sm'
                  : 'bg-black/30 text-gray-300 border-white/10 hover:bg-white/5 backdrop-blur-sm hover:text-blue-200'
              }`}
            >
              <span className="text-base">🌍</span>
              <span>Remote</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">
              {userCount} of {totalCount} creators
            </span>
            {activeFilterCount > 0 && (
              <Button
                size="sm"
                onClick={clearFilters}
                className="text-gray-400 hover:text-red-300 bg-transparent hover:bg-red-900/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.roles?.map(role => (
              <Badge key={role} className="bg-purple-900/30 text-purple-200 border border-purple-700 flex items-center gap-1">
                {role}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayFilter('roles', role)} />
              </Badge>
            ))}
            {filters.looking_for?.map(role => (
              <Badge key={role} className="bg-pink-900/30 text-pink-200 border border-pink-700 flex items-center gap-1">
                Looking for: {role}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayFilter('looking_for', role)} />
              </Badge>
            ))}
            {filters.skills?.map(skill => (
              <Badge key={skill} className="bg-green-900/30 text-green-200 border border-green-700 flex items-center gap-1">
                Skill: {skill}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleArrayFilter('skills', skill)} />
              </Badge>
            ))}
            {filters.location && (
              <Badge className="bg-blue-900/30 text-blue-200 border border-blue-700 flex items-center gap-1">
                📍 {filters.location}
                <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('location', undefined)} />
              </Badge>
            )}
          </div>
        )}

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-6">
            {/* Roles */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-400" />
                <h3 className="font-medium text-white">Creator Roles</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {CREATOR_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleArrayFilter('roles', role)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.roles?.includes(role)
                        ? 'bg-purple-600/40 text-white border border-purple-500'
                        : 'bg-black/30 text-gray-300 border border-white/10 hover:bg-purple-600/30 hover:text-white'
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
                <Users className="w-4 h-4 text-pink-400" />
                <h3 className="font-medium text-white">Looking to Collaborate With</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {CREATOR_ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => toggleArrayFilter('looking_for', role)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.looking_for?.includes(role)
                        ? 'bg-pink-600/40 text-white border border-pink-500'
                        : 'bg-black/30 text-gray-300 border border-white/10 hover:bg-pink-600/30 hover:text-white'
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
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <h3 className="font-medium text-white">Creative Vibes</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {CREATIVE_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleArrayFilter('vibe_words', tag)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                      filters.vibe_words?.includes(tag)
                        ? 'bg-yellow-600/40 text-white border border-yellow-500'
                        : 'bg-black/30 text-gray-300 border border-white/10 hover:bg-yellow-600/30 hover:text-white'
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
                <MapPin className="w-4 h-4 text-blue-400" />
                <h3 className="font-medium text-white">Location</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={filters.location || ''}
                  onChange={(e) => updateFilter('location', e.target.value || undefined)}
                  placeholder="City, State, Country..."
                  className="px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={filters.is_remote || false}
                    onChange={(e) => updateFilter('is_remote', e.target.checked || undefined)}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 bg-black/40 border-white/10"
                  />
                  Open to remote work
                </label>
              </div>
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-400" />
                <h3 className="font-medium text-white">Skills</h3>
              </div>
              <input
                type="text"
                placeholder="Type a skill and press Enter to add..."
                className="w-full px-4 py-2 rounded-lg bg-black/30 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      className="bg-green-900/40 text-green-200 border border-green-700 cursor-pointer hover:bg-red-900/40 hover:text-red-300"
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
      </div>
    </FilterGlassCard>
  )
}
