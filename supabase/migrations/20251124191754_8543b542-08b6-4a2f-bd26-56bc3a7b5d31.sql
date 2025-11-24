-- Enable realtime for events table so changes are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;