-- Add topic and subject columns to session_resources for better filtering
ALTER TABLE session_resources
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Create an index for faster lookups by topic
CREATE INDEX IF NOT EXISTS idx_session_resources_topic_subject 
ON session_resources(timetable_id, topic, subject);