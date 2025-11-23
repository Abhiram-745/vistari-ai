-- Allow group members to view timetables that were shared to their groups
CREATE POLICY "Group members can view shared timetables"
ON timetables
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM shared_timetables st
    JOIN group_members gm ON gm.group_id = st.group_id
    WHERE st.timetable_id = timetables.id
      AND gm.user_id = auth.uid()
  )
);

-- Relax study_groups SELECT policy so users can look up groups by join code
DROP POLICY IF EXISTS "Public and own groups visible" ON study_groups;

CREATE POLICY "Anyone can view groups"
ON study_groups
FOR SELECT
USING (true);