-- Create a storage bucket for banners if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

-- Create a function to check if a file belongs to the current user
CREATE OR REPLACE FUNCTION is_owner_banner(path text)
RETURNS boolean AS $$
BEGIN
  RETURN (
    storage.filename(path) = (auth.uid()::text || '.jpg') OR
    storage.filename(path) = (auth.uid()::text || '.jpeg') OR
    storage.filename(path) = (auth.uid()::text || '.png') OR
    storage.filename(path) = (auth.uid()::text || '.webp') OR
    storage.filename(path) = (auth.uid()::text || '.gif')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up RLS policies for the banners bucket
DROP POLICY IF EXISTS "Public read access to banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own banners" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own banners" ON storage.objects;

-- Allow public read access to banners
CREATE POLICY "Public read access to banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Allow users to view their own banners
CREATE POLICY "Users can view their own banners"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'banners' AND
    is_owner_banner(name)
  );

-- Allow users to upload their own banners
CREATE POLICY "Users can upload their own banners"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'banners' AND
    is_owner_banner(name)
  );

-- Allow users to update their own banners
CREATE POLICY "Users can update their own banners"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'banners' AND
    is_owner_banner(name)
  )
  WITH CHECK (
    bucket_id = 'banners' AND
    is_owner_banner(name)
  );

-- Allow users to delete their own banners
CREATE POLICY "Users can delete their own banners"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'banners' AND
    is_owner_banner(name)
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
