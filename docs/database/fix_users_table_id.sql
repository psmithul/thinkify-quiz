-- Fix users table ID generation and add missing columns for LinkedIn OAuth
-- This file should be run in Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, let's check if the users table has proper UUID generation
-- If the table exists without DEFAULT uuid_generate_v4(), we need to fix it

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

-- Test the fix by showing the current table structure
DO $$
DECLARE
    table_info RECORD;
BEGIN
    RAISE NOTICE '=== USERS TABLE STRUCTURE ===';
    
    FOR table_info IN 
        SELECT 
            column_name, 
            data_type, 
            column_default, 
            is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE 'Column: % | Type: % | Default: % | Nullable: %', 
            table_info.column_name, 
            table_info.data_type, 
            COALESCE(table_info.column_default, 'NULL'), 
            table_info.is_nullable;
    END LOOP;
    
    RAISE NOTICE '=== END TABLE STRUCTURE ===';
END
$$;

-- Add helpful comments
COMMENT ON TABLE users IS 'User accounts with LinkedIn OAuth integration support';
COMMENT ON COLUMN users.id IS 'Auto-generated UUID primary key';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user account was last updated';
COMMENT ON COLUMN users.linkedin_url IS 'User LinkedIn profile URL from OAuth login';
COMMENT ON COLUMN users.profile_image IS 'User profile image URL (can be from LinkedIn or uploaded)';
COMMENT ON COLUMN users.full_name IS 'User full name (from LinkedIn or manual entry)'; 