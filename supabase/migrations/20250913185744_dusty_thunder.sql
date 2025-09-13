/*
  # Create chat-media storage bucket

  1. Storage
    - Create `chat-media` bucket for storing chat images and videos
    - Set up proper RLS policies for secure file access
    - Allow authenticated users to upload files to their own chat folders
    - Allow public read access for shared media URLs

  2. Security
    - Users can only upload to chats they are members of
    - Files are organized by chat_id/user_id/filename structure
    - Public read access for media sharing
*/

-- Create the chat-media bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload chat media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[2] -- user_id is second folder
  AND EXISTS (
    SELECT 1 FROM chat_members cm
    WHERE cm.chat_id::text = (storage.foldername(name))[1] -- chat_id is first folder
    AND cm.user_id = auth.uid()
  )
);

-- Allow public read access for media sharing
CREATE POLICY "Public can view chat media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-media');

-- Allow users to delete their own uploaded media
CREATE POLICY "Users can delete own chat media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);