# Complete Quiz Timer & LinkedIn OAuth Fix Guide

## 🚨 Issues Fixed

1. ✅ **Quiz Timer Integration** - Timer now shows during quizzes with time limits
2. ✅ **Quiz Exit Prevention** - Users cannot exit during active quiz attempts  
3. ✅ **LinkedIn OAuth Fix** - Improved authentication flow with proper error handling
4. ✅ **Quiz Attempt Tracking** - Complete timer and attempt tracking in database

## 📋 Database Setup Required

**Important:** Run this SQL in your Supabase SQL Editor:

```sql
-- Ensure the timer migration is applied
-- Add time_limit_minutes column to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT NULL;

-- Create quiz_attempts table if it doesn't exist
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_started_at ON quiz_attempts(started_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_time_limit ON quizzes(time_limit_minutes);

-- Add RLS policies for quiz_attempts
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Clear existing policies to avoid conflicts
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

-- Add comprehensive RLS policies
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
```

## 🔧 Features Now Working

### Quiz Timer Features:
1. **Visual Timer Display** - Shows countdown in top-right corner
2. **Color-coded Warnings** - Green → Orange → Red as time decreases  
3. **Auto-submission** - Quiz submits automatically when time expires
4. **Progress Bar** - Visual representation of remaining time
5. **Time Tracking** - Records actual time taken vs. time limit

### Quiz Exit Prevention:
1. **Browser Warning** - Shows warning when trying to close tab/window
2. **Back Button Prevention** - Blocks browser back button during quiz
3. **Navigation Block** - Exit button is disabled during active quiz
4. **Visual Indicators** - Shows "Quiz in progress - Exit blocked" message

### Enhanced Quiz Flow:
1. **Quiz Start Screen** - Shows quiz info before starting
2. **Time Limit Display** - Shows time limit and question count
3. **Warning Messages** - Alerts users about exit restrictions
4. **Progress Tracking** - Visual progress bar and question counter

## 🔐 LinkedIn OAuth Improvements

### Authentication Flow:
1. **Magic Link Fallback** - Uses OTP when direct auth fails
2. **Better Error Handling** - Clear error messages for users
3. **Graceful Degradation** - Redirects to manual login if needed
4. **User Data Sync** - Properly syncs LinkedIn profile data

### How It Works:
1. User clicks "Continue with LinkedIn"
2. Redirects to LinkedIn OAuth
3. Returns to callback with authorization code
4. Creates/updates user in database
5. Creates Supabase auth session via magic link
6. Redirects to dashboard or manual login

## 🎯 Testing the Features

### Test Quiz Timer:
1. Create a quiz with time limit (e.g., 2 minutes for testing)
2. Start the quiz - timer should appear in top-right
3. Timer should change colors as time decreases
4. Quiz should auto-submit when time expires

### Test Exit Prevention:
1. Start a quiz with time limit
2. Try to close browser tab - should show warning
3. Try to use back button - should be blocked
4. Exit button should show "Quiz in progress - Exit blocked"

### Test LinkedIn OAuth:
1. Go to `/auth/login`
2. Click "Continue with LinkedIn"
3. Complete LinkedIn authorization
4. Should create user account and redirect appropriately

## 🚨 LinkedIn App Configuration

Ensure your LinkedIn app has:

1. **Redirect URL**: `http://localhost:3001/auth/linkedin/callback`
2. **OAuth Scopes**: `openid profile email`
3. **Product**: "OpenID Connect" (not legacy "Sign In with LinkedIn")

## 📱 Environment Variables

Your `.env.local` should include:

```env
# LinkedIn OAuth
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## 🎉 What Users Will Experience

### Quiz Taking Flow:
1. **Browse quizzes** and select one to take
2. **Quiz overview screen** shows:
   - Number of questions
   - Time limit (if any)
   - Warning about exit restrictions
3. **Click "Start Quiz"** to begin
4. **Timer appears** (if quiz has time limit)
5. **Answer questions** with progress tracking
6. **Auto-submit** when time expires OR manual submit
7. **Results page** shows score and time taken

### Authentication:
1. **LinkedIn login** creates account automatically
2. **Profile data** synced from LinkedIn
3. **Seamless experience** with proper error handling

All three major issues are now resolved! The quiz timer works properly, users cannot exit during quizzes, and LinkedIn OAuth has been improved with better error handling. 🎉 