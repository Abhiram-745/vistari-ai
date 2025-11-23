-- Study Session Recording Tables
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('revision', 'homework', 'test-prep', 'break')),
  subject TEXT NOT NULL,
  topic TEXT,
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  planned_duration_minutes INTEGER NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'paused', 'completed', 'skipped')),
  pause_time INTEGER DEFAULT 0,
  notes TEXT,
  focus_score INTEGER CHECK (focus_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_planned_minutes INTEGER NOT NULL DEFAULT 0,
  total_actual_minutes INTEGER NOT NULL DEFAULT 0,
  sessions_completed INTEGER NOT NULL DEFAULT 0,
  sessions_skipped INTEGER NOT NULL DEFAULT 0,
  average_focus_score DECIMAL(3,2),
  subjects_studied JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- RLS for study_sessions
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON public.study_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS for session_analytics
ALTER TABLE public.session_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analytics"
  ON public.session_analytics
  FOR ALL
  USING (auth.uid() = user_id);

-- Achievements & Badges Tables
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('streak', 'study_time', 'completion', 'social', 'mastery')),
  icon TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Add XP and level to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS xp_to_next_level INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- RLS for achievements (public read)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON public.achievements
  FOR SELECT
  USING (true);

-- RLS for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Study Groups Tables
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT false,
  join_code TEXT UNIQUE,
  max_members INTEGER DEFAULT 10,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'resource', 'timetable_share')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shared_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.study_groups(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pdf', 'link', 'video', 'note')),
  url TEXT NOT NULL,
  file_path TEXT,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for study_groups
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public groups"
  ON public.study_groups
  FOR SELECT
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = study_groups.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create groups"
  ON public.study_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their groups"
  ON public.study_groups
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = study_groups.id AND user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete their groups"
  ON public.study_groups
  FOR DELETE
  USING (created_by = auth.uid());

-- RLS for group_members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON public.group_members
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
  ));

CREATE POLICY "Users can join groups"
  ON public.group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage members"
  ON public.group_members
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin'
  ));

-- RLS for group_messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group messages"
  ON public.group_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_messages.group_id AND user_id = auth.uid()
  ));

CREATE POLICY "Members can send messages"
  ON public.group_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages"
  ON public.group_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.group_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for shared_timetables
ALTER TABLE public.shared_timetables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public shared timetables"
  ON public.shared_timetables
  FOR SELECT
  USING (is_public OR auth.uid() = shared_by OR EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = shared_timetables.group_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can share own timetables"
  ON public.shared_timetables
  FOR INSERT
  WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can manage own shares"
  ON public.shared_timetables
  FOR ALL
  USING (auth.uid() = shared_by);

-- RLS for group_resources
ALTER TABLE public.group_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group resources"
  ON public.group_resources
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = group_resources.group_id AND user_id = auth.uid()
  ));

CREATE POLICY "Members can upload resources"
  ON public.group_resources
  FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_resources.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own resources"
  ON public.group_resources
  FOR ALL
  USING (auth.uid() = uploaded_by);

-- Enable Realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Seed initial achievements
INSERT INTO public.achievements (name, description, category, icon, tier, criteria_type, criteria_value, xp_reward) VALUES
  ('First Steps', 'Complete your first study session', 'streak', '🎯', 'bronze', 'streak_days', 1, 10),
  ('Getting Started', 'Maintain a 3-day study streak', 'streak', '🔥', 'bronze', 'streak_days', 3, 25),
  ('Week Warrior', 'Study for 7 consecutive days', 'streak', '⚔️', 'silver', 'streak_days', 7, 50),
  ('Consistency King', 'Achieve a 14-day streak', 'streak', '👑', 'gold', 'streak_days', 14, 100),
  ('Study Legend', 'Reach a 30-day streak', 'streak', '🏆', 'platinum', 'streak_days', 30, 250),
  ('Night Owl', 'Complete 5 study sessions after 10pm', 'study_time', '🦉', 'silver', 'late_sessions', 5, 50),
  ('Early Bird', 'Complete 5 study sessions before 7am', 'study_time', '🐦', 'silver', 'early_sessions', 5, 50),
  ('Marathon Runner', 'Study for 10 hours in one day', 'study_time', '🏃', 'gold', 'daily_hours', 600, 100),
  ('Century Club', 'Reach 100 total study hours', 'study_time', '💯', 'gold', 'total_hours', 6000, 200),
  ('Perfect Week', 'Complete 100% of planned sessions in a week', 'completion', '✨', 'gold', 'perfect_weeks', 1, 150),
  ('Subject Master', 'Complete all topics in one subject', 'mastery', '🎓', 'gold', 'subjects_mastered', 1, 200),
  ('Exam Ready', 'Complete all test prep sessions', 'completion', '📚', 'gold', 'test_prep_complete', 1, 300),
  ('Social Butterfly', 'Add 5 friends', 'social', '🦋', 'silver', 'friends_added', 5, 50),
  ('Top 10', 'Reach top 10 on the leaderboard', 'social', '🌟', 'gold', 'leaderboard_rank', 10, 100),
  ('Study Squad', 'Join your first study group', 'social', '👥', 'bronze', 'groups_joined', 1, 75)
ON CONFLICT DO NOTHING;