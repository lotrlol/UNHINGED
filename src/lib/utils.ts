import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const CREATOR_ROLES = [
  'Photographer',
  'Model',
  'Musician',
  'Singer',
  'Producer',
  'Director',
  'Actor',
  'Writer',
  'Designer',
  'Artist',
  'Dancer',
  'Videographer',
  'Editor',
  'Makeup Artist',
  'Stylist',
  'DJ',
  'Influencer'
]

export const COLLAB_TYPES = [
  'Paid',
  'Unpaid',
  'Revenue Split'
]

export const CREATIVE_TAGS = [
  'Fashion',
  'Portrait',
  'Landscape',
  'Street',
  'Wedding',
  'Commercial',
  'Editorial',
  'Fine Art',
  'Pop',
  'Rock',
  'Hip Hop',
  'Electronic',
  'Jazz',
  'Classical',
  'Indie',
  'Alternative',
  'Documentary',
  'Narrative',
  'Music Video',
  'Commercial',
  'Experimental',
  'Horror',
  'Comedy',
  'Drama'
]

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

/**
 * Helper function to get public URL from Supabase storage with cache busting
 * @param path - The storage path or full URL
 * @param bucket - The storage bucket name
 * @returns Processed URL or null if path is null/undefined
 */
export function getPublicUrl(path: string | null | undefined, bucket: string): string | null {
  if (!path) return null;

  // If it's already a full URL, return it as-is
  if (path.startsWith('http')) {
    return path;
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  // Add a cache-busting timestamp
  return `${data.publicUrl}?t=${new Date().getTime()}`;
}

/**
 * Helper function to process profile URLs (avatar, cover, banner)
 * @param user - User object with URL fields
 * @returns User object with processed URLs
 */
export function processUserUrls(user: any) {
  if (!user) return user;

  return {
    ...user,
    avatar_url: getPublicUrl(user.avatar_path, 'avatars') || user.avatar_url,
    cover_url: getPublicUrl(user.cover_path, 'covers') || user.cover_url,
    banner_url: getPublicUrl(user.banner_path, 'covers') || user.banner_url
  };
}