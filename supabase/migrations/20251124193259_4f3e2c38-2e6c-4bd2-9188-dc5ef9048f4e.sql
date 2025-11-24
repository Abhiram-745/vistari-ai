-- Add school study time preferences to study_preferences table
ALTER TABLE study_preferences 
ADD COLUMN study_before_school BOOLEAN DEFAULT false,
ADD COLUMN study_during_lunch BOOLEAN DEFAULT false,
ADD COLUMN study_during_free_periods BOOLEAN DEFAULT false;