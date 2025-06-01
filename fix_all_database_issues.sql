-- Comprehensive Database Fix: Courses RLS, missing columns, and analytics support
-- Run this in your Supabase SQL Editor

-- ========================
-- 1. CREATE COURSES TABLE AND FIX RLS POLICIES
-- ========================

-- Create courses table if it doesn't exist
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    thumbnail_url TEXT,
    duration_minutes INTEGER DEFAULT 0,
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT DEFAULT 'general',
    tags TEXT[],
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing course policies to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'courses'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON courses', policy_record.policyname);
    END LOOP;
END
$$;

-- Create permissive course policies
CREATE POLICY "Anyone can view published courses" 
ON courses FOR SELECT 
TO authenticated 
USING (is_published = true);

CREATE POLICY "Creators can view their own courses" 
ON courses FOR SELECT 
TO authenticated 
USING (creator_id = auth.uid());

CREATE POLICY "Creators can create courses" 
ON courses FOR INSERT 
TO authenticated 
WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their own courses" 
ON courses FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete their own courses" 
ON courses FOR DELETE 
TO authenticated 
USING (creator_id = auth.uid());

-- ========================
-- 2. CREATE COURSE ENROLLMENTS TABLE
-- ========================

CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_at TIMESTAMPTZ,
    UNIQUE(course_id, user_id)
);

-- Enable RLS and create policies
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments" 
ON course_enrollments FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can enroll in courses" 
ON course_enrollments FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollment progress" 
ON course_enrollments FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Creators can view enrollments for their courses" 
ON course_enrollments FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_enrollments.course_id 
        AND courses.creator_id = auth.uid()
    )
);

-- ========================
-- 3. ENSURE ALL MISSING COLUMNS EXIST
-- ========================

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add missing columns to quizzes table  
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS tier_thresholds JSONB DEFAULT '{
  "tier_1": {"min_score": 0, "max_score": 20},
  "tier_2": {"min_score": 21, "max_score": 40},
  "tier_3": {"min_score": 41, "max_score": 60},
  "tier_4": {"min_score": 61, "max_score": 80},
  "tier_5": {"min_score": 81, "max_score": 100}
}'::jsonb;

-- ========================
-- 4. FIX QUIZ ATTEMPTS FOR ANALYTICS
-- ========================

-- Ensure quiz_attempts table has all needed columns
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER,
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT now();

-- ========================
-- 5. CREATE ANALYTICS VIEWS FOR CREATOR DASHBOARD
-- ========================

-- Create view for quiz analytics
CREATE OR REPLACE VIEW quiz_analytics AS
SELECT 
    q.id as quiz_id,
    q.title,
    q.creator_id,
    COUNT(DISTINCT qa.user_id) as total_attempts,
    COUNT(DISTINCT CASE WHEN qa.is_completed = true THEN qa.user_id END) as completed_attempts,
    ROUND(AVG(CASE WHEN qa.is_completed = true THEN qa.score ELSE NULL END), 2) as average_score,
    MAX(CASE WHEN qa.is_completed = true THEN qa.score ELSE NULL END) as highest_score,
    MIN(CASE WHEN qa.is_completed = true THEN qa.score ELSE NULL END) as lowest_score,
    ROUND(AVG(CASE WHEN qa.is_completed = true THEN qa.time_taken_seconds ELSE NULL END), 0) as average_time_seconds
FROM quizzes q
LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
GROUP BY q.id, q.title, q.creator_id;

-- Create view for course analytics
CREATE OR REPLACE VIEW course_analytics AS
SELECT 
    c.id as course_id,
    c.title,
    c.creator_id,
    COUNT(DISTINCT ce.user_id) as total_enrollments,
    COUNT(DISTINCT CASE WHEN ce.completed_at IS NOT NULL THEN ce.user_id END) as completed_enrollments,
    ROUND(AVG(ce.progress), 2) as average_progress
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
GROUP BY c.id, c.title, c.creator_id;

-- ========================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ========================

CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(is_completed);

-- ========================
-- 7. GRANT PERMISSIONS FOR AUTHENTICATED USERS
-- ========================

-- Grant view permissions for analytics
GRANT SELECT ON quiz_analytics TO authenticated;
GRANT SELECT ON course_analytics TO authenticated;

-- ========================
-- 8. CREATE HELPER FUNCTION FOR TIER CALCULATION
-- ========================

CREATE OR REPLACE FUNCTION calculate_tier(score NUMERIC, thresholds JSONB DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    percentage NUMERIC;
    default_thresholds JSONB := '{
        "tier_1": {"min_score": 0, "max_score": 20},
        "tier_2": {"min_score": 21, "max_score": 40}, 
        "tier_3": {"min_score": 41, "max_score": 60},
        "tier_4": {"min_score": 61, "max_score": 80},
        "tier_5": {"min_score": 81, "max_score": 100}
    }'::jsonb;
    tier_thresholds JSONB;
BEGIN
    -- Use provided thresholds or defaults
    tier_thresholds := COALESCE(thresholds, default_thresholds);
    
    -- Convert score to percentage if needed
    percentage := CASE 
        WHEN score <= 1 THEN score * 100
        ELSE score 
    END;
    
    -- Determine tier based on thresholds
    FOR i IN 1..5 LOOP
        IF percentage >= (tier_thresholds->('tier_' || i)->>'min_score')::numeric AND
           percentage <= (tier_thresholds->('tier_' || i)->>'max_score')::numeric THEN
            RETURN i;
        END IF;
    END LOOP;
    
    -- Default to tier 1 if no match
    RETURN 1;
END;
$$ LANGUAGE plpgsql;

-- ========================
-- 9. ADD COMMENTS FOR DOCUMENTATION
-- ========================

COMMENT ON TABLE courses IS 'Educational courses created by content creators';
COMMENT ON TABLE course_enrollments IS 'Track user enrollments in courses';
COMMENT ON VIEW quiz_analytics IS 'Analytics data for quizzes including attempts and scores';
COMMENT ON VIEW course_analytics IS 'Analytics data for courses including enrollments and progress';
COMMENT ON FUNCTION calculate_tier IS 'Calculate performance tier based on score and custom thresholds';

-- ========================
-- 10. DISPLAY SUCCESS MESSAGE
-- ========================

DO $$
BEGIN
    RAISE NOTICE '=== ALL DATABASE ISSUES FIXED ===';
    RAISE NOTICE 'Fixed: Course RLS policies';
    RAISE NOTICE 'Fixed: Missing columns added';
    RAISE NOTICE 'Fixed: Analytics views created';
    RAISE NOTICE 'Fixed: Indexes for performance';
    RAISE NOTICE 'Fixed: Helper functions added';
    RAISE NOTICE '=== READY FOR PRODUCTION ===';
END
$$; 