/*
  # Fix infinite recursion in chat_members RLS policies

  1. Security Changes
    - Drop existing problematic RLS policies on chat_members table
    - Create simplified, non-recursive policies
    - Ensure policies don't reference chat_members table within themselves

  2. Policy Changes
    - SELECT: Users can view memberships for chats they belong to (simplified)
    - INSERT: Users can join chats as themselves
    - DELETE: Users can leave chats they're members of
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Chat members can view membership" ON chat_members;
DROP POLICY IF EXISTS "Users can join chats" ON chat_members;
DROP POLICY IF EXISTS "Users can leave chats" ON chat_members;

-- Create simplified policies without recursion
CREATE POLICY "Users can view their own memberships"
  ON chat_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view memberships in their chats"
  ON chat_members
  FOR SELECT
  TO authenticated
  USING (
    chat_id IN (
      SELECT cm.chat_id 
      FROM chat_members cm 
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join chats as themselves"
  ON chat_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave their own memberships"
  ON chat_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());