-- Add recurrence support to events table
ALTER TABLE public.events
ADD COLUMN recurrence_rule TEXT,
ADD COLUMN recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN parent_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
ADD COLUMN is_recurring BOOLEAN DEFAULT false;

-- Add index for better query performance on recurring events
CREATE INDEX idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX idx_events_is_recurring ON public.events(is_recurring);