/*
  # Create project views and comments system

  1. New Tables
    - `project_views`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to profiles, nullable for anonymous views)
      - `created_at` (timestamp)
    - `project_comments`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects)
      - `user_id` (uuid, foreign key to profiles)
      - `parent_id` (uuid, foreign key to project_comments, nullable for top-level comments)
      - `content` (text)
      - `like_count` (integer, default 0)
      - `reply_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `project_comment_likes`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to project_comments)
      - `user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)

  2. Add columns to projects table
    - `view_count` (integer, default 0)
    - `comment_count` (integer, default 0)

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to read/write their own data
    - Add policies for public read access where appropriate

  4. Triggers
    - Update project view_count when views are added
    - Update project comment_count when comments are added/removed
    - Update comment like_count when likes are added/removed
    - Update comment reply_count when replies are added/removed
*/

-- Add view_count and comment_count to projects table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE projects ADD COLUMN view_count integer DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE projects ADD COLUMN comment_count integer DEFAULT 0;
  END IF;
END $$;

-- Create project_views table
CREATE TABLE IF NOT EXISTS project_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for project_views
CREATE INDEX IF NOT EXISTS project_views_project_idx ON project_views(project_id);
CREATE INDEX IF NOT EXISTS project_views_user_idx ON project_views(user_id);
CREATE INDEX IF NOT EXISTS project_views_created_at_idx ON project_views(created_at DESC);

-- Enable RLS on project_views
ALTER TABLE project_views ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_views
CREATE POLICY "Anyone can record project views"
  ON project_views
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view project views"
  ON project_views
  FOR SELECT
  TO authenticated
  USING (true);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES project_comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for project_comments
CREATE INDEX IF NOT EXISTS project_comments_project_idx ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS project_comments_user_idx ON project_comments(user_id);
CREATE INDEX IF NOT EXISTS project_comments_parent_idx ON project_comments(parent_id);
CREATE INDEX IF NOT EXISTS project_comments_created_at_idx ON project_comments(created_at DESC);

-- Enable RLS on project_comments
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_comments
CREATE POLICY "Anyone can view project comments"
  ON project_comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can create project comments"
  ON project_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own project comments"
  ON project_comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own project comments"
  ON project_comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create project_comment_likes table
CREATE TABLE IF NOT EXISTS project_comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES project_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create indexes for project_comment_likes
CREATE INDEX IF NOT EXISTS project_comment_likes_comment_idx ON project_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS project_comment_likes_user_idx ON project_comment_likes(user_id);

-- Enable RLS on project_comment_likes
ALTER TABLE project_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_comment_likes
CREATE POLICY "Anyone can view project comment likes"
  ON project_comment_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own project comment likes"
  ON project_comment_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update project view count
CREATE OR REPLACE FUNCTION update_project_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET view_count = view_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update project comment counts
CREATE OR REPLACE FUNCTION update_project_comment_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comment count on project
    UPDATE projects
    SET comment_count = comment_count + 1
    WHERE id = NEW.project_id;
    
    -- If this is a reply, increment reply count on parent comment
    IF NEW.parent_id IS NOT NULL THEN
      UPDATE project_comments
      SET reply_count = reply_count + 1
      WHERE id = NEW.parent_id;
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comment count on project
    UPDATE projects
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.project_id;
    
    -- If this was a reply, decrement reply count on parent comment
    IF OLD.parent_id IS NOT NULL THEN
      UPDATE project_comments
      SET reply_count = GREATEST(reply_count - 1, 0)
      WHERE id = OLD.parent_id;
    END IF;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update project comment like counts
CREATE OR REPLACE FUNCTION update_project_comment_like_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE project_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE project_comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS project_view_count_trigger ON project_views;
CREATE TRIGGER project_view_count_trigger
  AFTER INSERT ON project_views
  FOR EACH ROW
  EXECUTE FUNCTION update_project_view_count();

DROP TRIGGER IF EXISTS project_comment_count_trigger ON project_comments;
CREATE TRIGGER project_comment_count_trigger
  AFTER INSERT OR DELETE ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comment_counts();

DROP TRIGGER IF EXISTS project_comment_like_count_trigger ON project_comment_likes;
CREATE TRIGGER project_comment_like_count_trigger
  AFTER INSERT OR DELETE ON project_comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_project_comment_like_counts();

-- Add updated_at trigger for project_comments
DROP TRIGGER IF EXISTS update_project_comments_updated_at ON project_comments;
CREATE TRIGGER update_project_comments_updated_at
  BEFORE UPDATE ON project_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Initialize view_count and comment_count for existing projects
UPDATE projects 
SET view_count = 0, comment_count = 0 
WHERE view_count IS NULL OR comment_count IS NULL;