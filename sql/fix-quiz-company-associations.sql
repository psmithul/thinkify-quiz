-- =============================================
-- FIX QUIZ COMPANY ASSOCIATIONS TABLE
-- This script creates the missing quiz_company_associations table
-- and ensures proper relationships between quizzes and companies
-- =============================================

-- First disable RLS temporarily for setup
ALTER TABLE IF EXISTS quiz_company_associations DISABLE ROW LEVEL SECURITY;

-- Create the quiz_company_associations table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_company_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL,
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one association per quiz-company pair
    UNIQUE(quiz_id, company_id)
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Check if foreign key to quizzes exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quiz_company_associations_quiz_id_fkey'
    ) THEN
        ALTER TABLE quiz_company_associations 
        ADD CONSTRAINT quiz_company_associations_quiz_id_fkey 
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
    END IF;
    
    -- Check if foreign key to companies exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'quiz_company_associations_company_id_fkey'
    ) THEN
        ALTER TABLE quiz_company_associations 
        ADD CONSTRAINT quiz_company_associations_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_company_associations_quiz_id 
ON quiz_company_associations(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_company_associations_company_id 
ON quiz_company_associations(company_id);

-- Enable RLS on the table
ALTER TABLE quiz_company_associations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for quiz_company_associations
DROP POLICY IF EXISTS "Everyone can view quiz company associations" ON quiz_company_associations;
DROP POLICY IF EXISTS "Creators and admins can manage quiz company associations" ON quiz_company_associations;

-- Allow everyone to view associations (needed for filtering companies in results)
CREATE POLICY "Everyone can view quiz company associations" 
ON quiz_company_associations FOR SELECT 
TO authenticated 
USING (true);

-- Allow quiz creators and admins to manage associations
CREATE POLICY "Creators and admins can manage quiz company associations" 
ON quiz_company_associations FOR ALL 
TO authenticated 
USING (
    -- Admin can do anything
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
    OR
    -- Quiz creator can manage their own quiz associations
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = quiz_company_associations.quiz_id 
        AND quizzes.creator_id = auth.uid()
    )
);

-- Ensure companies table exists and has proper structure
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tier INTEGER NOT NULL CHECK (tier >= 1 AND tier <= 5),
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    website TEXT,
    description TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes on companies table if they don't exist
CREATE INDEX IF NOT EXISTS idx_companies_tier ON companies(tier);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies for companies table
DROP POLICY IF EXISTS "Everyone can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can manage companies" ON companies;

-- Allow everyone to view companies
CREATE POLICY "Everyone can view companies" 
ON companies FOR SELECT 
TO authenticated 
USING (true);

-- Allow admins to manage companies
CREATE POLICY "Admins can manage companies" 
ON companies FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Add some sample companies if none exist
INSERT INTO companies (name, tier, industry, location, website, description) VALUES
('Google', 5, 'Technology', 'Mountain View, CA', 'https://google.com', 'Leading search and cloud technology company'),
('Microsoft', 5, 'Technology', 'Redmond, WA', 'https://microsoft.com', 'Global technology corporation'),
('Amazon', 5, 'E-commerce/Cloud', 'Seattle, WA', 'https://amazon.com', 'E-commerce and cloud computing giant'),
('Apple', 5, 'Technology', 'Cupertino, CA', 'https://apple.com', 'Consumer electronics and software company'),
('Meta', 4, 'Social Media', 'Menlo Park, CA', 'https://meta.com', 'Social media and virtual reality company'),
('Netflix', 4, 'Entertainment', 'Los Gatos, CA', 'https://netflix.com', 'Streaming entertainment service'),
('Uber', 4, 'Transportation', 'San Francisco, CA', 'https://uber.com', 'Ride-sharing and delivery platform'),
('Airbnb', 4, 'Travel', 'San Francisco, CA', 'https://airbnb.com', 'Online marketplace for lodging'),
('Spotify', 3, 'Music/Technology', 'Stockholm, Sweden', 'https://spotify.com', 'Audio streaming platform'),
('Dropbox', 3, 'Cloud Storage', 'San Francisco, CA', 'https://dropbox.com', 'Cloud storage service'),
('Slack', 3, 'Communication', 'San Francisco, CA', 'https://slack.com', 'Business communication platform'),
('Zoom', 3, 'Communication', 'San Jose, CA', 'https://zoom.us', 'Video conferencing platform'),
('Shopify', 2, 'E-commerce', 'Ottawa, Canada', 'https://shopify.com', 'E-commerce platform for businesses'),
('Square', 2, 'Fintech', 'San Francisco, CA', 'https://squareup.com', 'Financial services and digital payments'),
('Mailchimp', 1, 'Marketing', 'Atlanta, GA', 'https://mailchimp.com', 'Email marketing platform'),
('Canva', 1, 'Design', 'Sydney, Australia', 'https://canva.com', 'Online design and publishing tool')
ON CONFLICT (name) DO NOTHING;

-- Add missing columns to quizzes table to support associations
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS tier_thresholds JSONB,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Update existing quizzes with default category if null
UPDATE quizzes SET category = 'General' WHERE category IS NULL;

-- Create a view for easy querying of quiz-company associations with company details
CREATE OR REPLACE VIEW quiz_company_details AS
SELECT 
    qca.quiz_id,
    qca.company_id,
    c.name as company_name,
    c.tier as company_tier,
    c.industry as company_industry,
    c.location as company_location,
    c.website as company_website,
    c.description as company_description,
    c.logo_url as company_logo_url
FROM quiz_company_associations qca
JOIN companies c ON qca.company_id = c.id;

-- Grant access to the view
GRANT SELECT ON quiz_company_details TO authenticated;

-- Create a function to get companies for a quiz with tier filtering
CREATE OR REPLACE FUNCTION get_quiz_companies(
    quiz_id_param UUID,
    user_tier_param INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    tier INTEGER,
    industry TEXT,
    location TEXT,
    website TEXT,
    description TEXT,
    logo_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.tier,
        c.industry,
        c.location,
        c.website,
        c.description,
        c.logo_url
    FROM companies c
    JOIN quiz_company_associations qca ON c.id = qca.company_id
    WHERE qca.quiz_id = quiz_id_param
    AND c.tier <= user_tier_param
    ORDER BY c.tier DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_quiz_companies TO authenticated;

RAISE NOTICE '✅ Quiz company associations table and relationships created successfully!';
RAISE NOTICE '✅ Sample companies added';
RAISE NOTICE '✅ RLS policies configured';
RAISE NOTICE '✅ Helper function created: get_quiz_companies()';
RAISE NOTICE '✅ Ready to use quiz-company associations!'; 