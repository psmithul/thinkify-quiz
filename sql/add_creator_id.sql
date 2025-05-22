-- Add columns to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- Add index for faster queries on creator_id
CREATE INDEX idx_quizzes_creator_id ON quizzes(creator_id);

-- Add RLS policy to allow users to see quizzes
CREATE POLICY "Users can view published quizzes" 
ON quizzes FOR SELECT 
TO authenticated 
USING (is_published = true);

-- Add RLS policy to allow creators to see their own quizzes
CREATE POLICY "Creators can view their own quizzes" 
ON quizzes FOR SELECT 
TO authenticated 
USING (creator_id = auth.uid());

-- Add RLS policy to allow creators to insert their own quizzes
CREATE POLICY "Creators can insert their own quizzes" 
ON quizzes FOR INSERT 
TO authenticated 
WITH CHECK (creator_id = auth.uid());

-- Add RLS policy to allow creators to update their own quizzes
CREATE POLICY "Creators can update their own quizzes" 
ON quizzes FOR UPDATE 
TO authenticated 
USING (creator_id = auth.uid());

-- Add RLS policy to allow creators to delete their own quizzes
CREATE POLICY "Creators can delete their own quizzes" 
ON quizzes FOR DELETE 
TO authenticated 
USING (creator_id = auth.uid());

-- Enable RLS on quizzes table if not already enabled
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Update existing quizzes to assign default creator if needed
-- This is an example - you would need to adjust based on your data
-- UPDATE quizzes SET creator_id = '00000000-0000-0000-0000-000000000000' WHERE creator_id IS NULL; 