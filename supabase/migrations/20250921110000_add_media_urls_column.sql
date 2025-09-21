/*
  # Add media_urls column to content_posts table

  1. Schema Changes
    - Add `media_urls` text array column to `content_posts` table
    - Set default value to empty array for existing posts
    - This will allow storing multiple media URLs for each content post

  2. Data Migration
    - Update existing posts to have empty media_urls array
*/

-- Add media_urls column to content_posts table
ALTER TABLE content_posts
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT '{}';

-- Create index for better performance on media_urls queries
CREATE INDEX IF NOT EXISTS content_posts_media_urls_idx ON content_posts USING gin(media_urls);

-- Update existing content_posts with empty media_urls array
UPDATE content_posts
SET media_urls = '{}'
WHERE media_urls IS NULL;
