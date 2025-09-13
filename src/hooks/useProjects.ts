import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ProjectFilters {
  status?: string;
  category?: string;
  search?: string;
  collab_type?: string;
  roles_needed?: string[];
  tags?: string[];
  location?: string;
  is_remote?: boolean;
}

export interface ProjectWithProfile {
  id: string;
  creator_id: string;
  creator_type: string;
  title: string;
  description: string;
  roles_needed: string[];
  collab_type: string;
  tags: string[];
  location: string | null;
  is_remote: boolean;
  nsfw: boolean;
  cover_url: string | null;
  created_at: string;
  creator_name: string | null;
  creator_avatar: string | null;
  creator_roles: string[] | null;
}

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProjectFilters>({});

  const fetchProjects = useCallback(async (newFilters: ProjectFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('projects_with_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (newFilters.collab_type) {
        query = query.eq('collab_type', newFilters.collab_type);
      }

      if (newFilters.search) {
        query = query.or(`title.ilike.%${newFilters.search}%,description.ilike.%${newFilters.search}%`);
      }

      if (newFilters.roles_needed && newFilters.roles_needed.length > 0) {
        query = query.overlaps('roles_needed', newFilters.roles_needed);
      }

      if (newFilters.tags && newFilters.tags.length > 0) {
        query = query.overlaps('tags', newFilters.tags);
      }

      if (newFilters.location) {
        query = query.eq('location', newFilters.location);
      }

      if (newFilters.is_remote !== undefined) {
        query = query.eq('is_remote', newFilters.is_remote);
      }

      // Don't show user's own projects
      if (user) {
        query = query.neq('creator_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refetch = useCallback(() => {
    fetchProjects(filters);
  }, [fetchProjects, filters]);

  useEffect(() => {
    fetchProjects(filters);
  }, [fetchProjects, filters]);

  const updateFilters = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters);
  }, []);

  return {
    projects,
    loading,
    error,
    refetch,
    setFilters: updateFilters,
    fetchProjects
  };
};