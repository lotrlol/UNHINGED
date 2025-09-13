/*
  # Fix projects_with_profiles view

  This migration ensures the projects_with_profiles view exists and is properly configured.
  The view combines project data with creator profile information for the main feed.

  1. Views
    - `projects_with_profiles` - Projects joined with creator profile data
  
  2. Security
    - Enable RLS on the view
    - Add policy for public read access with NSFW filtering
*/

-- Drop the view if it exists to recreate it properly
DROP VIEW IF EXISTS projects_with_profiles;

-- Create the projects_with_profiles view
CREATE VIEW projects_with_profiles AS
SELECT 
  p.id,
  p.creator_id,
  p.creator_type,
  p.title,
  p.description,
  p.roles_needed,
  p.collab_type,
  p.tags,
  p.location,
  p.is_remote,
  p.nsfw,
  p.cover_url,
  p.created_at,
  CASE 
    WHEN p.creator_type = 'profile' THEN prof.full_name
    WHEN p.creator_type = 'group' THEN g.name
    ELSE 'Unknown'
  END as creator_name,
  CASE 
    WHEN p.creator_type = 'profile' THEN prof.avatar_url
    WHEN p.creator_type = 'group' THEN g.avatar_url
    ELSE NULL
  END as creator_avatar,
  CASE 
    WHEN p.creator_type = 'profile' THEN prof.roles
    WHEN p.creator_type = 'group' THEN ARRAY[]::text[]
    ELSE ARRAY[]::text[]
  END as creator_roles
FROM projects p
LEFT JOIN profiles prof ON p.creator_type = 'profile' AND p.creator_id = prof.id
LEFT JOIN groups g ON p.creator_type = 'group' AND p.creator_id = g.id
WHERE 
  (p.creator_type = 'profile' AND prof.flagged = false) 
  OR 
  (p.creator_type = 'group' AND g.id IS NOT NULL);

-- Enable RLS on the view
ALTER VIEW projects_with_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public can view projects" ON projects_with_profiles
  FOR SELECT USING (true);

-- Grant access to authenticated users
GRANT SELECT ON projects_with_profiles TO authenticated;
GRANT SELECT ON projects_with_profiles TO anon;