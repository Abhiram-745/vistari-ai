-- Fix infinite recursion in group_members RLS policies
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;

-- Allow users to join groups (insert themselves)
CREATE POLICY "Users can join groups"
ON group_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage members (update/delete)
-- Check admin status from study_groups.created_by to avoid recursion
CREATE POLICY "Group creators can manage members"
ON group_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = group_members.group_id
    AND study_groups.created_by = auth.uid()
  )
);

-- Allow members to update their own record (e.g., last_active)
CREATE POLICY "Members can update own record"
ON group_members
FOR UPDATE
USING (auth.uid() = user_id);