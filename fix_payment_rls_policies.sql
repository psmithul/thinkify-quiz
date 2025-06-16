-- Fix RLS policies for payment_verifications table
-- Run this SQL in your Supabase SQL Editor to fix access issues

-- First, ensure RLS is enabled
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins full access" ON payment_verifications;

-- Create comprehensive admin policy (allows all operations for admins)
CREATE POLICY "Admins full access" ON payment_verifications
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create user policies for regular users
CREATE POLICY "Users can view own payment verifications" ON payment_verifications
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment verifications" ON payment_verifications
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON payment_verifications TO authenticated;
GRANT UPDATE, DELETE ON payment_verifications TO authenticated;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'payment_verifications';

-- Check if your user has admin role (replace with your user ID if needed)
SELECT id, email, role 
FROM users 
WHERE id = auth.uid();

-- If you need to make yourself an admin, uncomment and run this:
-- UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com'; 