-- Add banner_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS banner_path TEXT;

-- Update RLS policies to allow users to update their banner
CREATE POLICY "Users can update their own banner"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'banners' AND
    (storage.filename(name) = (auth.uid()::text || '.jpg') OR
     storage.filename(name) = (auth.uid()::text || '.jpeg') OR
     storage.filename(name) = (auth.uid()::text || '.png') OR
     storage.filename(name) = (auth.uid()::text || '.webp') OR
     storage.filename(name) = (auth.uid()::text || '.gif'))
  )
  WITH CHECK (
    bucket_id = 'banners' AND
    (storage.filename(name) = (auth.uid()::text || '.jpg') OR
     storage.filename(name) = (auth.uid()::text || '.jpeg') OR
     storage.filename(name) = (auth.uid()::text || '.png') OR
     storage.filename(name) = (auth.uid()::text || '.webp') OR
     storage.filename(name) = (auth.uid()::text || '.gif'))
  );
