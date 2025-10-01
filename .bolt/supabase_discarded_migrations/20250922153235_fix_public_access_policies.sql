-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;

-- Create new policies
-- Allow public read access to avatars and banners
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('avatars', 'banners'));

-- Allow users to manage their own avatars and banners
CREATE POLICY "Users can manage their own files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('avatars', 'banners') AND
    (
      -- Allow access to their own files
      (storage.filename(name) = (auth.uid()::text || '.jpg')) OR
      (storage.filename(name) = (auth.uid()::text || '.jpeg')) OR
      (storage.filename(name) = (auth.uid()::text || '.png')) OR
      (storage.filename(name) = (auth.uid()::text || '.webp')) OR
      (storage.filename(name) = (auth.uid()::text || '.gif')) OR
      -- Allow access to files in their user directory
      (name LIKE (auth.uid()::text || '/%'))
    )
  )
  WITH CHECK (
    bucket_id IN ('avatars', 'banners') AND
    (
      -- Allow managing their own files
      (storage.filename(name) = (auth.uid()::text || '.jpg')) OR
      (storage.filename(name) = (auth.uid()::text || '.jpeg')) OR
      (storage.filename(name) = (auth.uid()::text || '.png')) OR
      (storage.filename(name) = (auth.uid()::text || '.webp')) OR
      (storage.filename(name) = (auth.uid()::text || '.gif')) OR
      -- Allow managing files in their user directory
      (name LIKE (auth.uid()::text || '/%'))
    )
  );
