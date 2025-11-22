-- Create table for topic reflections with image support
CREATE TABLE IF NOT EXISTS public.topic_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  session_date TEXT NOT NULL,
  session_index INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  reflection_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.topic_reflections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reflections"
  ON public.topic_reflections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reflections"
  ON public.topic_reflections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
  ON public.topic_reflections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections"
  ON public.topic_reflections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_topic_reflections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_topic_reflections_updated_at
  BEFORE UPDATE ON public.topic_reflections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_topic_reflections_updated_at();

-- Create table for AI insights
CREATE TABLE IF NOT EXISTS public.study_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  insights_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, timetable_id)
);

-- Enable RLS
ALTER TABLE public.study_insights ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own insights"
  ON public.study_insights
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own insights"
  ON public.study_insights
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.study_insights
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.study_insights
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_topic_reflections_user_timetable ON public.topic_reflections(user_id, timetable_id);
CREATE INDEX IF NOT EXISTS idx_study_insights_user_timetable ON public.study_insights(user_id, timetable_id);