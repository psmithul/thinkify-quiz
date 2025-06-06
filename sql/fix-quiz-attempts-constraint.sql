-- Fix quiz_attempts table to ensure one attempt per user per quiz
-- This script ensures the unique constraint exists and cleans up any duplicates

-- 1. First, let's check and clean up any duplicate attempts
-- Keep the latest attempt for each user/quiz combination
WITH duplicate_attempts AS (
  SELECT 
    quiz_id,
    user_id,
    MIN(created_at) as first_attempt,
    COUNT(*) as attempt_count
  FROM quiz_attempts 
  GROUP BY quiz_id, user_id 
  HAVING COUNT(*) > 1
),
attempts_to_delete AS (
  SELECT qa.id
  FROM quiz_attempts qa
  INNER JOIN duplicate_attempts da ON qa.quiz_id = da.quiz_id AND qa.user_id = da.user_id
  WHERE qa.created_at > da.first_attempt
)
DELETE FROM quiz_attempts WHERE id IN (SELECT id FROM attempts_to_delete);

-- 2. Ensure the unique constraint exists
-- Drop existing constraint if it exists (in case it has a different name)
DO $$ 
BEGIN
    -- Try to drop existing constraint (ignore if it doesn't exist)
    BEGIN
        ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_quiz_id_user_id_key;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
    
    -- Try to drop other possible constraint names
    BEGIN
        ALTER TABLE quiz_attempts DROP CONSTRAINT IF EXISTS quiz_attempts_unique_user_quiz;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
END $$;

-- 3. Create the unique constraint
ALTER TABLE quiz_attempts 
ADD CONSTRAINT quiz_attempts_quiz_id_user_id_key 
UNIQUE (quiz_id, user_id);

-- 4. Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_completed ON quiz_attempts(is_completed);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_completed ON quiz_attempts(user_id, is_completed);

-- 5. Verify the constraint exists
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quiz_attempts'::regclass 
AND contype = 'u';

-- 6. Show summary of quiz attempts
SELECT 
  'Total quiz attempts' as metric,
  COUNT(*) as count
FROM quiz_attempts
UNION ALL
SELECT 
  'Completed attempts' as metric,
  COUNT(*) as count
FROM quiz_attempts 
WHERE is_completed = true
UNION ALL
SELECT 
  'Incomplete attempts' as metric,
  COUNT(*) as count
FROM quiz_attempts 
WHERE is_completed = false OR is_completed IS NULL; 