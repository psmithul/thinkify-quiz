-- ADMIN POLICIES FOR QUIZ PLATFORM
-- This script adds policies to allow admin users to access all data
-- Run this script after running complete_setup.sql

-- ========================
-- ADMIN POLICIES FOR QUIZ_ATTEMPTS
-- ========================

-- Admins can view all quiz attempts
CREATE POLICY "Admins can view all quiz attempts" 
ON quiz_attempts FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can insert quiz attempts (for testing/management)
CREATE POLICY "Admins can insert any quiz attempts" 
ON quiz_attempts FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can update any quiz attempts
CREATE POLICY "Admins can update any quiz attempts" 
ON quiz_attempts FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can delete any quiz attempts
CREATE POLICY "Admins can delete any quiz attempts" 
ON quiz_attempts FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ========================
-- ADMIN POLICIES FOR QUIZZES (ADDITIONAL)
-- ========================

-- Admins can view all quizzes (published and unpublished)
CREATE POLICY "Admins can view all quizzes" 
ON quizzes FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can update any quiz
CREATE POLICY "Admins can update any quiz" 
ON quizzes FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can delete any quiz
CREATE POLICY "Admins can delete any quiz" 
ON quizzes FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ========================
-- ADMIN POLICIES FOR QUIZ_QUESTIONS
-- ========================

-- Admins can insert questions for any quiz
CREATE POLICY "Admins can insert questions for any quiz" 
ON quiz_questions FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can update any quiz questions
CREATE POLICY "Admins can update any quiz questions" 
ON quiz_questions FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can delete any quiz questions
CREATE POLICY "Admins can delete any quiz questions" 
ON quiz_questions FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ========================
-- ADMIN POLICIES FOR QUIZ_OPTIONS
-- ========================

-- Admins can insert options for any quiz questions
CREATE POLICY "Admins can insert options for any quiz questions" 
ON quiz_options FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can update any quiz options
CREATE POLICY "Admins can update any quiz options" 
ON quiz_options FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Admins can delete any quiz options
CREATE POLICY "Admins can delete any quiz options" 
ON quiz_options FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- ========================
-- VERIFICATION QUERY
-- ========================

-- You can run this query to verify the policies were created:
-- SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE '%admin%' ORDER BY tablename, policyname; 