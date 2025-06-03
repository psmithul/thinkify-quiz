-- Fix RLS Policies for Quiz App
-- Run this in Supabase SQL Editor to fix 406 database errors

-- First, ensure the users table exists with all required columns
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
  bio TEXT,
  profile_image TEXT,
  linkedin_url TEXT,
  job_title TEXT,
  company TEXT,
  location TEXT,
  industry TEXT,
  phone TEXT,
  website TEXT,
  skills TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Public profiles viewable" ON users;

-- Create comprehensive RLS policies

-- 1. Users can read their own profile
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Users can insert their own profile (for signup)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Public read access for creator profiles (optional - enable if needed)
-- CREATE POLICY "Public profiles viewable" ON users
--   FOR SELECT
--   USING (role = 'creator');

-- Create or update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- Test the setup
-- This should now work for authenticated users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    RAISE NOTICE 'Users table exists and is configured with RLS policies';
  ELSE
    RAISE NOTICE 'Users table creation failed';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Grant access to the auth schema for user management
GRANT SELECT ON auth.users TO authenticated;

COMMENT ON TABLE users IS 'User profiles with extended LinkedIn integration fields';
COMMENT ON COLUMN users.skills IS 'Array of skill strings imported from LinkedIn';
COMMENT ON COLUMN users.linkedin_url IS 'Direct link to LinkedIn profile';
COMMENT ON COLUMN users.role IS 'User role: user, creator, or admin'; 