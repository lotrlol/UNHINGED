/*
  # Create User Follow System

  1. New Tables
    - `user_follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles)
      - `following_id` (uuid, references profiles)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_follows` table
    - Add policies for users to manage their own follows
    - Add policies to view public follow relationships

  3. Indexes
    - Index on follower_id for efficient queries
    - Index on following_id for efficient queries
    - Unique constraint on follower_id + following_id to prevent duplicates

  4. Triggers
    - Notification trigger when someone follows a user
*/

-- Create user_follows table
CREATE TABLE IF NOT EXISTS user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent self-follows and duplicate follows
  CONSTRAINT user_follows_no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT user_follows_unique UNIQUE (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS user_follows_follower_idx ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS user_follows_following_idx ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS user_follows_created_at_idx ON user_follows(created_at DESC);

-- RLS Policies
CREATE POLICY "Users can follow others"
  ON user_follows
  FOR INSERT
  TO authenticated
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can unfollow others"
  ON user_follows
  FOR DELETE
  TO authenticated
  USING (follower_id = auth.uid());

CREATE POLICY "Anyone can view follow relationships"
  ON user_follows
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to create notification when someone follows a user
CREATE OR REPLACE FUNCTION notify_user_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the user being followed
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    data
  )
  SELECT 
    NEW.following_id,
    'follow',
    'New Follower!',
    follower.full_name || ' (@' || follower.username || ') started following you',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follow_id', NEW.id
    )
  FROM profiles follower
  WHERE follower.id = NEW.follower_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for follow notifications
DROP TRIGGER IF EXISTS user_follow_notification_trigger ON user_follows;
CREATE TRIGGER user_follow_notification_trigger
  AFTER INSERT ON user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_follow();

-- Update notifications table to include 'follow' type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'notifications_type_check'
    AND check_clause LIKE '%follow%'
  ) THEN
    ALTER TABLE notifications 
    DROP CONSTRAINT IF EXISTS notifications_type_check;
    
    ALTER TABLE notifications 
    ADD CONSTRAINT notifications_type_check 
    CHECK (type = ANY (ARRAY['application'::text, 'match'::text, 'message'::text, 'project_update'::text, 'system'::text, 'follow'::text]));
  END IF;
END $$;