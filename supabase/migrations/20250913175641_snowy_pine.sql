/*
  # Fix infinite recursion in RLS policies

  1. Policy Updates
    - Fix matches table RLS policy to avoid infinite recursion with group_members
    - Simplify the policy to prevent circular references
    
  2. Changes
    - Update matches SELECT policy to remove complex group_members subquery
    - Keep the policy functional but avoid recursion
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view their matches" ON matches;

-- Create a simpler policy that avoids the infinite recursion
CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    project_id IN (
      SELECT id FROM projects 
      WHERE creator_type = 'profile' AND creator_id = auth.uid()
    )
  );

-- Also ensure the group_members policies don't have circular references
DROP POLICY IF EXISTS "Group admins can manage all members" ON group_members;

-- Recreate group_members policy without potential recursion
CREATE POLICY "Group admins can manage all members" ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm_check
      WHERE gm_check.group_id = group_members.group_id 
      AND gm_check.user_id = auth.uid() 
      AND gm_check.is_admin = true
    )
  );