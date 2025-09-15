-- Fix storage policies for avatars bucket

-- First, drop existing policies
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- Create new policies with proper RLS
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (
      storage.filename(name) = (auth.uid()::text || '.jpg') OR
      storage.filename(name) = (auth.uid()::text || '.jpeg') OR
      storage.filename(name) = (auth.uid()::text || '.png') OR
      storage.filename(name) = (auth.uid()::text || '.webp') OR
      storage.filename(name) = (auth.uid()::text || '.gif')
    )
  );

CREATE POLICY "Users can update their own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (
      storage.filename(name) = (auth.uid()::text || '.jpg') OR
      storage.filename(name) = (auth.uid()::text || '.jpeg') OR
      storage.filename(name) = (auth.uid()::text || '.png') OR
      storage.filename(name) = (auth.uid()::text || '.webp') OR
      storage.filename(name) = (auth.uid()::text || '.gif')
    )
  )
  WITH CHECK (
    bucket_id = 'avatars' AND 
    (
      storage.filename(name) = (auth.uid()::text || '.jpg') OR
      storage.filename(name) = (auth.uid()::text || '.jpeg') OR
      storage.filename(name) = (auth.uid()::text || '.png') OR
      storage.filename(name) = (auth.uid()::text || '.webp') OR
      storage.filename(name) = (auth.uid()::text || '.gif')
    )
  );

CREATE POLICY "Users can delete their own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    (
      storage.filename(name) = (auth.uid()::text || '.jpg') OR
      storage.filename(name) = (auth.uid()::text || '.jpeg') OR
      storage.filename(name) = (auth.uid()::text || '.png') OR
      storage.filename(name) = (auth.uid()::text || '.webp') OR
      storage.filename(name) = (auth.uid()::text || '.gif')
    )
  );
