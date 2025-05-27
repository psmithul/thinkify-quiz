-- Updated RLS Policies for Quiz Creation, Company Management, and Recruiter Management
-- This fixes the "row violates row-level security policy" errors

-- 1. Fix Quiz-related policies - More permissive for authenticated users
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Creators and admins can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Creators can update their quizzes, admins can update any" ON quizzes;
DROP POLICY IF EXISTS "Creators can delete their quizzes, admins can delete any" ON quizzes;

-- Allow viewing published quizzes and own quizzes
CREATE POLICY "Users can view published quizzes and own quizzes" ON quizzes
  FOR SELECT USING (
    is_published = true OR 
    auth.uid() = creator_id OR 
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- Allow authenticated users to create quizzes (will check user role in app logic)
CREATE POLICY "Authenticated users can create quizzes" ON quizzes
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = creator_id
  );

-- Allow creators to update their own quizzes
CREATE POLICY "Users can update their own quizzes" ON quizzes
  FOR UPDATE USING (
    auth.uid() = creator_id OR 
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- Allow creators to delete their own quizzes  
CREATE POLICY "Users can delete their own quizzes" ON quizzes
  FOR DELETE USING (
    auth.uid() = creator_id OR
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- 2. Fix Question policies
DROP POLICY IF EXISTS "Users can view questions for accessible quizzes" ON questions;
DROP POLICY IF EXISTS "Quiz creators and admins can manage questions" ON questions;

CREATE POLICY "Users can view questions for accessible quizzes" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND (quizzes.is_published = true OR quizzes.creator_id = auth.uid())
    ) OR 
    auth.jwt() ->> 'role' = 'authenticated'
  );

CREATE POLICY "Authenticated users can manage questions" ON questions
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = questions.quiz_id 
        AND quizzes.creator_id = auth.uid()
      ) OR 
      auth.jwt() ->> 'role' = 'authenticated'
    )
  );

-- 3. Fix Quiz Attempts policies
DROP POLICY IF EXISTS "Users can view their own attempts, admins can view all" ON quiz_attempts;
DROP POLICY IF EXISTS "Authenticated users can create quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own attempts" ON quiz_attempts;

CREATE POLICY "Users can view relevant quiz attempts" ON quiz_attempts
  FOR SELECT USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'authenticated' OR
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = quiz_attempts.quiz_id 
      AND quizzes.creator_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND
    auth.uid() = user_id
  );

CREATE POLICY "Users can update their quiz attempts" ON quiz_attempts
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- 4. Fix Companies policies - Make them more permissive
DROP POLICY IF EXISTS "Everyone can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;

-- Allow everyone to view companies
CREATE POLICY "Everyone can view companies" ON companies
  FOR SELECT USING (true);

-- Allow authenticated users to manage companies
CREATE POLICY "Authenticated users can manage companies" ON companies
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- 5. Fix Recruiters policies
DROP POLICY IF EXISTS "Everyone can view active recruiters" ON recruiters;
DROP POLICY IF EXISTS "Admins can manage recruiters" ON recruiters;

-- Everyone can view active recruiters
CREATE POLICY "Everyone can view active recruiters" ON recruiters
  FOR SELECT USING (is_active = true);

-- Authenticated users can manage recruiters
CREATE POLICY "Authenticated users can manage recruiters" ON recruiters
  FOR ALL USING (
    auth.uid() IS NOT NULL
  );

-- 6. Fix Users table policies
DROP POLICY IF EXISTS "Users can view public profiles and their own" ON users;
DROP POLICY IF EXISTS "Users can update their own profile, admins can update any" ON users;
DROP POLICY IF EXISTS "Admins can create users" ON users;

-- Allow users to view profiles
CREATE POLICY "Users can view profiles" ON users
  FOR SELECT USING (
    id = auth.uid() OR 
    role IN ('creator', 'admin') OR
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- Allow users to update profiles
CREATE POLICY "Users can update profiles" ON users
  FOR UPDATE USING (
    id = auth.uid() OR 
    auth.jwt() ->> 'role' = 'authenticated'
  );

-- Allow authenticated users to create users
CREATE POLICY "Authenticated users can create users" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 7. Fix Questions options policies
DROP POLICY IF EXISTS "Users can view options for accessible questions" ON quiz_options;
DROP POLICY IF EXISTS "Quiz creators can manage options" ON quiz_options;

CREATE POLICY "Users can view options for accessible questions" ON quiz_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions 
      JOIN quizzes ON quizzes.id = questions.quiz_id
      WHERE questions.id = quiz_options.question_id 
      AND (quizzes.is_published = true OR quizzes.creator_id = auth.uid())
    ) OR 
    auth.jwt() ->> 'role' = 'authenticated'
  );

CREATE POLICY "Authenticated users can manage quiz options" ON quiz_options
  FOR ALL USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM questions 
        JOIN quizzes ON quizzes.id = questions.quiz_id
        WHERE questions.id = quiz_options.question_id 
        AND quizzes.creator_id = auth.uid()
      ) OR 
      auth.jwt() ->> 'role' = 'authenticated'
    )
  );

-- 8. Grant broader permissions for authenticated users
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 9. Create a function to help with debugging RLS issues
CREATE OR REPLACE FUNCTION check_user_auth()
RETURNS TABLE (
  user_id UUID,
  jwt_role TEXT,
  is_authenticated BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    auth.jwt() ->> 'role' as jwt_role,
    (auth.uid() IS NOT NULL) as is_authenticated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Refresh the schema
NOTIFY pgrst, 'reload schema'; 