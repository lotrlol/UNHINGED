-- Update storage policies for avatars bucket to support timestamp-based filenames
-- This migration should be run with a superuser role

-- First, drop existing policies for avatars if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view avatars' AND tablename = 'objects') THEN
    DROP POLICY "Anyone can view avatars" ON storage.objects;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload their own avatars' AND tablename = 'objects') THEN
    DROP POLICY "Users can upload their own avatars" ON storage.objects;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own avatars' AND tablename = 'objects') THEN
    DROP POLICY "Users can update their own avatars" ON storage.objects;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own avatars' AND tablename = 'objects') THEN
    DROP POLICY "Users can delete their own avatars" ON storage.objects;
  END IF;
END $$;

-- Create new policies with more flexible filename matching

-- Anyone can view avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload avatars with their user ID in the filename
CREATE POLICY "Users can upload avatars with their user ID"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (
      storage.filename(name) LIKE (auth.uid()::text || '-%') AND
      (
        name ~ '\.(jpg|jpeg|png|webp|gif)$' OR
        name ~ '\.[a-zA-Z0-9]+$' -- Allow any extension for flexibility
      )
    )
  );

-- Users can update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    storage.filename(name) LIKE (auth.uid()::text || '-%')
  )
  WITH CHECK (
    bucket_id = 'avatars' AND 
    storage.filename(name) LIKE (auth.uid()::text || '-%')
  );

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    storage.filename(name) LIKE (auth.uid()::text || '-%')
  );

-- Enable RLS on the storage.objects table if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'storage' AND tablename = 'objects' AND rowsecurity) THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create a function to help with filename pattern matching
CREATE OR REPLACE FUNCTION public.matches_user_id_pattern(filename text, user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN filename ~ ('^' || user_id::text || '-[0-9]+\\.(jpg|jpeg|png|webp|gif)$');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
