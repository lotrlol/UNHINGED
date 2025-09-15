/*
  # Create comprehensive comment system

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `content_id` (uuid, foreign key to content_posts)
      - `user_id` (uuid, foreign key to profiles)
      - `parent_id` (uuid, self-referencing for replies)
      - `content` (text, the comment text)
      - `mentioned_users` (uuid[], array of mentioned user IDs)
      - `like_count` (integer, default 0)
      - `reply_count` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `comment_likes`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to comments)
      - `user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)
    
    - `comment_mentions`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, foreign key to comments)
      - `mentioned_user_id` (uuid, foreign key to profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Allow public read access for comments
    - Add triggers for updating counts

  3. Functions
    - Update comment counts when replies are added/removed
    - Update like counts when likes are added/removed
    - Send notifications for mentions and replies
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  mentioned_users uuid[] DEFAULT '{}',
  like_count integer DEFAULT 0,
  reply_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create comment_mentions table
CREATE TABLE IF NOT EXISTS comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  mentioned_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, mentioned_user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS comments_content_id_idx ON comments(content_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS comment_likes_comment_id_idx ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS comment_likes_user_id_idx ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS comment_mentions_comment_id_idx ON comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS comment_mentions_user_id_idx ON comment_mentions(mentioned_user_id);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON comments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for comment_likes
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own comment likes"
  ON comment_likes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for comment_mentions
CREATE POLICY "Anyone can view comment mentions"
  ON comment_mentions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create mentions in their comments"
  ON comment_mentions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comments 
      WHERE id = comment_id AND user_id = auth.uid()
    )
  );

-- Function to update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments 
    SET like_count = like_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments 
    SET like_count = GREATEST(like_count - 1, 0) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment reply count
CREATE OR REPLACE FUNCTION update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE comments 
    SET reply_count = GREATEST(reply_count - 1, 0) 
    WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update content post comment count
CREATE OR REPLACE FUNCTION update_content_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    -- Only count top-level comments
    UPDATE content_posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NULL THEN
    -- Only count top-level comments
    UPDATE content_posts 
    SET comment_count = GREATEST(comment_count - 1, 0) 
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to handle comment mentions and notifications
CREATE OR REPLACE FUNCTION handle_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id uuid;
  commenter_profile profiles%ROWTYPE;
  content_post content_posts%ROWTYPE;
BEGIN
  -- Get commenter profile
  SELECT * INTO commenter_profile FROM profiles WHERE id = NEW.user_id;
  
  -- Get content post
  SELECT * INTO content_post FROM content_posts WHERE id = NEW.content_id;
  
  -- Process each mentioned user
  FOREACH mentioned_user_id IN ARRAY NEW.mentioned_users
  LOOP
    -- Insert mention record
    INSERT INTO comment_mentions (comment_id, mentioned_user_id)
    VALUES (NEW.id, mentioned_user_id)
    ON CONFLICT (comment_id, mentioned_user_id) DO NOTHING;
    
    -- Create notification for mentioned user
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      data
    ) VALUES (
      mentioned_user_id,
      'mention',
      'You were mentioned in a comment',
      commenter_profile.full_name || ' mentioned you in a comment on "' || content_post.title || '"',
      jsonb_build_object(
        'comment_id', NEW.id,
        'content_id', NEW.content_id,
        'commenter_id', NEW.user_id
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER comment_like_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_like_count();

CREATE TRIGGER comment_reply_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_reply_count();

CREATE TRIGGER content_comment_count_trigger
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_content_comment_count();

CREATE TRIGGER comment_mentions_trigger
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION handle_comment_mentions();

-- Add comment_count column to content_posts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_posts' AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE content_posts ADD COLUMN comment_count integer DEFAULT 0;
    
    -- Update existing posts with current comment counts
    UPDATE content_posts 
    SET comment_count = (
      SELECT COUNT(*) 
      FROM comments 
      WHERE content_id = content_posts.id AND parent_id IS NULL
    );
  END IF;
END $$;

-- Update notifications table to include mention type if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'notifications_type_check' 
    AND 'mention' = ANY(string_to_array(substring(consrc from '\{(.+)\}'), ','))
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type = ANY (ARRAY['application'::text, 'match'::text, 'message'::text, 'project_update'::text, 'system'::text, 'follow'::text, 'mention'::text]));
  END IF;
END $$;