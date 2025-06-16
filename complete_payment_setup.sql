-- Complete Payment Verification System Setup
-- Run this script in your Supabase SQL Editor to set up the entire payment system

-- 1. First, create the payment_verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    quiz_id UUID REFERENCES quizzes(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 30.00,
    payment_screenshot_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_verifications_user_quiz ON payment_verifications(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON payment_verifications(verification_status);

-- 3. Enable RLS on payment_verifications
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;

-- 5. Create RLS policies for payment_verifications table
CREATE POLICY "Users can view own payment verifications" ON payment_verifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payment verifications" ON payment_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update payment verifications" ON payment_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all payment verifications" ON payment_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- 6. Update the payments table with verification fields (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_notes TEXT;
    END IF;
END $$;

-- 7. Storage bucket setup
-- First, drop existing problematic storage policies
DROP POLICY IF EXISTS "Users can upload their own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all payment screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access for payment screenshots" ON storage.objects;

-- 8. Create the storage bucket
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

-- 9. Create storage policies that work
CREATE POLICY "Allow authenticated users to upload payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow users to view payment screenshots" ON storage.objects
FOR SELECT USING (
  bucket_id = 'payment-screenshots' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access for payment screenshots" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-screenshots');

-- 10. Create a function to handle payment verification updates
CREATE OR REPLACE FUNCTION handle_payment_verification_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the updated_at timestamp
    NEW.updated_at = NOW();
    
    -- If payment is approved, you could add additional logic here
    -- For example, creating a record in a separate payments table
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for payment verification updates
DROP TRIGGER IF EXISTS payment_verification_update_trigger ON payment_verifications;
CREATE TRIGGER payment_verification_update_trigger
    BEFORE UPDATE ON payment_verifications
    FOR EACH ROW
    EXECUTE FUNCTION handle_payment_verification_update();

-- 12. Insert some test data (optional - remove this section if you don't want test data)
-- INSERT INTO payment_verifications (user_id, quiz_id, amount, verification_status, payment_screenshot_url)
-- SELECT 
--     (SELECT id FROM users LIMIT 1), 
--     (SELECT id FROM quizzes LIMIT 1), 
--     30.00, 
--     'pending',
--     'https://example.com/test-screenshot.jpg'
-- WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM quizzes);

-- Success message
SELECT 'Payment verification system setup completed successfully!' as message; 