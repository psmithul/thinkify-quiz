-- 🚨 EMERGENCY RLS FIX FOR PAYMENT SYSTEM
-- This script creates bypass policies for the service role to prevent RLS blocking payment operations

-- Grant full access to service role for payment_verifications table
DROP POLICY IF EXISTS "service_role_bypass_payment_verifications" ON payment_verifications;
CREATE POLICY "service_role_bypass_payment_verifications" ON payment_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant full access to service role for payment_verifications table (alternative approach)
GRANT ALL ON payment_verifications TO service_role;

-- Allow service role to bypass RLS entirely on this table
ALTER TABLE payment_verifications FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_full_access" ON payment_verifications;
CREATE POLICY "service_role_full_access" ON payment_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a permissive policy for authenticated users as well (backup)
DROP POLICY IF EXISTS "authenticated_payment_access" ON payment_verifications;
CREATE POLICY "authenticated_payment_access" ON payment_verifications
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Grant necessary permissions to service role for users table
GRANT SELECT ON users TO service_role;

-- Create service role policy for users table if needed
DROP POLICY IF EXISTS "service_role_users_access" ON users;
CREATE POLICY "service_role_users_access" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create service role policy for quizzes table if needed
DROP POLICY IF EXISTS "service_role_quizzes_access" ON quizzes;
CREATE POLICY "service_role_quizzes_access" ON quizzes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Verification query
SELECT 
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'payment_verifications';

-- Success message
SELECT 'RLS policies updated successfully for service role' as status; 