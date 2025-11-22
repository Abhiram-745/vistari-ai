-- Add session_resources table to store resources for each timetable session
CREATE TABLE IF NOT EXISTS public.session_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  timetable_id UUID NOT NULL,
  session_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  type TEXT NOT NULL DEFAULT 'link',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_resources ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own session resources"
ON public.session_resources
FOR ALL
USING (auth.uid() = user_id);

-- Add foreign key constraint
ALTER TABLE public.session_resources
ADD CONSTRAINT session_resources_timetable_id_fkey
FOREIGN KEY (timetable_id)
REFERENCES public.timetables(id)
ON DELETE CASCADE;

-- Create trigger for updated_at
CREATE TRIGGER update_session_resources_updated_at
BEFORE UPDATE ON public.session_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();