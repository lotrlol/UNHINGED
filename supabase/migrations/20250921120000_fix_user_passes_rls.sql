/*
  # Fix user_passes RLS policies

  The user_passes table is missing proper RLS policies, causing 403 errors when
  authenticated users try to insert pass records during discovery swiping.

  This migration:
  1. Enables RLS on user_passes table
  2. Creates policies allowing authenticated users to:
     - Insert their own passes (user_id = auth.uid())
     - View their own passes (user_id = auth.uid() OR passed_user_id = auth.uid())
     - Delete their own passes (user_id = auth.uid())
*/

-- Enable RLS on user_passes table
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

-- Policy to allow users to delete their own passes
CREATE POLICY "Users can delete their own passes"
  ON user_passes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_user_passes_user_id ON user_passes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passes_passed_user_id ON user_passes(passed_user_id);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
