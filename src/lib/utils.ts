import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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