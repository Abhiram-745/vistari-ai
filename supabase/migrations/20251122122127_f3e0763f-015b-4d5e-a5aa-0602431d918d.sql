-- Remove difficulty and confidence_level from topics table as they're no longer needed
-- The new flow focuses on topic names from checklists and user-selected focus topics

ALTER TABLE public.topics 
DROP COLUMN IF EXISTS difficulty,
DROP COLUMN IF EXISTS confidence_level;