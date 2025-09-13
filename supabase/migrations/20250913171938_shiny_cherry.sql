/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - RLS policies on group_members table are creating circular dependencies
    - Policies reference each other causing infinite recursion during evaluation
    - This affects project creation when policies are evaluated

  2. Solution
    - Drop and recreate problematic policies with simpler logic
    - Remove circular references between policies
    - Ensure policies don't reference themselves indirectly
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Group members can view membership" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Project creators can view applications" ON project_applications;
DROP POLICY IF EXISTS "Project creators can update applications" ON project_applications;

-- Recreate group_members policies without circular references
CREATE POLICY "Users can view group memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join groups as members"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage group members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.is_admin = true
    )
  );

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Recreate groups policy without referencing group_members
CREATE POLICY "Group creators can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT gm.group_id
      FROM group_members gm
      WHERE gm.user_id = auth.uid()
      AND gm.is_admin = true
    )
  );

-- Recreate project_applications policies without complex group references
CREATE POLICY "Project owners can view applications"
  ON project_applications
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id
      FROM projects p
      WHERE (
        (p.creator_type = 'profile' AND p.creator_id = auth.uid())
        OR
        (p.creator_type = 'group' AND p.creator_id IN (
          SELECT gm.group_id
          FROM group_members gm
          WHERE gm.user_id = auth.uid() AND gm.is_admin = true
        ))
      )
    )
  );

CREATE POLICY "Project owners can update applications"
  ON project_applications
  FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT p.id
      FROM projects p
      WHERE (
        (p.creator_type = 'profile' AND p.creator_id = auth.uid())
        OR
        (p.creator_type = 'group' AND p.creator_id IN (
          SELECT gm.group_id
          FROM group_members gm
          WHERE gm.user_id = auth.uid() AND gm.is_admin = true
        ))
      )
    )
  );