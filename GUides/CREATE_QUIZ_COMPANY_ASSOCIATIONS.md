# Fix Quiz Company Associations Database Issue

## Problem
The quiz results page is showing an error: "Could not find a relationship between 'quiz_company_associations' and 'companies' in the schema cache"

## Solution
You need to create the missing `quiz_company_associations` table and its relationships in your Supabase database.

## Step 1: Create the Table

Go to your Supabase dashboard > SQL Editor and run this SQL:

```sql
-- Create quiz_company_associations table
CREATE TABLE IF NOT EXISTS quiz_company_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL,
    company_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(quiz_id, company_id)
);

-- Add foreign key constraints
ALTER TABLE quiz_company_associations 
ADD CONSTRAINT quiz_company_associations_quiz_id_fkey 
FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;

ALTER TABLE quiz_company_associations 
ADD CONSTRAINT quiz_company_associations_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_company_associations_quiz_id 
ON quiz_company_associations(quiz_id);

CREATE INDEX IF NOT EXISTS idx_quiz_company_associations_company_id 
ON quiz_company_associations(company_id);
```

## Step 2: Enable Row Level Security

```sql
-- Enable RLS
ALTER TABLE quiz_company_associations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view quiz company associations" 
ON quiz_company_associations FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Creators and admins can manage quiz company associations" 
ON quiz_company_associations FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
    OR
    EXISTS (
        SELECT 1 FROM quizzes 
        WHERE quizzes.id = quiz_company_associations.quiz_id 
        AND quizzes.creator_id = auth.uid()
    )
);
```

## Step 3: Ensure Companies Table Exists

If you haven't created the companies table yet, run this:

```sql
-- Create companies table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_tier ON companies(tier);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view companies" 
ON companies FOR SELECT 
TO authenticated 
USING (true);

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
```

## Step 4: Add Sample Companies (Optional)

```sql
INSERT INTO companies (name, tier, industry, location, website, description) VALUES
('Google', 5, 'Technology', 'Mountain View, CA', 'https://google.com', 'Leading search and cloud technology company'),
('Microsoft', 5, 'Technology', 'Redmond, WA', 'https://microsoft.com', 'Global technology corporation'),
('Amazon', 5, 'E-commerce/Cloud', 'Seattle, WA', 'https://amazon.com', 'E-commerce and cloud computing giant'),
('Apple', 5, 'Technology', 'Cupertino, CA', 'https://apple.com', 'Consumer electronics and software company'),
('Meta', 4, 'Social Media', 'Menlo Park, CA', 'https://meta.com', 'Social media and virtual reality company'),
('Netflix', 4, 'Entertainment', 'Los Gatos, CA', 'https://netflix.com', 'Streaming entertainment service'),
('Uber', 4, 'Transportation', 'San Francisco, CA', 'https://uber.com', 'Ride-sharing and delivery platform'),
('Spotify', 3, 'Music/Technology', 'Stockholm, Sweden', 'https://spotify.com', 'Audio streaming platform'),
('Shopify', 2, 'E-commerce', 'Ottawa, Canada', 'https://shopify.com', 'E-commerce platform for businesses')
ON CONFLICT (name) DO NOTHING;
```

## What This Fixes

1. **Database relationship error**: Creates the missing table and proper foreign key relationships
2. **Quiz results visibility**: Companies will now be properly filtered by quiz associations
3. **Company filtering**: Only companies associated with specific quizzes will show in results

## Fallback Behavior

The app has been updated to gracefully handle missing relationships by falling back to showing all companies if the association table doesn't exist. This means:

- If you run the SQL above, quiz results will show only associated companies ✅
- If you don't run the SQL, quiz results will show all companies (better than crashing) ⚠️

## After Running the SQL

Once you've created the table, you can:

1. Go to the Quiz Management page for any quiz
2. Associate companies with quizzes using the checkboxes
3. View quiz results to see only the associated companies

The quiz results pages have also been improved with:
- Better mobile responsiveness
- Enhanced error handling
- Improved loading states
- Fixed profile dropdown visibility issues 