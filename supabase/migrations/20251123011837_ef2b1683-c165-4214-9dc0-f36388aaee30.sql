-- Enable realtime for shared_timetables table
ALTER TABLE shared_timetables REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE shared_timetables;