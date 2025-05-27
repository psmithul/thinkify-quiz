-- COMPLETE FIX: Disable RLS + Fix Recruiter Constraints + Add Placeholder Data
-- This will fix quiz creation, company management, and recruiter management

-- 1. TEMPORARILY DISABLE RLS ON ALL TABLES (for development)
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (just in case)
DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
DROP POLICY IF EXISTS "Creators and admins can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Creators can update their quizzes, admins can update any" ON quizzes;
DROP POLICY IF EXISTS "Creators can delete their quizzes, admins can delete any" ON quizzes;
DROP POLICY IF EXISTS "Users can view published quizzes and own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete their own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone authenticated can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Anyone authenticated can update quizzes" ON quizzes;

DROP POLICY IF EXISTS "Everyone can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can manage companies" ON companies;
DROP POLICY IF EXISTS "Anyone can manage companies" ON companies;

DROP POLICY IF EXISTS "Everyone can view active recruiters" ON recruiters;
DROP POLICY IF EXISTS "Admins can manage recruiters" ON recruiters;
DROP POLICY IF EXISTS "Authenticated users can manage recruiters" ON recruiters;
DROP POLICY IF EXISTS "Anyone can manage recruiters" ON recruiters;

-- 3. Grant full permissions to anon and authenticated roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 4. Fix recruiters table - Add unique constraint for recruiter name per company
-- First, remove any duplicate recruiters if they exist
DELETE FROM recruiters a USING recruiters b 
WHERE a.id > b.id 
AND a.name = b.name 
AND a.company_id = b.company_id;

-- Add unique constraint to prevent duplicate recruiter names per company
ALTER TABLE recruiters DROP CONSTRAINT IF EXISTS unique_recruiter_per_company;
ALTER TABLE recruiters ADD CONSTRAINT unique_recruiter_per_company 
UNIQUE (company_id, name);

-- 5. Ensure all companies have placeholder recruiters
-- First, let's add some missing companies if they don't exist
INSERT INTO companies (id, name, description, logo_url, website_url, industry, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Amazon', 'Global e-commerce and cloud computing giant', 'https://logo.clearbit.com/amazon.com', 'https://amazon.com', 'Technology', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Flipkart', 'Leading Indian e-commerce platform', 'https://logo.clearbit.com/flipkart.com', 'https://flipkart.com', 'E-commerce', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Swiggy', 'Food delivery and restaurant aggregator', 'https://logo.clearbit.com/swiggy.com', 'https://swiggy.com', 'Food Tech', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Uber', 'Global ride-hailing and delivery platform', 'https://logo.clearbit.com/uber.com', 'https://uber.com', 'Transportation', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Google', 'Search engine and technology conglomerate', 'https://logo.clearbit.com/google.com', 'https://google.com', 'Technology', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'Salesforce', 'Cloud-based software company', 'https://logo.clearbit.com/salesforce.com', 'https://salesforce.com', 'Software', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- 6. Add placeholder recruiters for each company (avoiding duplicates)
INSERT INTO recruiters (company_id, name, title, email, linkedin_url, is_active, created_at, updated_at)
VALUES 
  -- Amazon recruiters
  ('550e8400-e29b-41d4-a716-446655440001', 'Ashwin Krishna', 'Senior Technical Recruiter', 'ashwin.krishna@amazon.com', 'https://linkedin.com/in/ashwin-krishna-amazon', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Sarah Johnson', 'Lead Talent Acquisition', 'sarah.johnson@amazon.com', 'https://linkedin.com/in/sarah-johnson-amazon', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440001', 'Michael Chen', 'Technical Recruiter', 'michael.chen@amazon.com', 'https://linkedin.com/in/michael-chen-amazon', true, NOW(), NOW()),
  
  -- Flipkart recruiters
  ('550e8400-e29b-41d4-a716-446655440002', 'Ashwin Krishna', 'Senior Talent Partner', 'ashwin.krishna@flipkart.com', 'https://linkedin.com/in/ashwin-krishna-flipkart', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Priya Sharma', 'Technical Recruiter', 'priya.sharma@flipkart.com', 'https://linkedin.com/in/priya-sharma-flipkart', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'Rahul Gupta', 'Lead Recruiter', 'rahul.gupta@flipkart.com', 'https://linkedin.com/in/rahul-gupta-flipkart', true, NOW(), NOW()),
  
  -- Swiggy recruiters
  ('550e8400-e29b-41d4-a716-446655440003', 'Sagar Giri', 'Senior Technical Recruiter', 'sagar.giri@swiggy.in', 'https://linkedin.com/in/sagar-giri-swiggy', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Neha Verma', 'Talent Acquisition Lead', 'neha.verma@swiggy.in', 'https://linkedin.com/in/neha-verma-swiggy', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'Arjun Patel', 'Technical Recruiter', 'arjun.patel@swiggy.in', 'https://linkedin.com/in/arjun-patel-swiggy', true, NOW(), NOW()),
  
  -- Uber recruiters
  ('550e8400-e29b-41d4-a716-446655440004', 'Sagar Giri', 'Lead Technical Recruiter', 'sagar.giri@uber.com', 'https://linkedin.com/in/sagar-giri-uber', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'Lisa Wang', 'Senior Recruiter', 'lisa.wang@uber.com', 'https://linkedin.com/in/lisa-wang-uber', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'David Brown', 'Technical Talent Partner', 'david.brown@uber.com', 'https://linkedin.com/in/david-brown-uber', true, NOW(), NOW()),
  
  -- Google recruiters
  ('550e8400-e29b-41d4-a716-446655440005', 'Puru Kathuria', 'Senior Technical Recruiter', 'puru.kathuria@google.com', 'https://linkedin.com/in/puru-kathuria-google', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'Emma Davis', 'Lead Talent Acquisition', 'emma.davis@google.com', 'https://linkedin.com/in/emma-davis-google', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'James Wilson', 'Technical Recruiter', 'james.wilson@google.com', 'https://linkedin.com/in/james-wilson-google', true, NOW(), NOW()),
  
  -- Salesforce recruiters
  ('550e8400-e29b-41d4-a716-446655440006', 'Pratik Jain', 'Senior Technical Recruiter', 'pratik.jain@salesforce.com', 'https://linkedin.com/in/pratik-jain-salesforce', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'Rachel Green', 'Talent Acquisition Specialist', 'rachel.green@salesforce.com', 'https://linkedin.com/in/rachel-green-salesforce', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'Alex Thompson', 'Lead Technical Recruiter', 'alex.thompson@salesforce.com', 'https://linkedin.com/in/alex-thompson-salesforce', true, NOW(), NOW())

ON CONFLICT (company_id, name) DO UPDATE SET
  title = EXCLUDED.title,
  email = EXCLUDED.email,
  linkedin_url = EXCLUDED.linkedin_url,
  updated_at = NOW();

-- 7. Create a test user if it doesn't exist (for quiz creation)
INSERT INTO users (id, email, role, full_name, avatar_url, created_at, updated_at)
VALUES (
  '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  'admin@thinkify.com',
  'admin',
  'Test Admin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- 8. Refresh the schema
NOTIFY pgrst, 'reload schema';

-- 9. Print success message
DO $$
BEGIN
  RAISE NOTICE 'SUCCESS: All fixes applied!';
  RAISE NOTICE '✅ RLS disabled for development';
  RAISE NOTICE '✅ Unique recruiter constraints added';
  RAISE NOTICE '✅ Placeholder recruiters created for all companies';
  RAISE NOTICE '✅ Quiz creation should now work';
  RAISE NOTICE '✅ Company management should now work';
END $$; 