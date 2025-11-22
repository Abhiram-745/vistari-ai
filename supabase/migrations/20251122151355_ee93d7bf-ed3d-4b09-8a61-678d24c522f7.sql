-- Create storage bucket for study reflection images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study-images', 'study-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for study-images bucket
CREATE POLICY "Users can view study images"
ON storage.objects FOR SELECT
USING (bucket_id = 'study-images');

CREATE POLICY "Authenticated users can upload study images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'study-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own study images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'study-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own study images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'study-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);