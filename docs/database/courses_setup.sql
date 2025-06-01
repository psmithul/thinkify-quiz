-- ========================
-- COURSES SYSTEM SETUP
-- ========================
-- This creates a separate courses system, distinct from quizzes
-- Courses are educational content that can contain multiple lessons, videos, etc.
-- Unlike quizzes, courses are not assessment-based but content-based

-- ========================
-- COURSES TABLE
-- ========================

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT, -- Rich text content, markdown, or HTML
    thumbnail_url TEXT,
    youtube_url TEXT, -- YouTube course/playlist URL
    duration_minutes INTEGER DEFAULT 0, -- Estimated course duration
    level TEXT DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    category TEXT DEFAULT 'general',
    tags TEXT[], -- Array of tags for better categorization
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    price NUMERIC DEFAULT 0,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add youtube_url column to existing courses table if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);

-- ========================
-- COURSE LESSONS TABLE
-- ========================

-- Create course_lessons table for organizing course content
CREATE TABLE IF NOT EXISTS course_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT, -- Lesson content (markdown, HTML)
    video_url TEXT, -- Optional video content
    duration_minutes INTEGER DEFAULT 0,
    position INTEGER NOT NULL, -- Order of lessons in the course
    is_free BOOLEAN DEFAULT false, -- Some lessons can be free preview
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_position ON course_lessons(course_id, position);

-- ========================
-- COURSE ENROLLMENTS TABLE
-- ========================

-- Track which users are enrolled in which courses
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), -- Completion percentage
    completed_at TIMESTAMPTZ,
    UNIQUE(course_id, user_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);

-- ========================
-- COURSE LESSON PROGRESS TABLE
-- ========================

-- Track individual lesson completion
CREATE TABLE IF NOT EXISTS course_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    watch_time_minutes INTEGER DEFAULT 0,
    UNIQUE(enrollment_id, lesson_id)
);

-- ========================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================

-- Enable RLS on all course tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lesson_progress ENABLE ROW LEVEL SECURITY;

-- ========================
-- COURSES POLICIES
-- ========================

-- Anyone can view published courses
CREATE POLICY "Anyone can view published courses" 
ON courses FOR SELECT 
TO authenticated 
USING (is_published = true);

-- Creators can view their own courses (published and unpublished)
CREATE POLICY "Creators can view their own courses" 
ON courses FOR SELECT 
TO authenticated 
USING (creator_id = auth.uid());

-- Creators can insert their own courses
CREATE POLICY "Creators can insert their own courses" 
ON courses FOR INSERT 
TO authenticated 
WITH CHECK (creator_id = auth.uid());

-- Creators can update their own courses
CREATE POLICY "Creators can update their own courses" 
ON courses FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid());

-- Creators can delete their own courses
CREATE POLICY "Creators can delete their own courses" 
ON courses FOR DELETE 
TO authenticated 
USING (creator_id = auth.uid());

-- ========================
-- COURSE LESSONS POLICIES
-- ========================

-- Users can view lessons of published courses or their own courses
CREATE POLICY "Users can view course lessons" 
ON course_lessons FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_lessons.course_id 
        AND (courses.is_published = true OR courses.creator_id = auth.uid())
    )
);

-- Creators can manage lessons of their own courses
CREATE POLICY "Creators can manage their course lessons" 
ON course_lessons FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_lessons.course_id 
        AND courses.creator_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE courses.id = course_lessons.course_id 
        AND courses.creator_id = auth.uid()
    )
);

-- ========================
-- COURSE ENROLLMENTS POLICIES
-- ========================

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" 
ON course_enrollments FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Users can enroll in courses
CREATE POLICY "Users can enroll in courses" 
ON course_enrollments FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Users can update their own enrollment progress
CREATE POLICY "Users can update their own enrollment progress" 
ON course_enrollments FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Creators can view enrollments for their courses
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
-- COURSE LESSON PROGRESS POLICIES
-- ========================

-- Users can manage their own lesson progress
CREATE POLICY "Users can manage their own lesson progress" 
ON course_lesson_progress FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM course_enrollments 
        WHERE course_enrollments.id = course_lesson_progress.enrollment_id 
        AND course_enrollments.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM course_enrollments 
        WHERE course_enrollments.id = course_lesson_progress.enrollment_id 
        AND course_enrollments.user_id = auth.uid()
    )
);

-- ========================
-- HELPFUL VIEWS
-- ========================

-- View to get course statistics
CREATE OR REPLACE VIEW course_stats AS
SELECT 
    c.id as course_id,
    c.title,
    c.creator_id,
    COUNT(DISTINCT ce.user_id) as total_enrollments,
    COUNT(DISTINCT cl.id) as total_lessons,
    AVG(ce.progress) as average_progress,
    COUNT(DISTINCT CASE WHEN ce.completed_at IS NOT NULL THEN ce.user_id END) as completed_enrollments
FROM courses c
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
LEFT JOIN course_lessons cl ON c.id = cl.course_id
GROUP BY c.id, c.title, c.creator_id;

-- View to get creator course summary
CREATE OR REPLACE VIEW creator_course_summary AS
SELECT 
    u.id as creator_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT c.id) as total_courses,
    COUNT(DISTINCT CASE WHEN c.is_published = true THEN c.id END) as published_courses,
    COUNT(DISTINCT ce.user_id) as total_enrollments,
    COALESCE(revenue_data.total_revenue, 0) as total_revenue
FROM users u
LEFT JOIN courses c ON u.id = c.creator_id
LEFT JOIN course_enrollments ce ON c.id = ce.course_id
LEFT JOIN (
    SELECT 
        creator_id,
        SUM(price * enrollment_count) as total_revenue
    FROM (
        SELECT 
            c.creator_id,
            c.price,
            COUNT(DISTINCT ce.user_id) as enrollment_count
        FROM courses c
        LEFT JOIN course_enrollments ce ON c.id = ce.course_id
        GROUP BY c.id, c.creator_id, c.price
    ) course_revenue
    GROUP BY creator_id
) revenue_data ON u.id = revenue_data.creator_id
WHERE u.role IN ('creator', 'admin')
GROUP BY u.id, u.full_name, u.email, revenue_data.total_revenue; 