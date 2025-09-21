-- Enable RLS on storage.objects table if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions on storage.objects
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

-- Create a function to check if a file belongs to the current user
CREATE OR REPLACE FUNCTION is_owner(user_id uuid, path text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    storage.filename(path) = (user_id::text || '.jpg') OR
    storage.filename(path) = (user_id::text || '.jpeg') OR
    storage.filename(path) = (user_id::text || '.png') OR
    storage.filename(path) = (user_id::text || '.webp') OR
    storage.filename(path) = (user_id::text || '.gif') OR
    -- Allow files in subdirectories that start with user ID (for link images)
    path LIKE (user_id::text || '/%')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create new policies
-- Allow public read access to avatars
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow users to view their own avatars
CREATE POLICY "Users can view their own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    is_owner(auth.uid(), name)
  );

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    is_owner(auth.uid(), name)
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    is_owner(auth.uid(), name)
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    is_owner(auth.uid(), name)
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    is_owner(auth.uid(), name)
  );
