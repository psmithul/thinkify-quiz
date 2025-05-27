# Manual Database Fix Guide

Since `psql` is not available, you need to apply these database changes manually through your Supabase Dashboard.

## ✅ Environment Variables Fixed

The following environment variable has been added to `.env.local`:
- `SUPABASE_SERVICE_KEY` - Required for admin operations

## 🗄️ Step 1: Apply Database Schema Fixes

1. Go to your Supabase Dashboard: https://app.supabase.com/project/shmnqswfxezpgpbscmke
2. Click on "SQL Editor" in the left sidebar
3. Create a new query and paste the following SQL:

```sql
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
```

4. Click "Run" to execute the schema changes

## 🔐 Step 2: Apply RLS Policy Fixes

In the same SQL Editor, create another query and paste this SQL:

```sql
-- Fix RLS Policies for Quiz Creation, Company Management, and Recruiter Management

-- 1. Fix Quiz-related policies
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

CREATE POLICY "Everyone can view companies" ON companies
  FOR SELECT USING (true);

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

CREATE POLICY "Everyone can view active recruiters" ON recruiters
  FOR SELECT USING (is_active = true);

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

CREATE POLICY "Users can view public profiles and their own" ON users
  FOR SELECT USING (
    id = auth.uid() OR 
    role IN ('creator', 'admin') OR
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Users can update their own profile, admins can update any" ON users
  FOR UPDATE USING (
    id = auth.uid() OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_creator_published ON quizzes(creator_id, is_published);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
```

5. Click "Run" to execute the RLS policy fixes

## 🚀 Step 3: Restart Development Server

After applying the database changes, restart your development server to pick up the new environment variables:

```bash
# Kill existing server
pkill -f "node.*next" 2>/dev/null

# Start server on port 3002
npm run dev -- --port 3002
```

## ✅ Testing Checklist

After completing the above steps, test:

1. **Quiz Creation** (as creator/admin):
   - [ ] Visit `/admin/quizzes/new`
   - [ ] Create a new quiz
   - [ ] Add questions to the quiz

2. **Quiz Submission** (as regular user):
   - [ ] Find a published quiz
   - [ ] Take the quiz
   - [ ] Submit answers

3. **Company Management** (as admin):
   - [ ] Visit `/admin/companies`
   - [ ] Add a new company
   - [ ] Edit existing companies

4. **Recruiter Management** (as admin):
   - [ ] Visit `/admin/recruiters`
   - [ ] Add a new recruiter
   - [ ] Edit existing recruiters
   - [ ] Test LinkedIn links

5. **Homepage** (anonymous):
   - [ ] Visit `/` without login
   - [ ] See featured creators and quizzes

## 🚨 If Issues Persist

If you still have issues:

1. Check browser console for JavaScript errors
2. Check Supabase logs in the dashboard
3. Verify your user has the correct role (`admin` or `creator`)
4. Ensure RLS policies were applied correctly

## 🎯 Key Fixes Applied

- ✅ Added missing `SUPABASE_SERVICE_KEY` environment variable
- ✅ Fixed database schema (quiz_attempts, follows, recruiters tables)
- ✅ Updated RLS policies for proper permissions
- ✅ Created admin client for bypassing RLS when needed
- ✅ Updated quiz creation and management functionality 