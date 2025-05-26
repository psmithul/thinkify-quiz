-- Add timer functionality to quizzes
-- This file should be run in Supabase SQL Editor

-- Add time_limit_minutes column to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT NULL;

-- Add timer-related columns to quiz_attempts table (if it exists)
-- If quiz_attempts table doesn't exist, we'll create it
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    time_taken_seconds INTEGER,
    score NUMERIC,
    max_score NUMERIC,
    is_completed BOOLEAN DEFAULT false,
    answers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add time_taken_seconds column if the table already exists
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_started_at ON quiz_attempts(started_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_time_limit ON quizzes(time_limit_minutes);

-- Add RLS policies for quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'quiz_attempts'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON quiz_attempts', policy_record.policyname);
    END LOOP;
END
$$;

-- Add RLS policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts" 
ON quiz_attempts FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own quiz attempts" 
ON quiz_attempts FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz attempts" 
ON quiz_attempts FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all quiz attempts" 
ON quiz_attempts 
TO service_role
USING (true);

-- Allow creators to view attempts on their quizzes
CREATE POLICY "Creators can view attempts on their quizzes" 
ON quiz_attempts FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    WHERE quizzes.id = quiz_attempts.quiz_id 
    AND quizzes.creator_id = auth.uid()
  )
);

-- Add helpful comments
COMMENT ON COLUMN quizzes.time_limit_minutes IS 'Time limit for the quiz in minutes (NULL means no time limit)';
COMMENT ON COLUMN quiz_attempts.time_taken_seconds IS 'Actual time taken to complete the quiz in seconds';
COMMENT ON COLUMN quiz_attempts.started_at IS 'When the quiz attempt was started';
COMMENT ON COLUMN quiz_attempts.completed_at IS 'When the quiz attempt was completed';

-- Add some sample time limits to existing quizzes (optional)
-- UPDATE quizzes SET time_limit_minutes = 15 WHERE title LIKE '%JavaScript%';
-- UPDATE quizzes SET time_limit_minutes = 20 WHERE title LIKE '%React%';
-- UPDATE quizzes SET time_limit_minutes = 10 WHERE title LIKE '%CSS%'; 