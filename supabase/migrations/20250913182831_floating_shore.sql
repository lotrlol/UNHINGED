/*
  # Fix matches and chats schema

  1. New Tables
    - Update `matches` table with missing columns
    - Ensure `chats`, `chat_members`, and `messages` tables exist with proper structure
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    
  3. Foreign Keys
    - Add proper foreign key constraints with correct names
    - Ensure relationships between matches, chats, and profiles
*/

-- First, let's add the missing columns to matches table
DO $$ 
BEGIN
  -- Add creator_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN creator_id uuid;
  END IF;

  -- Add chat_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN chat_id uuid;
  END IF;
END $$;

-- Ensure chats table exists with proper structure
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  group_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Ensure chat_members table exists
CREATE TABLE IF NOT EXISTS chat_members (
  chat_id uuid NOT NULL,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

-- Ensure messages table exists
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid,
  sender_id uuid,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add/recreate foreign key constraints for matches with explicit names
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_creator_id_fkey;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_user_id_fkey;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_project_id_fkey;
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_chat_id_fkey;

ALTER TABLE matches ADD CONSTRAINT matches_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT matches_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT matches_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE matches ADD CONSTRAINT matches_chat_id_fkey 
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL;

-- Add foreign keys for chats
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_project_id_fkey;
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_group_id_fkey;
ALTER TABLE chats ADD CONSTRAINT chats_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE chats ADD CONSTRAINT chats_group_id_fkey 
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Add foreign keys for chat_members
ALTER TABLE chat_members DROP CONSTRAINT IF EXISTS chat_members_chat_id_fkey;
ALTER TABLE chat_members DROP CONSTRAINT IF EXISTS chat_members_user_id_fkey;
ALTER TABLE chat_members ADD CONSTRAINT chat_members_chat_id_fkey 
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
ALTER TABLE chat_members ADD CONSTRAINT chat_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign keys for messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_chat_id_fkey 
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Enable RLS on all tables
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for matches
DROP POLICY IF EXISTS "Users can read their matches" ON matches;
CREATE POLICY "Users can read their matches" ON matches 
  FOR SELECT TO authenticated 
  USING (creator_id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert matches" ON matches;
CREATE POLICY "Users can insert matches" ON matches 
  FOR INSERT TO authenticated 
  WITH CHECK (creator_id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their matches" ON matches;
CREATE POLICY "Users can update their matches" ON matches 
  FOR UPDATE TO authenticated 
  USING (creator_id = auth.uid() OR user_id = auth.uid());

-- RLS policies for chats
DROP POLICY IF EXISTS "Chat members can view chats" ON chats;
CREATE POLICY "Chat members can view chats" ON chats 
  FOR SELECT TO authenticated 
  USING (id IN (
    SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create chats" ON chats;
CREATE POLICY "Users can create chats" ON chats 
  FOR INSERT TO authenticated 
  WITH CHECK (true);

-- RLS policies for chat_members
DROP POLICY IF EXISTS "Chat members can view membership" ON chat_members;
CREATE POLICY "Chat members can view membership" ON chat_members 
  FOR SELECT TO authenticated 
  USING (chat_id IN (
    SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can join chats" ON chat_members;
CREATE POLICY "Users can join chats" ON chat_members 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave chats" ON chat_members;
CREATE POLICY "Users can leave chats" ON chat_members 
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid());

-- RLS policies for messages
DROP POLICY IF EXISTS "Chat members can view messages" ON messages;
CREATE POLICY "Chat members can view messages" ON messages 
  FOR SELECT TO authenticated 
  USING (chat_id IN (
    SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Chat members can send messages" ON messages;
CREATE POLICY "Chat members can send messages" ON messages 
  FOR INSERT TO authenticated 
  WITH CHECK (
    sender_id = auth.uid() AND 
    chat_id IN (SELECT chat_id FROM chat_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages" ON messages 
  FOR DELETE TO authenticated 
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages 
  FOR UPDATE TO authenticated 
  USING (sender_id = auth.uid());