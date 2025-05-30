-- Database Migration: Add missing columns to users table
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed_at);

-- Update users table comment
COMMENT ON COLUMN users.phone IS 'User phone number for contact purposes';
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN users.address IS 'User address information';
COMMENT ON COLUMN users.profile_completed_at IS 'Timestamp when user completed their profile';

-- Display the current table structure
DO $$
DECLARE
    table_info RECORD;
BEGIN
    RAISE NOTICE '=== USERS TABLE STRUCTURE AFTER MIGRATION ===';
    
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
    
    RAISE NOTICE '=== MIGRATION COMPLETED ===';
END
$$; 