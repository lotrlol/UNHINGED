/*
  # Fix Content Images and RLS Policies

  1. Storage Buckets
    - Create content-media bucket for user uploads
    - Create covers bucket for project covers
    - Set up proper RLS policies for public access

  2. Content Posts Updates
    - Ensure proper RLS policies for content viewing
    - Add missing indexes for performance

  3. Storage Policies
    - Allow public read access to uploaded content
    - Allow authenticated users to upload their own content
    - Proper file size and type restrictions
*/

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('content-media', 'content-media', true, 52428800, ARRAY['image/*', 'video/*']),
  ('covers', 'covers', true, 10485760, ARRAY['image/*']),
  ('chat-media', 'chat-media', true, 52428800, ARRAY['image/*', 'video/*'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for content-media bucket
DROP POLICY IF EXISTS "Public can view content media" ON storage.objects;
CREATE POLICY "Public can view content media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'content-media');

DROP POLICY IF EXISTS "Users can upload content media" ON storage.objects;
CREATE POLICY "Users can upload content media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own content media" ON storage.objects;
CREATE POLICY "Users can update own content media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own content media" ON storage.objects;
CREATE POLICY "Users can delete own content media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'content-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for covers bucket
DROP POLICY IF EXISTS "Public can view covers" ON storage.objects;
CREATE POLICY "Public can view covers"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'covers');

DROP POLICY IF EXISTS "Users can upload covers" ON storage.objects;
CREATE POLICY "Users can upload covers"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update own covers" ON storage.objects;
CREATE POLICY "Users can update own covers"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own covers" ON storage.objects;
CREATE POLICY "Users can delete own covers"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for chat-media bucket
DROP POLICY IF EXISTS "Chat members can view chat media" ON storage.objects;
CREATE POLICY "Chat members can view chat media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-media' AND
    EXISTS (
      SELECT 1 FROM chat_members cm
      JOIN chats c ON c.id = cm.chat_id
      WHERE cm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
    )
  );

DROP POLICY IF EXISTS "Users can upload chat media" ON storage.objects;
CREATE POLICY "Users can upload chat media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media' AND
    EXISTS (
      SELECT 1 FROM chat_members cm
      JOIN chats c ON c.id = cm.chat_id
      WHERE cm.user_id = auth.uid()
      AND (storage.foldername(name))[1] = c.id::text
    )
  );

-- Update content_posts RLS policies to ensure proper access
DROP POLICY IF EXISTS "Anyone can view published content" ON content_posts;
CREATE POLICY "Anyone can view published content"
  ON content_posts FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = content_posts.creator_id
      AND profiles.flagged = false
    )
  );

-- Ensure content_with_creators view has proper access
DROP POLICY IF EXISTS "Public can view content with creators" ON content_with_creators;
-- Views don't have RLS policies, but we ensure the underlying tables do

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_posts_thumbnail_url ON content_posts(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_posts_external_url ON content_posts(external_url) WHERE external_url IS NOT NULL;

-- Update the content_with_creators view to ensure it includes all necessary fields
DROP VIEW IF EXISTS content_with_creators;
CREATE VIEW content_with_creators AS
SELECT 
  cp.*,
  p.username as creator_username,
  p.full_name as creator_name,
  p.avatar_url as creator_avatar,
  p.roles as creator_roles,
  p.is_verified as creator_verified
FROM content_posts cp
JOIN profiles p ON p.id = cp.creator_id
WHERE p.flagged = false;