-- Add avatar_url column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies for avatars bucket
DO $$
BEGIN
  -- Remove existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

  -- Create new policies
  CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

  CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.filename(name) = (auth.uid()::text || '.jpg') 
                                         OR storage.filename(name) = (auth.uid()::text || '.png')
                                         OR storage.filename(name) = (auth.uid()::text || '.webp')
                                         OR storage.filename(name) = (auth.uid()::text || '.gif')));

  CREATE POLICY "Users can update their own avatars"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.filename(name) = (auth.uid()::text || '.jpg') 
                                    OR storage.filename(name) = (auth.uid()::text || '.png')
                                    OR storage.filename(name) = (auth.uid()::text || '.webp')
                                    OR storage.filename(name) = (auth.uid()::text || '.gif')));

  CREATE POLICY "Users can delete their own avatars"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.filename(name) = (auth.uid()::text || '.jpg') 
                                    OR storage.filename(name) = (auth.uid()::text || '.png')
                                    OR storage.filename(name) = (auth.uid()::text || '.webp')
                                    OR storage.filename(name) = (auth.uid()::text || '.gif')));
END $$;
