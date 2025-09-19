-- Create or replace the function to get user content with stats
CREATE OR REPLACE FUNCTION public.get_user_content_with_stats(user_id uuid)
RETURNS TABLE (
  id uuid,
  creator_id uuid,
  title text,
  description text,
  content_type text,
  media_urls text[],
  thumbnail_url text,
  external_url text,
  tags text[],
  is_featured boolean,
  is_nsfw boolean,
  created_at timestamptz,
  updated_at timestamptz,
  creator_username text,
  creator_avatar text,
  creator_roles text[],
  like_count bigint,
  comment_count bigint,
  view_count bigint
) 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  SELECT 
    c.id,
    c.creator_id,
    c.title,
    c.description,
    c.content_type,
    c.media_urls,
    c.thumbnail_url,
    c.external_url,
    c.tags,
    c.is_featured,
    c.is_nsfw,
    c.created_at,
    c.updated_at,
    p.username as creator_username,
    p.avatar_url as creator_avatar,
    p.roles as creator_roles,
    (SELECT COUNT(*) FROM content_likes cl WHERE cl.content_id = c.id) as like_count,
    (SELECT COUNT(*) FROM comments cm WHERE cm.content_id = c.id) as comment_count,
    (SELECT COUNT(*) FROM content_views cv WHERE cv.content_id = c.id) as view_count
  FROM 
    content_posts c
  JOIN 
    profiles p ON c.creator_id = p.id
  WHERE 
    c.creator_id = user_id
    AND p.flagged = false
  ORDER BY 
    c.created_at DESC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_content_with_stats TO authenticated;

-- Create a policy to allow users to see their own content
CREATE POLICY "Users can see their own content"
ON content_posts
FOR SELECT
TO authenticated
USING (creator_id = auth.uid());

-- Create a policy to allow public read access to non-flagged content
CREATE POLICY "Public content is viewable by everyone"
ON content_posts
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = content_posts.creator_id 
    AND p.flagged = false
  )
);
