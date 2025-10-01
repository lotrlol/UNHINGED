-- Create a dedicated bucket for user link images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-links',
  'user-links',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create a function to check if a link image belongs to the current user
CREATE OR REPLACE FUNCTION is_link_image_owner(user_id uuid, path text)
RETURNS boolean AS $$
BEGIN
  -- Check if the path starts with the user ID (e.g., user_id/link_id/...)
  RETURN path LIKE (user_id::text || '/%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies for user-links bucket if they exist
DROP POLICY IF EXISTS "Users can view their own link images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own link images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own link images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own link images" ON storage.objects;

-- Create policies for user-links bucket
-- Allow public read access to link images
CREATE POLICY "Public Access to Link Images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-links');

-- Allow authenticated users to upload their own link images
CREATE POLICY "Users can upload their own link images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-links' AND
    is_link_image_owner(auth.uid(), name)
  );

-- Allow authenticated users to update their own link images
CREATE POLICY "Users can update their own link images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-links' AND
    is_link_image_owner(auth.uid(), name)
  )
  WITH CHECK (
    bucket_id = 'user-links' AND
    is_link_image_owner(auth.uid(), name)
  );

-- Allow authenticated users to delete their own link images
CREATE POLICY "Users can delete their own link images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-links' AND
    is_link_image_owner(auth.uid(), name)
  );
