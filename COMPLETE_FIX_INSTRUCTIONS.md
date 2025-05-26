# Complete Fix Instructions: LinkedIn OAuth + Quiz Timers

## 🚨 Current Issues to Fix

1. **LinkedIn OAuth Error**: "Failed to fetch LinkedIn profile"
2. **Database Schema**: Missing timer functionality for quizzes
3. **Timer Feature**: Add countdown timers to quizzes

## ✅ Step-by-Step Solutions

### Part 1: Fix Database Schema Issues

**1. Run Database Migration for Users Table**

Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor → New Query and run:

```sql
-- Fix users table ID generation and add missing columns for LinkedIn OAuth
-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add DEFAULT uuid generation to the id column if it doesn't have it
DO $$
BEGIN
    -- Check if id column has a default value
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'id' 
        AND column_default IS NOT NULL
    ) THEN
        -- Add default UUID generation to id column
        ALTER TABLE users 
        ALTER COLUMN id SET DEFAULT gen_random_uuid();
        
        RAISE NOTICE 'Added UUID default generation to users.id column';
    END IF;
END
$$;

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing users to have timestamps if they don't already
UPDATE users 
SET 
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Make created_at and updated_at NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- Set up RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts
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
END
$$;

-- Add comprehensive RLS policies
CREATE POLICY "Users can view other users profiles" 
ON users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

CREATE POLICY "Service role can manage all users" 
ON users 
TO service_role
USING (true);

CREATE POLICY "Allow public insert for signup" 
ON users FOR INSERT 
TO anon
WITH CHECK (true);
```

**2. Add Timer Functionality to Quizzes**

Run this SQL migration:

```sql
-- Add timer functionality to quizzes
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
```

### Part 2: Fix LinkedIn OAuth Configuration

**1. Update LinkedIn App Settings**

Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps):

1. Select your app
2. Go to **Auth** tab
3. **Remove all existing redirect URLs**
4. **Add exactly this URL**: `http://localhost:3001/auth/linkedin/callback`
5. Go to **Products** tab
6. Make sure you have **"OpenID Connect"** added
7. Under **OAuth 2.0 scopes**, ensure you have:
   - `openid`
   - `profile` 
   - `email`

**2. Verify Environment Variables**

Check your `.env.local` file has:
```
LINKEDIN_CLIENT_ID=your_actual_client_id
LINKEDIN_CLIENT_SECRET=your_actual_client_secret
```

### Part 3: Test the Complete Fix

**1. Restart Development Server**
```bash
# Stop current server (Ctrl+C)
npm run dev -- --port 3001
```

**2. Test LinkedIn OAuth Flow**
1. Go to: `http://localhost:3001/auth/login`
2. Click **"Continue with LinkedIn"**
3. Complete LinkedIn authorization
4. Should now create user account successfully

**3. Test Timer Functionality**
1. Create a new quiz with a time limit
2. Set time limit (e.g., 5 minutes)
3. Timer should appear when taking the quiz

## 🎯 Features Added

### Timer Features:
- ✅ **Time Limit Setting**: Creators can set quiz time limits (1-180 minutes)
- ✅ **Visual Timer**: Countdown display with progress bar
- ✅ **Color-coded Warnings**: Green → Orange → Red as time runs out
- ✅ **Auto-submission**: Quiz submits automatically when time expires
- ✅ **Time Tracking**: Records actual time taken vs. time limit

### LinkedIn OAuth Fixes:
- ✅ **Multiple API Endpoints**: Uses userinfo endpoint with legacy fallback
- ✅ **Better Error Handling**: Detailed logging and error messages
- ✅ **Proper Scopes**: Uses modern OpenID Connect scopes
- ✅ **Database Integration**: Auto-creates user accounts with proper UUIDs

## 🔧 Quiz Timer Usage

When creating quizzes, you can now:
1. Set optional time limits (recommended: 10-30 minutes)
2. Quiz takers see countdown timer in top-right corner
3. Timer changes color as time runs low
4. Quiz auto-submits when time expires
5. Results show time taken vs. time limit

## 🚨 Troubleshooting

**If LinkedIn OAuth still fails:**
1. Double-check redirect URI in LinkedIn app matches exactly
2. Verify OAuth scopes include `openid`, `profile`, `email`
3. Check server logs for detailed error messages
4. Ensure `.env.local` has correct credentials

**If Timer doesn't work:**
1. Ensure database migration ran successfully
2. Check quiz has `time_limit_minutes` set
3. Timer only appears when quiz has time limit set

**If Database errors persist:**
1. Run the SQL migrations again
2. Check RLS policies are correctly applied
3. Verify UUID extension is enabled

After following these steps, both LinkedIn OAuth and quiz timers should work perfectly! 🎉 