-- Add interviewers field to companies table
-- Each interviewer entry contains name and LinkedIn URL

ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS interviewers JSONB DEFAULT '[]'::jsonb;

-- Create index for faster interviewer searches
CREATE INDEX IF NOT EXISTS idx_companies_interviewers ON companies USING GIN(interviewers);

-- Update existing companies with interviewer data
-- Format: [{"name": "Name", "linkedin_url": "URL"}]

-- Update Amazon
UPDATE companies 
SET interviewers = '[
  {
    "name": "Ashwin Krishna",
    "linkedin_url": "https://www.linkedin.com/in/ashwin-krishna/"
  }
]'::jsonb
WHERE LOWER(name) = 'amazon';

-- Update Flipkart (if it exists, otherwise insert)
INSERT INTO companies (name, tier, industry, location, website, description, logo_url, interviewers)
VALUES (
  'Flipkart',
  4,
  'Technology',
  'Bangalore, India',
  'https://flipkart.com',
  'Leading e-commerce platform in India offering a wide range of products and services.',
  'https://logo.clearbit.com/flipkart.com',
  '[{
    "name": "Ashwin Krishna",
    "linkedin_url": "https://www.linkedin.com/in/ashwin-krishna/"
  }]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  interviewers = EXCLUDED.interviewers;

-- Update Swiggy (if it exists, otherwise insert)
INSERT INTO companies (name, tier, industry, location, website, description, logo_url, interviewers)
VALUES (
  'Swiggy',
  3,
  'Technology',
  'Bangalore, India',
  'https://swiggy.com',
  'Food delivery and quick commerce platform serving millions of customers across India.',
  'https://logo.clearbit.com/swiggy.com',
  '[{
    "name": "Sagar Giri",
    "linkedin_url": "https://www.linkedin.com/in/sagargiri07/"
  }]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  interviewers = EXCLUDED.interviewers;

-- Update Uber
UPDATE companies 
SET interviewers = '[
  {
    "name": "Sagar Giri",
    "linkedin_url": "https://www.linkedin.com/in/sagargiri07/"
  }
]'::jsonb
WHERE LOWER(name) = 'uber';

-- Update Google
UPDATE companies 
SET interviewers = '[
  {
    "name": "Puru Kathuria",
    "linkedin_url": "https://www.linkedin.com/in/purukathuria/"
  }
]'::jsonb
WHERE LOWER(name) = 'google';

-- Update Salesforce (if it exists, otherwise insert)
INSERT INTO companies (name, tier, industry, location, website, description, logo_url, interviewers)
VALUES (
  'Salesforce',
  4,
  'Technology',
  'San Francisco, CA',
  'https://salesforce.com',
  'Leading customer relationship management (CRM) platform and cloud computing company.',
  'https://logo.clearbit.com/salesforce.com',
  '[{
    "name": "Pratik Jain",
    "linkedin_url": "https://www.linkedin.com/in/pratikjain227/"
  }]'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  interviewers = EXCLUDED.interviewers;

-- Verify the updates
SELECT name, interviewers FROM companies WHERE interviewers IS NOT NULL AND jsonb_array_length(interviewers) > 0; 