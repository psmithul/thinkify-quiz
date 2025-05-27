-- Fix database schema issues
-- Add missing columns to quiz_attempts table and create follows table

-- 1. Add missing columns to quiz_attempts table
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '[]'::jsonb;

-- 2. Create follows table for user following functionality
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(follower_id, following_id),
  -- Prevent users from following themselves
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_answers ON quiz_attempts USING GIN(answers);

-- 3. Add tier-related columns to quizzes table for creator-defined tiers
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS tier_thresholds JSONB DEFAULT '{
  "tier_1": {"min_score": 0, "max_score": 20},
  "tier_2": {"min_score": 21, "max_score": 40},
  "tier_3": {"min_score": 41, "max_score": 60},
  "tier_4": {"min_score": 61, "max_score": 80},
  "tier_5": {"min_score": 81, "max_score": 100}
}'::jsonb;

-- 4. Update RLS policies for follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Users can view all follows relationships
CREATE POLICY "Users can view follows" ON follows
  FOR SELECT USING (true);

-- Users can only create follows where they are the follower
CREATE POLICY "Users can create own follows" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follows
CREATE POLICY "Users can delete own follows" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- 5. Create recruiters table for managing company recruiters
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  linkedin_url TEXT NOT NULL,
  email VARCHAR(255),
  position VARCHAR(255),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  bio TEXT,
  profile_image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recruiters_company ON recruiters(company_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_active ON recruiters(is_active);

-- RLS policies for recruiters
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;

-- Everyone can view active recruiters
CREATE POLICY "Users can view active recruiters" ON recruiters
  FOR SELECT USING (is_active = true);

-- Only admins can manage recruiters
CREATE POLICY "Admins can manage recruiters" ON recruiters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- 6. Insert sample recruiters based on the provided data
INSERT INTO recruiters (name, linkedin_url, position, bio, company_id)
SELECT 
  'Ashwin Krishna', 
  'https://www.linkedin.com/in/ashwin-krishna/',
  'Senior Software Engineer',
  'Experienced software engineer passionate about scalable systems and mentoring.',
  companies.id
FROM companies 
WHERE LOWER(companies.name) = 'amazon'
ON CONFLICT DO NOTHING;

INSERT INTO recruiters (name, linkedin_url, position, bio, company_id)
SELECT 
  'Ashwin Krishna', 
  'https://www.linkedin.com/in/ashwin-krishna/',
  'Senior Software Engineer',
  'Experienced software engineer passionate about scalable systems and mentoring.',
  companies.id
FROM companies 
WHERE LOWER(companies.name) = 'flipkart'
ON CONFLICT DO NOTHING;

INSERT INTO recruiters (name, linkedin_url, position, bio, company_id)
SELECT 
  'Sagar Giri', 
  'https://www.linkedin.com/in/sagargiri07/',
  'Engineering Manager',
  'Engineering leader focused on building high-performing teams and products.',
  companies.id
FROM companies 
WHERE LOWER(companies.name) = 'swiggy'
ON CONFLICT DO NOTHING;

INSERT INTO recruiters (name, linkedin_url, position, bio, company_id)
SELECT 
  'Sagar Giri', 
  'https://www.linkedin.com/in/sagargiri07/',
  'Engineering Manager',
  'Engineering leader focused on building high-performing teams and products.',
  companies.id
FROM companies 
WHERE LOWER(companies.name) = 'uber'
ON CONFLICT DO NOTHING;

INSERT INTO recruiters (name, linkedin_url, position, bio, company_id)
SELECT 
  'Puru Kathuria', 
  'https://www.linkedin.com/in/purukathuria/',
  'Staff Software Engineer',
  'Staff engineer with expertise in distributed systems and machine learning.',
  companies.id
FROM companies 
WHERE LOWER(companies.name) = 'google'
ON CONFLICT DO NOTHING;

INSERT INTO recruiters (name, linkedin_url, position, bio, company_id)
SELECT 
  'Pratik Jain', 
  'https://www.linkedin.com/in/pratikjain227/',
  'Principal Software Engineer',
  'Principal engineer specializing in cloud platforms and enterprise solutions.',
  companies.id
FROM companies 
WHERE LOWER(companies.name) = 'salesforce'
ON CONFLICT DO NOTHING;

-- Verify the changes
SELECT 'quiz_attempts columns' as check_type, column_name 
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' AND column_name IN ('is_completed', 'answers');

SELECT 'follows table exists' as check_type, table_name 
FROM information_schema.tables 
WHERE table_name = 'follows';

SELECT 'recruiters created' as check_type, COUNT(*) as count 
FROM recruiters; 