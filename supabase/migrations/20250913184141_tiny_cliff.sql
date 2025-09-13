/*
  # Fix matches table to include chat_id and creator_id columns

  1. Add missing columns to matches table
  2. Create chats table if not exists
  3. Create chat_members table if not exists
  4. Create messages table if not exists
  5. Update existing matches to have proper creator_id and create chats
*/

-- Add missing columns to matches table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'matches' AND column_name = 'chat_id'
  ) THEN
    ALTER TABLE matches ADD COLUMN chat_id uuid REFERENCES chats(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create chats table if not exists
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create chat_members table if not exists
CREATE TABLE IF NOT EXISTS chat_members (
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

-- Create messages table if not exists
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chats_project_idx ON chats(project_id);
CREATE INDEX IF NOT EXISTS chats_group_idx ON chats(group_id);
CREATE INDEX IF NOT EXISTS chat_members_chat_idx ON chat_members(chat_id);
CREATE INDEX IF NOT EXISTS chat_members_user_idx ON chat_members(user_id);
CREATE INDEX IF NOT EXISTS messages_chat_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);

-- RLS Policies for chats
DROP POLICY IF EXISTS "Users can view chats they're members of" ON chats;
CREATE POLICY "Users can view chats they're members of"
  ON chats FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create chats" ON chats;
CREATE POLICY "Users can create chats"
  ON chats FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for chat_members
DROP POLICY IF EXISTS "Chat members can view membership" ON chat_members;
CREATE POLICY "Chat members can view membership"
  ON chat_members FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join chats" ON chat_members;
CREATE POLICY "Users can join chats"
  ON chat_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can leave chats" ON chat_members;
CREATE POLICY "Users can leave chats"
  ON chat_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for messages
DROP POLICY IF EXISTS "Chat members can view messages" ON messages;
CREATE POLICY "Chat members can view messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Chat members can send messages" ON messages;
CREATE POLICY "Chat members can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    chat_id IN (
      SELECT chat_id FROM chat_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
CREATE POLICY "Users can delete their own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- Update existing matches to have proper creator_id from their projects
UPDATE matches 
SET creator_id = projects.creator_id
FROM projects 
WHERE matches.project_id = projects.id 
AND matches.creator_id IS NULL;

-- Create chats for existing matches that don't have them
DO $$
DECLARE
  match_record RECORD;
  new_chat_id uuid;
BEGIN
  FOR match_record IN 
    SELECT id, project_id, creator_id, user_id 
    FROM matches 
    WHERE chat_id IS NULL AND creator_id IS NOT NULL
  LOOP
    -- Create chat
    INSERT INTO chats (project_id) 
    VALUES (match_record.project_id) 
    RETURNING id INTO new_chat_id;
    
    -- Update match with chat_id
    UPDATE matches SET chat_id = new_chat_id WHERE id = match_record.id;
    
    -- Add both users to chat
    INSERT INTO chat_members (chat_id, user_id) 
    VALUES 
      (new_chat_id, match_record.creator_id),
      (new_chat_id, match_record.user_id)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;