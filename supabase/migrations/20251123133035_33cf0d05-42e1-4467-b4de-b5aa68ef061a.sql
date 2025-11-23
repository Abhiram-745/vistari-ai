-- Create topic_progress table to track user-specific topic progress
CREATE TABLE public.topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  mastery_level TEXT NOT NULL DEFAULT 'not_started',
  successful_sessions_count INTEGER NOT NULL DEFAULT 0,
  total_sessions_count INTEGER NOT NULL DEFAULT 0,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- Enable RLS
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for topic_progress
CREATE POLICY "Users can manage their own topic progress"
ON public.topic_progress
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_topic_progress_user_id ON public.topic_progress(user_id);
CREATE INDEX idx_topic_progress_next_review ON public.topic_progress(user_id, next_review_date) WHERE next_review_date IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_topic_progress_updated_at
BEFORE UPDATE ON public.topic_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.topic_progress IS 'Tracks user progress and mastery for individual topics';
COMMENT ON COLUMN public.topic_progress.mastery_level IS 'Values: not_started, beginner, intermediate, advanced, mastery';
COMMENT ON COLUMN public.topic_progress.progress_percentage IS 'Overall completion percentage (0-100)';
COMMENT ON COLUMN public.topic_progress.next_review_date IS 'Calculated date for spaced repetition review';