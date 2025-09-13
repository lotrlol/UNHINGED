/*
  # Content System Implementation

  1. New Tables
    - `content_posts`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, foreign key to profiles)
      - `title` (text)
      - `description` (text)
      - `content_type` (enum: video, audio, image, article)
      - `platform` (text, optional - YouTube, Spotify, Instagram, etc.)
      - `external_url` (text, optional - link to external content)
      - `thumbnail_url` (text, optional)
      - `tags` (text array)
      - `is_featured` (boolean)
      - `view_count` (integer)
      - `like_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `content_likes`
      - `id` (uuid, primary key)
      - `content_id` (uuid, foreign key to content_posts)
      - `user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)

    - `content_views`
      - `id` (uuid, primary key)
      - `content_id` (uuid, foreign key to content_posts)
      - `user_id` (uuid, foreign key to profiles, nullable for anonymous views)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for content creation, viewing, and interaction
    - Only creators can edit their own content
    - Public can view non-flagged content
    - Users can like/view content

  3. Indexes
    - Performance indexes for common queries
    - Content discovery and filtering
*/

-- Create content_type enum
CREATE TYPE content_type_enum AS ENUM ('video', 'audio', 'image', 'article');

-- Create content_posts table
CREATE TABLE IF NOT EXISTS content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type content_type_enum NOT NULL,
  platform text,
  external_url text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create content_likes table
CREATE TABLE IF NOT EXISTS content_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(content_id, user_id)
);

-- Create content_views table
CREATE TABLE IF NOT EXISTS content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS content_posts_creator_idx ON content_posts(creator_id);
CREATE INDEX IF NOT EXISTS content_posts_created_at_idx ON content_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS content_posts_content_type_idx ON content_posts(content_type);
CREATE INDEX IF NOT EXISTS content_posts_tags_idx ON content_posts USING gin(tags);
CREATE INDEX IF NOT EXISTS content_posts_featured_idx ON content_posts(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS content_likes_content_idx ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS content_likes_user_idx ON content_likes(user_id);

CREATE INDEX IF NOT EXISTS content_views_content_idx ON content_views(content_id);
CREATE INDEX IF NOT EXISTS content_views_created_at_idx ON content_views(created_at DESC);

-- Enable RLS
ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_views ENABLE ROW LEVEL SECURITY;

-- Content Posts Policies
CREATE POLICY "Anyone can view published content"
  ON content_posts
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = content_posts.creator_id 
      AND profiles.flagged = false
    )
  );

CREATE POLICY "Users can create their own content"
  ON content_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update their own content"
  ON content_posts
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can delete their own content"
  ON content_posts
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Content Likes Policies
CREATE POLICY "Anyone can view likes"
  ON content_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON content_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Content Views Policies
CREATE POLICY "Users can view content views"
  ON content_views
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can record views"
  ON content_views
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create view for content with creator info
CREATE OR REPLACE VIEW content_with_creators AS
SELECT 
  cp.*,
  p.username as creator_username,
  p.full_name as creator_name,
  p.avatar_url as creator_avatar,
  p.roles as creator_roles,
  p.is_verified as creator_verified
FROM content_posts cp
JOIN profiles p ON cp.creator_id = p.id
WHERE p.flagged = false;

-- Function to update like count
CREATE OR REPLACE FUNCTION update_content_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for like count updates
DROP TRIGGER IF EXISTS content_like_count_trigger ON content_likes;
CREATE TRIGGER content_like_count_trigger
  AFTER INSERT OR DELETE ON content_likes
  FOR EACH ROW EXECUTE FUNCTION update_content_like_count();

-- Function to update view count
CREATE OR REPLACE FUNCTION update_content_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE content_posts 
  SET view_count = view_count + 1 
  WHERE id = NEW.content_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view count updates
DROP TRIGGER IF EXISTS content_view_count_trigger ON content_views;
CREATE TRIGGER content_view_count_trigger
  AFTER INSERT ON content_views
  FOR EACH ROW EXECUTE FUNCTION update_content_view_count();

-- Insert some sample content for testing
INSERT INTO content_posts (creator_id, title, description, content_type, platform, external_url, thumbnail_url, tags) 
SELECT 
  p.id,
  'Welcome to My Creative Journey',
  'Just launched my new portfolio showcasing my latest work. Excited to collaborate with fellow creators!',
  'article',
  'Portfolio',
  'https://example.com/portfolio',
  'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
  ARRAY['portfolio', 'creative', 'showcase']
FROM profiles p 
WHERE p.flagged = false 
LIMIT 1
ON CONFLICT DO NOTHING;