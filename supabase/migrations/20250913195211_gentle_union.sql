/*
  # User Discovery and Likes System

  1. New Tables
    - `user_likes`
      - `id` (uuid, primary key)
      - `liker_id` (uuid, references profiles)
      - `liked_id` (uuid, references profiles)
      - `created_at` (timestamp)
    - `user_matches`
      - `id` (uuid, primary key)
      - `user1_id` (uuid, references profiles)
      - `user2_id` (uuid, references profiles)
      - `chat_id` (uuid, references chats)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own likes
    - Add policies for users to view their matches

  3. Functions
    - Function to check for mutual likes and create matches
    - Trigger to automatically create matches when mutual like occurs
*/

-- User likes table for swiping functionality
CREATE TABLE IF NOT EXISTS user_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(liker_id, liked_id),
  CHECK (liker_id != liked_id)
);

-- User matches table for mutual likes
CREATE TABLE IF NOT EXISTS user_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id uuid REFERENCES chats(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS user_likes_liker_idx ON user_likes(liker_id);
CREATE INDEX IF NOT EXISTS user_likes_liked_idx ON user_likes(liked_id);
CREATE INDEX IF NOT EXISTS user_likes_created_at_idx ON user_likes(created_at DESC);
CREATE INDEX IF NOT EXISTS user_matches_user1_idx ON user_matches(user1_id);
CREATE INDEX IF NOT EXISTS user_matches_user2_idx ON user_matches(user2_id);
CREATE INDEX IF NOT EXISTS user_matches_created_at_idx ON user_matches(created_at DESC);

-- Enable RLS
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_likes
CREATE POLICY "Users can create their own likes"
  ON user_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (liker_id = auth.uid());

CREATE POLICY "Users can view their own likes"
  ON user_likes
  FOR SELECT
  TO authenticated
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

CREATE POLICY "Users can delete their own likes"
  ON user_likes
  FOR DELETE
  TO authenticated
  USING (liker_id = auth.uid());

-- RLS Policies for user_matches
CREATE POLICY "Users can view their own matches"
  ON user_matches
  FOR SELECT
  TO authenticated
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "System can create matches"
  ON user_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create a match when mutual like occurs
CREATE OR REPLACE FUNCTION create_user_match()
RETURNS TRIGGER AS $$
DECLARE
  mutual_like_exists boolean;
  new_chat_id uuid;
  user1_id uuid;
  user2_id uuid;
BEGIN
  -- Check if there's a mutual like
  SELECT EXISTS(
    SELECT 1 FROM user_likes 
    WHERE liker_id = NEW.liked_id 
    AND liked_id = NEW.liker_id
  ) INTO mutual_like_exists;

  -- If mutual like exists, create a match
  IF mutual_like_exists THEN
    -- Ensure consistent ordering (smaller UUID first)
    IF NEW.liker_id < NEW.liked_id THEN
      user1_id := NEW.liker_id;
      user2_id := NEW.liked_id;
    ELSE
      user1_id := NEW.liked_id;
      user2_id := NEW.liker_id;
    END IF;

    -- Check if match already exists
    IF NOT EXISTS(
      SELECT 1 FROM user_matches 
      WHERE user1_id = user1_id AND user2_id = user2_id
    ) THEN
      -- Create a chat for the match
      INSERT INTO chats (project_id, group_id) 
      VALUES (NULL, NULL) 
      RETURNING id INTO new_chat_id;

      -- Add both users to the chat
      INSERT INTO chat_members (chat_id, user_id) VALUES
        (new_chat_id, user1_id),
        (new_chat_id, user2_id);

      -- Create the match
      INSERT INTO user_matches (user1_id, user2_id, chat_id)
      VALUES (user1_id, user2_id, new_chat_id);

      -- Create notifications for both users
      INSERT INTO notifications (user_id, type, title, content, data) VALUES
        (user1_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', 
         jsonb_build_object('match_user_id', user2_id, 'chat_id', new_chat_id)),
        (user2_id, 'match', 'New Match!', 'You have a new match! Start chatting now.', 
         jsonb_build_object('match_user_id', user1_id, 'chat_id', new_chat_id));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create matches on mutual likes
DROP TRIGGER IF EXISTS create_user_match_trigger ON user_likes;
CREATE TRIGGER create_user_match_trigger
  AFTER INSERT ON user_likes
  FOR EACH ROW
  EXECUTE FUNCTION create_user_match();