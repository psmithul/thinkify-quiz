-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for payment screenshots bucket
CREATE POLICY "Users can upload their own payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create policy to allow public access to screenshots (needed for admin verification)
CREATE POLICY "Public read access for payment screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-screenshots'); 