-- Fix RLS Policies for Quiz Creation, Company Management, and Recruiter Management
-- This script addresses permission issues preventing quiz creation, company editing, and recruiter management

-- 1. Fix Quiz-related policies
-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only see published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only creators can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only creators can update their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Only creators can delete their own quizzes" ON quizzes;

-- Create more permissive quiz policies
CREATE POLICY "Anyone can view published quizzes" ON quizzes
  FOR SELECT USING (is_published = true OR auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Creators and admins can create quizzes" ON quizzes
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('creator', 'admin'))
  );

CREATE POLICY "Creators can update their quizzes, admins can update any" ON quizzes
  FOR UPDATE USING (
    auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Creators can delete their quizzes, admins can delete any" ON quizzes
  FOR DELETE USING (
    auth.uid() = creator_id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 2. Fix Question policies
DROP POLICY IF EXISTS "Users can view questions for published quizzes" ON questions;
DROP POLICY IF EXISTS "Only quiz creators can manage questions" ON questions;

CREATE POLICY "Users can view questions for accessible quizzes" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND (quizzes.is_published = true OR quizzes.creator_id = auth.uid())
    ) OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Quiz creators and admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND (quizzes.creator_id = auth.uid())
    ) OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 3. Fix Quiz Attempts policies
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can create quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own quiz attempts" ON quiz_attempts;

CREATE POLICY "Users can view their own attempts, admins can view all" ON quiz_attempts
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin') OR
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_attempts.quiz_id 
      AND quizzes.creator_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" ON quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Fix Companies policies
DROP POLICY IF EXISTS "Everyone can view companies" ON companies;
DROP POLICY IF EXISTS "Only admins can manage companies" ON companies;

-- Allow everyone to view companies (needed for company shortlist)
CREATE POLICY "Everyone can view companies" ON companies
  FOR SELECT USING (true);

-- Allow admins to manage companies
CREATE POLICY "Admins can manage companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 5. Fix Recruiters policies (update existing ones)
DROP POLICY IF EXISTS "Users can view active recruiters" ON recruiters;
DROP POLICY IF EXISTS "Admins can manage recruiters" ON recruiters;

-- Everyone can view active recruiters
CREATE POLICY "Everyone can view active recruiters" ON recruiters
  FOR SELECT USING (is_active = true);

-- Admins can manage all recruiters
CREATE POLICY "Admins can manage recruiters" ON recruiters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 6. Fix Users table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;

-- Allow users to view public profiles and their own
CREATE POLICY "Users can view public profiles and their own" ON users
  FOR SELECT USING (
    id = auth.uid() OR 
    role IN ('creator', 'admin') OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Allow users to update their own profile, admins can update any
CREATE POLICY "Users can update their own profile, admins can update any" ON users
  FOR UPDATE USING (
    id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Allow admins to insert users (for admin creation)
CREATE POLICY "Admins can create users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- 7. Ensure proper permissions for assignments and results
DROP POLICY IF EXISTS "Users can view their assignments" ON assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON assignments;

CREATE POLICY "Users can view their assignments and creators can view their quiz assignments" ON assignments
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = assignments.quiz_id 
      AND quizzes.creator_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins and creators can manage assignments" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = assignments.quiz_id 
      AND quizzes.creator_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Fix results/quiz_attempts relationship
DROP POLICY IF EXISTS "Users can view their results" ON results;
DROP POLICY IF EXISTS "Users can create results" ON results;

CREATE POLICY "Users can view their results, creators can view results for their quizzes" ON results
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = results.quiz_id 
      AND quizzes.creator_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Authenticated users can create results" ON results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Add helpful functions for debugging
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_creator_published ON quizzes(creator_id, is_published);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_results_user_quiz ON results(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema'; 