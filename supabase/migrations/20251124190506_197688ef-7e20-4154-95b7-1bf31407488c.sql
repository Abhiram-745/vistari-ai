-- Enable leaderboard functionality by allowing authenticated users to view study data

-- Fix study_streaks policies
DROP POLICY IF EXISTS "Users can manage own streaks" ON public.study_streaks;
DROP POLICY IF EXISTS "Users can view all study streaks for leaderboard" ON public.study_streaks;
DROP POLICY IF EXISTS "Users can manage own study streaks" ON public.study_streaks;

CREATE POLICY "Users can view all study streaks for leaderboard"
ON public.study_streaks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage own study streaks"
ON public.study_streaks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix group_members policies
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Authenticated users can view all group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON public.group_members;

CREATE POLICY "Authenticated users can view all group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Group creators can manage members"
ON public.group_members
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.study_groups
  WHERE study_groups.id = group_members.group_id
  AND study_groups.created_by = auth.uid()
));

CREATE POLICY "Group creators can remove members"
ON public.group_members
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.study_groups
  WHERE study_groups.id = group_members.group_id
  AND study_groups.created_by = auth.uid()
));

-- Fix study_sessions policies
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Authenticated users can view all sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.study_sessions;

CREATE POLICY "Authenticated users can view all sessions"
ON public.study_sessions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage their own sessions"
ON public.study_sessions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);