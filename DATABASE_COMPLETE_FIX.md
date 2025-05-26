# Complete Database Fix for LinkedIn OAuth Issues

## 🚨 Issues Identified

1. **"null value in column 'id' violates not-null constraint"** - Users table doesn't auto-generate UUIDs
2. **"406 Not Acceptable"** - Supabase API configuration or schema cache issues
3. **Missing columns** - LinkedIn OAuth requires additional user fields

## ✅ Step-by-Step Solution

### Step 1: Fix Users Table Schema in Supabase

**Go to Supabase Dashboard:**
1. Visit: [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **New Query**

**Run this SQL migration:**

```sql
-- Fix users table ID generation and add missing columns for LinkedIn OAuth
-- This file should be run in Supabase SQL Editor

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

-- Add a trigger to automatically update updated_at when records are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add role constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'creator', 'admin'));
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_linkedin_url ON users(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

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

### Step 2: Restart Development Server

After running the SQL migration, restart your development server:

```bash
# Stop current server (Ctrl+C in terminal)
npm run dev -- --port 3001
```

### Step 3: Clear Supabase Schema Cache

**In your project, clear any cached schema:**

```bash
# Clear browser cache and localStorage
# Open browser dev tools (F12)
# Go to Application tab > Storage > Clear storage
```

### Step 4: Test LinkedIn OAuth Flow

1. Go to: `http://localhost:3001/auth/login`
2. Click **"Continue with LinkedIn"**
3. Complete LinkedIn authorization
4. Should now work without database errors

## 🔧 What This Fix Addresses

### Database Schema Issues:
1. **Auto-generating UUIDs:** `users.id` now has `DEFAULT gen_random_uuid()`
2. **Missing columns:** Added `full_name`, `profile_image`, `linkedin_url`, etc.
3. **Timestamp management:** Auto-generated `created_at`/`updated_at` with triggers
4. **Proper constraints:** Role validation and indexes for performance

### RLS Policy Issues:
1. **Public signup:** Allows anonymous users to create accounts
2. **Profile management:** Users can update their own profiles
3. **Service role:** Backend can manage users during OAuth

### Code Changes Made:
1. **Removed manual ID:** No longer trying to specify `id` during INSERT
2. **Removed manual timestamps:** Database handles `created_at`/`updated_at`
3. **Better error handling:** Enhanced debugging in callback

## 🚨 Important Notes

### If You Still Get 406 Errors:

1. **Check Supabase Project Status:**
   - Ensure project is active and not paused
   - Verify API keys are correct in `.env.local`

2. **Verify Table Permissions:**
   - Go to Supabase Dashboard > Authentication > Policies
   - Ensure RLS policies allow INSERT/SELECT operations

3. **Check Browser Network Tab:**
   - Look for exact error messages in 406 responses
   - Verify request headers include proper authentication

### Expected Success Flow:

1. ✅ **LinkedIn OAuth redirects correctly**
2. ✅ **Token exchange works** (no redirect URI errors)
3. ✅ **User profile fetched** from LinkedIn API
4. ✅ **Database INSERT succeeds** (auto-generated UUID)
5. ✅ **User logged in** and redirected to dashboard

## 🔍 Troubleshooting Commands

**Test database connection:**
```bash
# In your project directory
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('users').select('count').then(console.log);
"
```

**Check table structure:**
```sql
-- Run in Supabase SQL Editor
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

After following these steps, your LinkedIn OAuth should work perfectly! 🎉 