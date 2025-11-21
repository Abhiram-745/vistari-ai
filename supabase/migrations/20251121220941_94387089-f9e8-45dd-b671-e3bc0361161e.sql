-- Add day_time_slots column to study_preferences table
ALTER TABLE public.study_preferences 
ADD COLUMN day_time_slots jsonb DEFAULT '[
  {"day": "monday", "startTime": "09:00", "endTime": "17:00", "enabled": true},
  {"day": "tuesday", "startTime": "09:00", "endTime": "17:00", "enabled": true},
  {"day": "wednesday", "startTime": "09:00", "endTime": "17:00", "enabled": true},
  {"day": "thursday", "startTime": "09:00", "endTime": "17:00", "enabled": true},
  {"day": "friday", "startTime": "09:00", "endTime": "17:00", "enabled": true},
  {"day": "saturday", "startTime": "09:00", "endTime": "17:00", "enabled": true},
  {"day": "sunday", "startTime": "09:00", "endTime": "17:00", "enabled": true}
]'::jsonb;