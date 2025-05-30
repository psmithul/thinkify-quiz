-- ========================
-- DISABLE RLS TEMPORARILY
-- ========================
-- This makes it easier to set up the initial tables and policies
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quizzes DISABLE ROW LEVEL SECURITY;

-- ========================
-- USERS TABLE SETUP
-- ========================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    bio TEXT,
    profile_image TEXT,
    role TEXT DEFAULT 'user'
);

-- Add missing columns to users table if needed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Ensure role is one of the valid values
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_role'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT check_role CHECK (role IN ('user', 'creator', 'admin'));
    END IF;
END
$$;

-- ========================
-- QUIZZES TABLE SETUP
-- ========================

-- Create quizzes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    category TEXT,
    is_published BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    creator_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- If table already exists, add missing columns
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add index for faster queries on creator_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quizzes_creator_id'
    ) THEN
        CREATE INDEX idx_quizzes_creator_id ON quizzes(creator_id);
    END IF;
END
$$;

-- ========================
-- QUIZ ATTEMPTS TABLE
-- ========================

-- Create quiz_attempts table to track user attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC,
    max_score NUMERIC,
    completed BOOLEAN DEFAULT false,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    UNIQUE(quiz_id, user_id)
);

-- ========================
-- QUIZ QUESTIONS TABLE
-- ========================

-- Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    points INTEGER DEFAULT 1,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quiz_options table
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    position INTEGER NOT NULL
);

-- ========================
-- ROW LEVEL SECURITY SETUP
-- ========================

-- First, remove any existing policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', policy_record.policyname);
    END LOOP;
    
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quizzes'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quizzes', policy_record.policyname);
    END LOOP;

    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_attempts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_attempts', policy_record.policyname);
    END LOOP;

    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_questions'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_questions', policy_record.policyname);
    END LOOP;

    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_options'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_options', policy_record.policyname);
    END LOOP;
END
$$;

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;

-- ========================
-- USER POLICIES
-- ========================

-- Users can view other users' public profiles
CREATE POLICY "Users can view other users profiles" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- Service role can manage all users
CREATE POLICY "Service role can manage all users" 
ON users 
TO service_role
USING (true);

-- Allow public (unauthenticated) access to insert initial user records
CREATE POLICY "Allow public insert for signup" 
ON users FOR INSERT 
TO anon
WITH CHECK (true);

-- ========================
-- QUIZ POLICIES
-- ========================

-- Users can view published quizzes
CREATE POLICY "Users can view published quizzes" 
ON quizzes FOR SELECT 
TO authenticated 
USING (is_published = true);

-- Creators can view their own quizzes
CREATE POLICY "Creators can view their own quizzes" 
ON quizzes FOR SELECT 
TO authenticated 
USING (creator_id = auth.uid());

-- Creators can insert their own quizzes
CREATE POLICY "Creators can insert their own quizzes" 
ON quizzes FOR INSERT 
TO authenticated 
WITH CHECK (creator_id = auth.uid());

-- Creators can update their own quizzes
CREATE POLICY "Creators can update their own quizzes" 
ON quizzes FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid());

-- Creators can delete their own quizzes
CREATE POLICY "Creators can delete their own quizzes" 
ON quizzes FOR DELETE 
TO authenticated 
USING (creator_id = auth.uid());

-- Service role can manage all quizzes
CREATE POLICY "Service role can manage all quizzes" 
ON quizzes 
TO service_role
USING (true);

-- ========================
-- QUIZ ATTEMPTS POLICIES
-- ========================

-- Users can see their own quiz attempts
CREATE POLICY "Users can view their own quiz attempts" 
ON quiz_attempts FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Users can insert their own quiz attempts
CREATE POLICY "Users can insert their own quiz attempts" 
ON quiz_attempts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Users can update their own quiz attempts
CREATE POLICY "Users can update their own quiz attempts" 
ON quiz_attempts FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Creators can view attempts for their quizzes
CREATE POLICY "Creators can view attempts for their quizzes" 
ON quiz_attempts FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = quiz_attempts.quiz_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- ========================
-- QUIZ QUESTIONS POLICIES
-- ========================

-- Everyone can view quiz questions
CREATE POLICY "Everyone can view quiz questions" 
ON quiz_questions FOR SELECT 
TO authenticated 
USING (true);

-- Creators can insert questions for their quizzes
CREATE POLICY "Creators can insert questions for their quizzes" 
ON quiz_questions FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = quiz_questions.quiz_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- Creators can update questions for their quizzes
CREATE POLICY "Creators can update questions for their quizzes" 
ON quiz_questions FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = quiz_questions.quiz_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- Creators can delete questions for their quizzes
CREATE POLICY "Creators can delete questions for their quizzes" 
ON quiz_questions FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = quiz_questions.quiz_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- ========================
-- QUIZ OPTIONS POLICIES
-- ========================

-- Everyone can view quiz options
CREATE POLICY "Everyone can view quiz options" 
ON quiz_options FOR SELECT 
TO authenticated 
USING (true);

-- Creators can insert options for their quiz questions
CREATE POLICY "Creators can insert options for their quiz questions" 
ON quiz_options FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM quiz_questions
        JOIN quizzes ON quiz_questions.quiz_id = quizzes.id
        WHERE quiz_questions.id = quiz_options.question_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- Creators can update options for their quiz questions
CREATE POLICY "Creators can update options for their quiz questions" 
ON quiz_options FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM quiz_questions
        JOIN quizzes ON quiz_questions.quiz_id = quizzes.id
        WHERE quiz_questions.id = quiz_options.question_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- Creators can delete options for their quiz questions
CREATE POLICY "Creators can delete options for their quiz questions" 
ON quiz_options FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM quiz_questions
        JOIN quizzes ON quiz_questions.quiz_id = quizzes.id
        WHERE quiz_questions.id = quiz_options.question_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- ========================
-- MAKE YOURSELF A CREATOR
-- ========================

-- Uncomment and replace 'your-user-id' with your actual user ID
-- UPDATE users SET role = 'creator' WHERE id = 'your-user-id';
-- UPDATE users SET role = 'admin' WHERE id = 'your-user-id'; 