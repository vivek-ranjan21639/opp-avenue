
-- Create blog-docs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-docs', 'blog-docs', false);

-- Allow admin to upload/read/delete files in blog-docs bucket
CREATE POLICY "Admin can manage blog-docs"
ON storage.objects
FOR ALL
USING (bucket_id = 'blog-docs' AND auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76')
WITH CHECK (bucket_id = 'blog-docs' AND auth.uid() = '240f1361-1f37-4cae-b12b-8fe51e789a76');
