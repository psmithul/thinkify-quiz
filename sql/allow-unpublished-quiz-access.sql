-- Allow access to unpublished quizzes via direct links
-- This script modifies RLS policies to allow anyone to access unpublished quizzes if they have the direct link

-- Drop existing restrictive quiz policies
DROP POLICY IF EXISTS "Users can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can view published quizzes and own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;

-- Create new policy that allows access to all quizzes (published and unpublished) via direct links
-- This allows sharing unpublished quizzes via direct links while keeping them hidden from browse pages
CREATE POLICY "Users can access all quizzes via direct links" ON quizzes
  FOR SELECT 
  TO authenticated 
  USING (true); -- Allow access to all quizzes for authenticated users

-- Also allow anonymous users to view quizzes (for public sharing)
CREATE POLICY "Anonymous users can view quizzes via direct links" ON quizzes
  FOR SELECT 
  TO anon
  USING (true);

-- Update quiz questions policy to allow access for all accessible quizzes
DROP POLICY IF EXISTS "Users can view questions for accessible quizzes" ON quiz_questions;
DROP POLICY IF EXISTS "Everyone can view quiz questions" ON quiz_questions;

CREATE POLICY "Users can view questions for any quiz" ON quiz_questions
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Update quiz options policy to allow access for all accessible questions
DROP POLICY IF EXISTS "Users can view options for accessible questions" ON quiz_options;
DROP POLICY IF EXISTS "Everyone can view quiz options" ON quiz_options;

CREATE POLICY "Users can view options for any question" ON quiz_options
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Update quiz attempts policy to allow attempts on any quiz
DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Authenticated users can create quiz attempts" ON quiz_attempts;

CREATE POLICY "Users can create attempts for any quiz" ON quiz_attempts
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Note: The browse/listing pages should filter by is_published = true in the application logic
-- This separation allows:
-- 1. Browse pages to show only published quizzes
-- 2. Direct links to work for unpublished quizzes
-- 3. Creators to share unpublished quizzes for testing/preview

-- Grant necessary permissions for anonymous access
GRANT SELECT ON quizzes TO anon;
GRANT SELECT ON quiz_questions TO anon;
GRANT SELECT ON quiz_options TO anon;
GRANT SELECT ON users TO anon; -- For creator information

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema'; 