-- Create test_scores table for storing test results and AI analysis
CREATE TABLE IF NOT EXISTS public.test_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_date_id UUID NOT NULL REFERENCES public.test_dates(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  test_type TEXT NOT NULL,
  test_date DATE NOT NULL,
  total_marks INTEGER NOT NULL,
  marks_obtained INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  questions_correct JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions_incorrect JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_analysis JSONB,
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on test_scores
ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;

-- Create policies for test_scores
CREATE POLICY "Users can manage their own test scores"
ON public.test_scores
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_test_scores_updated_at
  BEFORE UPDATE ON public.test_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_test_scores_user_id ON public.test_scores(user_id);
CREATE INDEX idx_test_scores_test_date_id ON public.test_scores(test_date_id);