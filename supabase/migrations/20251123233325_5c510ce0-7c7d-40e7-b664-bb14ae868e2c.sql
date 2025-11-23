-- Extend group_challenges table to support weekly/monthly challenges
ALTER TABLE group_challenges
ADD COLUMN IF NOT EXISTS weekly_hours_goal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_hours_goal INTEGER DEFAULT 0;

-- Create table to track challenge completions
CREATE TABLE IF NOT EXISTS group_challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly')),
  completed_date DATE NOT NULL,
  hours_achieved NUMERIC NOT NULL,
  goal_hours INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, challenge_type, completed_date)
);

-- Enable RLS
ALTER TABLE group_challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies for challenge completions
CREATE POLICY "Group members can view challenge completions"
ON group_challenge_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = group_challenge_completions.group_id
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "System can insert challenge completions"
ON group_challenge_completions FOR INSERT
WITH CHECK (true);

-- Create table for group achievements
CREATE TABLE IF NOT EXISTS group_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE group_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "Anyone can view group achievements"
ON group_achievements FOR SELECT
USING (true);

-- Create table to track which groups earned which achievements
CREATE TABLE IF NOT EXISTS group_achievement_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES group_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, achievement_id)
);

-- Enable RLS
ALTER TABLE group_achievement_unlocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievement unlocks
CREATE POLICY "Anyone can view achievement unlocks"
ON group_achievement_unlocks FOR SELECT
USING (true);

CREATE POLICY "System can insert achievement unlocks"
ON group_achievement_unlocks FOR INSERT
WITH CHECK (true);

-- Insert default group achievements
INSERT INTO group_achievements (achievement_key, name, description, icon, tier, requirement_type, requirement_value) VALUES
('daily_streak_3', 'Getting Started', 'Complete daily goal 3 days in a row', '🔥', 'bronze', 'daily_streak', 3),
('daily_streak_7', 'Week Warrior', 'Complete daily goal 7 days in a row', '⚡', 'silver', 'daily_streak', 7),
('daily_streak_30', 'Monthly Master', 'Complete daily goal 30 days in a row', '💎', 'gold', 'daily_streak', 30),
('weekly_complete_4', 'Consistent Crew', 'Complete weekly goal 4 weeks in a row', '🎯', 'silver', 'weekly_streak', 4),
('weekly_complete_12', 'Quarter Champions', 'Complete weekly goal 12 weeks in a row', '👑', 'gold', 'weekly_streak', 12),
('monthly_complete_3', 'Dedication Dynasty', 'Complete monthly goal 3 months in a row', '🏆', 'gold', 'monthly_streak', 3),
('total_hours_100', 'Century Club', 'Reach 100 total study hours as a group', '💯', 'bronze', 'total_hours', 100),
('total_hours_500', 'Elite Scholars', 'Reach 500 total study hours as a group', '🌟', 'silver', 'total_hours', 500),
('total_hours_1000', 'Legendary Learners', 'Reach 1000 total study hours as a group', '✨', 'gold', 'total_hours', 1000),
('total_hours_5000', 'Academic Gods', 'Reach 5000 total study hours as a group', '🚀', 'platinum', 'total_hours', 5000)
ON CONFLICT (achievement_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_completions_group_date 
ON group_challenge_completions(group_id, challenge_type, completed_date DESC);

CREATE INDEX IF NOT EXISTS idx_achievement_unlocks_group 
ON group_achievement_unlocks(group_id, unlocked_at DESC);