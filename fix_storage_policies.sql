-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can upload their own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for payment screenshots" ON storage.objects;

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Create more permissive policies that actually work
-- Allow authenticated users to upload payment screenshots
CREATE POLICY "Allow authenticated users to upload payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.role() = 'authenticated'
);

-- Allow users to view their own uploaded files
CREATE POLICY "Allow users to view payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND
  auth.role() = 'authenticated'
);

-- Allow admins to view all payment screenshots
CREATE POLICY "Allow admins to view all payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Allow public read access (needed for displaying images in admin panel)
CREATE POLICY "Allow public read access for payment screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-screenshots'); 