-- Add school schedule fields to study_preferences table
ALTER TABLE public.study_preferences
ADD COLUMN IF NOT EXISTS school_start_time time without time zone,
ADD COLUMN IF NOT EXISTS school_end_time time without time zone;