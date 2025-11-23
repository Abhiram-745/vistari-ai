-- Create timetable_history table for version control
CREATE TABLE public.timetable_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timetable_id UUID NOT NULL REFERENCES public.timetables(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule JSONB NOT NULL,
  subjects JSONB,
  test_dates JSONB,
  topics JSONB,
  preferences JSONB,
  change_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timetable_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own timetable history"
  ON public.timetable_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create history entries for own timetables"
  ON public.timetable_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_timetable_history_timetable_id ON public.timetable_history(timetable_id);
CREATE INDEX idx_timetable_history_user_id ON public.timetable_history(user_id);

-- Create function to automatically save timetable history on updates
CREATE OR REPLACE FUNCTION save_timetable_history()
RETURNS TRIGGER AS $$
DECLARE
  latest_version INTEGER;
BEGIN
  -- Get the latest version number for this timetable
  SELECT COALESCE(MAX(version_number), 0) INTO latest_version
  FROM public.timetable_history
  WHERE timetable_id = NEW.id;

  -- Insert a new history entry
  INSERT INTO public.timetable_history (
    timetable_id,
    user_id,
    version_number,
    name,
    start_date,
    end_date,
    schedule,
    subjects,
    test_dates,
    topics,
    preferences,
    change_description
  ) VALUES (
    NEW.id,
    NEW.user_id,
    latest_version + 1,
    NEW.name,
    NEW.start_date,
    NEW.end_date,
    NEW.schedule,
    NEW.subjects,
    NEW.test_dates,
    NEW.topics,
    NEW.preferences,
    'Timetable updated'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to save history on timetable updates
CREATE TRIGGER trigger_save_timetable_history
  AFTER UPDATE ON public.timetables
  FOR EACH ROW
  EXECUTE FUNCTION save_timetable_history();