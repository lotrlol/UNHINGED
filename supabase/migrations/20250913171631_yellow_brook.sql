/*
  # Fix Project Creation Policies and Storage

  1. Storage Buckets
    - Ensure covers bucket exists with proper policies
    - Allow authenticated users to upload cover images
    - Make covers publicly readable

  2. Projects Table Policies
    - Allow authenticated users to create projects
    - Allow public read access to projects
    - Allow creators to update their own projects

  3. Views and Functions
    - Ensure projects_with_profiles view works correctly
    - Add proper permissions for all users
*/

-- Create storage bucket for covers if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies for covers bucket
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own covers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own covers" ON storage.objects;

CREATE POLICY "Anyone can view covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "Authenticated users can upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "Users can update their own covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure projects table has proper RLS policies
DROP POLICY IF EXISTS "Anyone can view projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Anyone can view non-flagged projects"
  ON projects FOR SELECT
  USING (
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = projects.creator_id 
      AND profiles.flagged = true
    )
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = creator_id AND
    creator_type = 'profile' AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.flagged = false
    )
  );

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Ensure the projects_with_profiles view exists and works
DROP VIEW IF EXISTS projects_with_profiles;

CREATE VIEW projects_with_profiles AS
SELECT 
  p.*,
  CASE 
    WHEN p.creator_type = 'profile' THEN pr.full_name
    WHEN p.creator_type = 'group' THEN g.name
    ELSE 'Unknown'
  END as creator_name,
  CASE 
    WHEN p.creator_type = 'profile' THEN pr.avatar_url
    WHEN p.creator_type = 'group' THEN g.avatar_url
    ELSE NULL
  END as creator_avatar,
  CASE 
    WHEN p.creator_type = 'profile' THEN pr.roles
    WHEN p.creator_type = 'group' THEN ARRAY[]::text[]
    ELSE ARRAY[]::text[]
  END as creator_roles
FROM projects p
LEFT JOIN profiles pr ON p.creator_type = 'profile' AND p.creator_id = pr.id
LEFT JOIN groups g ON p.creator_type = 'group' AND p.creator_id = g.id
WHERE 
  (p.creator_type = 'profile' AND pr.flagged = false) OR
  (p.creator_type = 'group');

-- Grant permissions on the view
GRANT SELECT ON projects_with_profiles TO authenticated;
GRANT SELECT ON projects_with_profiles TO anon;

-- Enable RLS on the view (it inherits from the base table)
ALTER VIEW projects_with_profiles SET (security_invoker = true);

-- Ensure profiles table has proper policies for project creation
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (flagged = false);

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_creator_id ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_roles_needed ON projects USING GIN(roles_needed);
CREATE INDEX IF NOT EXISTS idx_projects_tags ON projects USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(location);
CREATE INDEX IF NOT EXISTS idx_projects_is_remote ON projects(is_remote);
CREATE INDEX IF NOT EXISTS idx_projects_nsfw ON projects(nsfw);
CREATE INDEX IF NOT EXISTS idx_projects_collab_type ON projects(collab_type);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';