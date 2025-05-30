-- Add category column to quizzes table
-- Run this in your Supabase SQL editor to add the category field

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS category TEXT;

-- Optional: Add a default category for existing quizzes
UPDATE quizzes SET category = 'General' WHERE category IS NULL; 