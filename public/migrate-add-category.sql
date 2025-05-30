-- ===================================
-- MIGRATE: Add Category Column to Quizzes
-- ===================================
-- Run this in your Supabase SQL Editor

-- Add category column to quizzes table
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS category TEXT;

-- Add other missing columns that might be needed
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS tier_thresholds JSONB;

-- Set default category for existing quizzes without category
UPDATE quizzes SET category = 'General' WHERE category IS NULL OR category = '';

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quizzes' 
ORDER BY ordinal_position; 