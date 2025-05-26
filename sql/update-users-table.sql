-- Add LinkedIn and company information fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS current_company TEXT,
ADD COLUMN IF NOT EXISTS previous_companies TEXT[];

-- Create index for faster company-based searches
CREATE INDEX IF NOT EXISTS idx_users_current_company ON users(current_company);
CREATE INDEX IF NOT EXISTS idx_users_linkedin_url ON users(linkedin_url);

-- Update RLS policies to allow users to update their own LinkedIn and company info
-- (The existing policies should already cover this, but let's make sure)

-- Add some sample data for testing (optional)
-- UPDATE users SET 
--   linkedin_url = 'https://www.linkedin.com/in/sample-user',
--   current_company = 'Tech Corp',
--   previous_companies = ARRAY['StartupXYZ', 'BigTech Inc']
-- WHERE email = 'test@example.com'; 