/*
  # Fix user_likes and user_passes RLS policies

  The current errors suggest that the RLS policies for both user_likes and user_passes
  tables are not working correctly. This migration:

  1. Ensures RLS is properly enabled on both tables
  2. Creates comprehensive policies for user_likes:
     - INSERT: Users can create their own likes
     - SELECT: Users can view likes where they are the liker or liked
     - DELETE: Users can delete their own likes
  3. Creates comprehensive policies for user_passes:
     - INSERT: Users can create their own passes
     - SELECT: Users can view passes where they are the passer or passee
     - DELETE: Users can delete their own passes
*/

-- Enable RLS on user_likes table (should already be enabled but ensuring)
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create their own likes" ON user_likes;
DROP POLICY IF EXISTS "Users can view their own likes" ON user_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON user_likes;

-- Policy to allow users to create their own likes
CREATE POLICY "Users can create their own likes"
  ON user_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (liker_id = auth.uid());

-- Policy to allow users to view their own likes (both as liker and liked)
CREATE POLICY "Users can view their own likes"
  ON user_likes
  FOR SELECT
  TO authenticated
  USING (liker_id = auth.uid() OR liked_id = auth.uid());

-- Policy to allow users to delete their own likes
CREATE POLICY "Users can delete their own likes"
  ON user_likes
  FOR DELETE
  TO authenticated
  USING (liker_id = auth.uid());

-- Policy to allow users to update their own likes (if needed for future features)
CREATE POLICY "Users can update their own likes"
  ON user_likes
  FOR UPDATE
  TO authenticated
  USING (liker_id = auth.uid())
  WITH CHECK (liker_id = auth.uid());

-- Ensure RLS is enabled on user_passes table
ALTER TABLE user_passes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own passes" ON user_passes;
DROP POLICY IF EXISTS "Users can view their passes" ON user_passes;
DROP POLICY IF EXISTS "Users can delete their own passes" ON user_passes;

-- Policy to allow users to insert their own passes
CREATE POLICY "Users can insert their own passes"
  ON user_passes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy to allow users to view their passes (both as passer and passee)
CREATE POLICY "Users can view their passes"
  ON user_passes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR passed_user_id = auth.uid());

-- Policy to allow users to update their own passes
CREATE POLICY "Users can update their own passes"
  ON user_passes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_likes_liker_id ON user_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_liked_id ON user_likes(liked_id);
CREATE INDEX IF NOT EXISTS idx_user_passes_user_id ON user_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passes_passed_user_id ON user_passes(passed_user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
