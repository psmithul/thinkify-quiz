import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function handler(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Service role key not configured' }, 
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    })

    // Create quiz_company_associations table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS quiz_company_associations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          quiz_id UUID NOT NULL,
          company_id UUID NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(quiz_id, company_id)
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('Error creating table:', createError);
    }

    // Add foreign key constraints
    const addConstraintsSQL = `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'quiz_company_associations_quiz_id_fkey'
          ) THEN
              ALTER TABLE quiz_company_associations 
              ADD CONSTRAINT quiz_company_associations_quiz_id_fkey 
              FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE;
          END IF;
          
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'quiz_company_associations_company_id_fkey'
          ) THEN
              ALTER TABLE quiz_company_associations 
              ADD CONSTRAINT quiz_company_associations_company_id_fkey 
              FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
          END IF;
      END $$;
    `;

    const { error: constraintsError } = await supabase.rpc('exec_sql', {
      sql: addConstraintsSQL
    });

    if (constraintsError) {
      console.error('Error adding constraints:', constraintsError);
    }

    // Create indexes
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_quiz_company_associations_quiz_id 
      ON quiz_company_associations(quiz_id);
      
      CREATE INDEX IF NOT EXISTS idx_quiz_company_associations_company_id 
      ON quiz_company_associations(company_id);
    `;

    const { error: indexesError } = await supabase.rpc('exec_sql', {
      sql: createIndexesSQL
    });

    if (indexesError) {
      console.error('Error creating indexes:', indexesError);
    }

    // Enable RLS and create policies
    const rlsSQL = `
      ALTER TABLE quiz_company_associations ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Everyone can view quiz company associations" ON quiz_company_associations;
      DROP POLICY IF EXISTS "Creators and admins can manage quiz company associations" ON quiz_company_associations;
      
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
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSQL
    });

    if (rlsError) {
      console.error('Error setting up RLS:', rlsError);
    }

    // Ensure companies table exists
    const companiesTableSQL = `
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
      
      CREATE INDEX IF NOT EXISTS idx_companies_tier ON companies(tier);
      CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
    `;

    const { error: companiesError } = await supabase.rpc('exec_sql', {
      sql: companiesTableSQL
    });

    if (companiesError) {
      console.error('Error creating companies table:', companiesError);
    }

    // Add sample companies
    const sampleCompaniesData = [
      { name: 'Google', tier: 5, industry: 'Technology', location: 'Mountain View, CA', website: 'https://google.com', description: 'Leading search and cloud technology company' },
      { name: 'Microsoft', tier: 5, industry: 'Technology', location: 'Redmond, WA', website: 'https://microsoft.com', description: 'Global technology corporation' },
      { name: 'Amazon', tier: 5, industry: 'E-commerce/Cloud', location: 'Seattle, WA', website: 'https://amazon.com', description: 'E-commerce and cloud computing giant' },
      { name: 'Apple', tier: 5, industry: 'Technology', location: 'Cupertino, CA', website: 'https://apple.com', description: 'Consumer electronics and software company' },
      { name: 'Meta', tier: 4, industry: 'Social Media', location: 'Menlo Park, CA', website: 'https://meta.com', description: 'Social media and virtual reality company' },
      { name: 'Netflix', tier: 4, industry: 'Entertainment', location: 'Los Gatos, CA', website: 'https://netflix.com', description: 'Streaming entertainment service' },
      { name: 'Uber', tier: 4, industry: 'Transportation', location: 'San Francisco, CA', website: 'https://uber.com', description: 'Ride-sharing and delivery platform' },
      { name: 'Airbnb', tier: 4, industry: 'Travel', location: 'San Francisco, CA', website: 'https://airbnb.com', description: 'Online marketplace for lodging' },
      { name: 'Spotify', tier: 3, industry: 'Music/Technology', location: 'Stockholm, Sweden', website: 'https://spotify.com', description: 'Audio streaming platform' },
      { name: 'Dropbox', tier: 3, industry: 'Cloud Storage', location: 'San Francisco, CA', website: 'https://dropbox.com', description: 'Cloud storage service' }
    ];

    // Insert companies one by one to avoid conflicts
    for (const company of sampleCompaniesData) {
      const { error: insertError } = await supabase
        .from('companies')
        .upsert(company, { onConflict: 'name' });
      
      if (insertError) {
        console.warn(`Warning inserting company ${company.name}:`, insertError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database relationships fixed successfully!',
      details: {
        tableCreated: !createError,
        constraintsAdded: !constraintsError,
        indexesCreated: !indexesError,
        rlsConfigured: !rlsError,
        companiesEnsured: !companiesError
      }
    })

  } catch (error) {
    console.error('Fix relationships error:', error)
    return NextResponse.json(
      { error: 'Failed to fix database relationships', details: error }, 
      { status: 500 }
    )
  }
}

// Apply security middleware
export const POST = withSecurity(handler, {
  rateLimit: { maxRequests: 5, windowMs: 300000 } // 5 requests per 5 minutes
}); 