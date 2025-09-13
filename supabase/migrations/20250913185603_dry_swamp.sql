/*
  # Create chat media storage bucket

  1. Storage
    - Create `chat-media` bucket for storing images and videos
    - Set up proper RLS policies for secure access
    - Allow authenticated users to upload to their own chat folders
    - Allow public read access for chat members

  2. Security
    - Users can only upload to folders they have access to
    - File size and type restrictions handled in frontend
    - Public read access for shared media URLs
*/

-- Create the chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS policies for chat-media bucket
CREATE POLICY "Users can upload media to chats they belong to"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[2] -- Second folder level should be user_id
  AND EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id::text = (storage.foldername(name))[1] -- First folder level should be chat_id
      AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view media from chats they belong to"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1
    FROM public.chat_members cm
    WHERE cm.chat_id::text = (storage.foldername(name))[1] -- First folder level should be chat_id
      AND cm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own uploaded media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-media'
  AND auth.uid()::text = (storage.foldername(name))[2] -- Second folder level should be user_id
);

-- Allow public access for media URLs (since bucket is public)
CREATE POLICY "Public read access for chat media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'chat-media');