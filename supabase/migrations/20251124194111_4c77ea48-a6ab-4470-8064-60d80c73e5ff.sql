-- Add timing fields for school study preferences
ALTER TABLE study_preferences 
ADD COLUMN IF NOT EXISTS before_school_start TIME,
ADD COLUMN IF NOT EXISTS before_school_end TIME,
ADD COLUMN IF NOT EXISTS lunch_start TIME,
ADD COLUMN IF NOT EXISTS lunch_end TIME;