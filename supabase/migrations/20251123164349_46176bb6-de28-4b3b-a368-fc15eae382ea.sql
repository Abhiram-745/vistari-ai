-- Fix search_path security warning for save_timetable_history function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;