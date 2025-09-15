import { useEffect, useState, useCallback } from 'react';
import { supabase as supabaseClient, insertIntoTable, updateTable } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Database } from '../types/database';

// Create a typed supabase client
const supabase = supabaseClient as any; // Temporary workaround for type issues

type Profiles = Database['public']['Tables']['profiles']['Update'];

type BaseProfile = Database['public']['Tables']['profiles']['Row'];

// Extend the base profile type to include our custom fields
export type Profile = BaseProfile & {
  banner_url?: string | null;
  banner_path?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
};

type ProfileInsert = Omit<Database['public']['Tables']['profiles']['Insert'], 'id' | 'created_at' | 'updated_at'>;

// Helper type for updates that excludes readonly fields
type UpdateProfileData = Omit<Partial<Profile>, 'id' | 'created_at'> & {
  updated_at?: string;
};

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPublicUrl = (path: string | null | undefined, bucket: 'avatars' | 'banners') => {
    if (!path) return null;
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path, { 
        download: false,
        // Add cache-busting query parameter
        transform: {
          width: bucket === 'avatars' ? 400 : 1200,
          quality: 80
        }
      });
    // Add a cache-busting timestamp
    return `${publicUrl}?t=${new Date().getTime()}`;
  };

  const fetchProfile = async () => {
    if (!user) return null;
    
    try {
      setLoading(true);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (!profile) return null;

      // Generate fresh URLs for avatar and banner
      const profileWithUrls = {
        ...profile,
        avatar_url: profile.avatar_path ? getPublicUrl(profile.avatar_path, 'avatars') : null,
        banner_url: profile.banner_path ? getPublicUrl(profile.banner_path, 'banners') : null
      };

      console.log('Fetched profile with fresh URLs:', {
        ...profileWithUrls,
        avatar_url: profileWithUrls.avatar_url?.substring(0, 100) + '...',
        banner_url: profileWithUrls.banner_url?.substring(0, 100) + '...'
      });

      setProfile(profileWithUrls);
      return profileWithUrls;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error : new Error('Failed to load profile'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (profile) {
          // Generate fresh URLs for avatar and banner
          const profileWithUrls = {
            ...profile,
            avatar_url: profile.avatar_path ? getPublicUrl(profile.avatar_path, 'avatars') : null,
            banner_url: profile.banner_path ? getPublicUrl(profile.banner_path, 'banners') : null
          };
          
          setProfile(profileWithUrls);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(error instanceof Error ? error : new Error('Failed to load profile'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const updateProfile = async (updates: UpdateProfileData) => {
    if (!user) return { data: null, error: new Error('No user') };

    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await updateTable('profiles', updateData, user.id);

      if (error) throw error;

      if (data) {
        setProfile(data);
        console.log('Profile updated:', data);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Error updating profile') 
      };
    }
  }

  const createProfile = async (profileData: ProfileInsert) => {
    console.log('[createProfile] Starting profile creation...');
    
    if (!user) {
      const error = new Error('No user authenticated');
      console.error('[createProfile] Error:', error);
      return { data: null, error };
    }

    try {
      // Validate required fields
      const requiredFields = ['username', 'full_name'] as const;
      const missingFields = requiredFields.filter(field => !(field in profileData) || !profileData[field as keyof typeof profileData]);
      
      if (missingFields.length > 0) {
        const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
        console.error('[createProfile] Validation error:', error);
        return { data: null, error };
      }

      const now = new Date().toISOString();
      const profileToCreate = {
        ...profileData,
        id: user.id,
        onboarding_completed: true,
        created_at: now,
        updated_at: now
      };

      console.log('[createProfile] Creating profile with data:', profileToCreate);
      
      // Use type assertion to bypass TypeScript's type checking for the insert operation
      const { data, error } = await insertIntoTable('profiles', profileToCreate);

      if (error) {
        console.error('[createProfile] Supabase error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (data) {
        console.log('[createProfile] Profile created successfully:', data);
        setProfile(data);
      } else {
        console.warn('[createProfile] No data returned from profile creation');
      }

      return { data, error: null };
    } catch (error) {
      console.error('[createProfile] Unexpected error:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error occurred') 
      };
    }
  }

  const uploadFile = async (file: File, type: 'avatar' | 'banner') => {
    if (!user) {
      const error = new Error('No user authenticated');
      console.error(`[uploadFile/${type}] Error:`, error);
      return { data: null, error };
    }

    try {
      setUploading(true);
      
      // Generate a unique filename using user ID, timestamp, and random string
      const fileExt = file.name.split('.').pop()?.toLowerCase() || (type === 'avatar' ? 'png' : 'jpg');
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const fileName = `${user.id}/${uniqueId}.${fileExt}`;  // Store in user's folder
      const bucket = type === 'avatar' ? 'avatars' : 'banners';
      const pathField = `${type}_path` as const;
      
      console.log(`[uploadFile/${type}] Uploading file:`, {
        originalName: file.name,
        newName: fileName,
        size: file.size,
        type: file.type
      });

      // First, delete the old file if it exists
      const oldPath = profile?.[pathField];
      if (oldPath) {
        try {
          console.log(`[uploadFile/${type}] Deleting old file:`, oldPath);
          const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([oldPath]);
            
          if (deleteError) {
            console.warn(`[uploadFile/${type}] Failed to delete old ${type}:`, deleteError);
          } else {
            console.log(`[uploadFile/${type}] Successfully deleted old file`);
          }
        } catch (deleteError) {
          console.warn(`[uploadFile/${type}] Error deleting old ${type}:`, deleteError);
        }
      }

      // Upload the file to storage with cache control
      console.log(`[uploadFile/${type}] Starting file upload to storage...`);
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '0', // Don't cache the file
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error(`[uploadFile/${type}] Upload error:`, uploadError);
        throw uploadError;
      }
      console.log(`[uploadFile/${type}] File uploaded successfully`);

      // Update the profile with the new path
      const updates = {
        [pathField]: fileName,  // Store the path, not the URL
        updated_at: new Date().toISOString()
      };
      
      console.log(`[uploadFile/${type}] Updating profile with path:`, updates);

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) {
        console.error(`[uploadFile/${type}] Profile update error:`, updateError);
        throw updateError;
      }
      console.log(`[uploadFile/${type}] Profile updated with new path`);

      // Refresh the entire profile to get fresh URLs
      console.log(`[uploadFile/${type}] Refreshing profile data...`);
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error(`[uploadFile/${type}] Error fetching updated profile:`, fetchError);
        throw fetchError;
      }

      // Generate fresh URLs for the updated profile
      const profileWithUrls = {
        ...updatedProfile,
        avatar_url: updatedProfile.avatar_path ? getPublicUrl(updatedProfile.avatar_path, 'avatars') : null,
        banner_url: (updatedProfile.banner_path ? getPublicUrl(updatedProfile.banner_path, 'banners') : updatedProfile.cover_url) || null
      };
      
      console.log(`[uploadFile/${type}] Updated profile with fresh URLs:`, {
        ...profileWithUrls,
        avatar_url: profileWithUrls.avatar_url?.substring(0, 100) + '...',
        banner_url: profileWithUrls.banner_url?.substring(0, 100) + '...'
      });
      
      // Update local state with the complete profile data
      setProfile(profileWithUrls);
      
      // Return the appropriate URL based on the upload type
      const resultUrl = type === 'avatar' ? profileWithUrls.avatar_url : profileWithUrls.banner_url;
      return { data: resultUrl, error: null };

    } catch (error) {
      console.error(`[uploadFile/${type}] Error:`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error(`Failed to upload ${type}`) 
      };
    } finally {
      setUploading(false);
    }
  };

  // Helper functions for backward compatibility
  const uploadAvatar = (file: File) => uploadFile(file, 'avatar');
  const uploadBanner = (file: File) => uploadFile(file, 'banner');

  return {
    profile,
    loading,
    error,
    updateProfile,
    createProfile,
    uploadFile,
    uploadAvatar,
    uploadBanner,
  }
}