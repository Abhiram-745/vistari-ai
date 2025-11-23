-- Fix remaining RLS recursion issues for study groups and members

-- 1) Clean up existing group_members policies that may cause recursion
DROP POLICY IF EXISTS "Admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Members can view group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Members can update own record" ON group_members;

-- 2) Recreate safe, simple group_members policies without self-referencing queries

-- Users can add themselves to a group
CREATE POLICY "Users can join groups"
ON group_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Group creator can see all members; each member can at least see their own row
CREATE POLICY "Members can view group members"
ON group_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = group_members.group_id
    AND study_groups.created_by = auth.uid()
  )
);

-- Group creator can update member records (e.g. roles)
CREATE POLICY "Group creators can manage members"
ON group_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = group_members.group_id
    AND study_groups.created_by = auth.uid()
  )
);

-- Group creator can remove members
CREATE POLICY "Group creators can remove members"
ON group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM study_groups
    WHERE study_groups.id = group_members.group_id
    AND study_groups.created_by = auth.uid()
  )
);

-- 3) Adjust study_groups SELECT policy to avoid referencing group_members
DROP POLICY IF EXISTS "Anyone can view public groups" ON study_groups;

CREATE POLICY "Public and own groups visible"
ON study_groups
FOR SELECT
USING (
  NOT is_private
  OR created_by = auth.uid()
);