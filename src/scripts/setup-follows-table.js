import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupFollowsTable() {
  console.log('Setting up follows table...');

  try {
    // Check if the table exists
    const { data: tables } = await supabase.rpc('pg_table_exists', { table_name: 'follows' });
    
    if (!tables || tables.length === 0) {
      // Create follows table
      const { error: createTableError } = await supabase.rpc('pg_create_table', {
        table_name: 'follows',
        columns: `
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(follower_id, following_id)
        `
      });

      if (createTableError) {
        throw createTableError;
      }

      // Create indexes for better performance
      await supabase.rpc('pg_execute', { 
        query: 'CREATE INDEX follows_follower_id_idx ON follows(follower_id)'
      });
      
      await supabase.rpc('pg_execute', { 
        query: 'CREATE INDEX follows_following_id_idx ON follows(following_id)'
      });

      console.log('✅ Follows table created successfully');
    } else {
      console.log('✅ Follows table already exists');
    }

    // Add RLS policies for follower table
    const { error: rlsError } = await supabase.rpc('pg_execute', {
      query: `
        BEGIN;
        -- Enable RLS
        ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        DO $$
        BEGIN
          -- Drop policies if they exist
          IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Allow users to see followers') THEN
            DROP POLICY "Allow users to see followers" ON follows;
          END IF;
          
          IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Allow users to follow/unfollow') THEN
            DROP POLICY "Allow users to follow/unfollow" ON follows;
          END IF;
          
          -- Create new policies
          CREATE POLICY "Allow users to see followers" 
            ON follows FOR SELECT 
            USING (true);
            
          CREATE POLICY "Allow users to follow/unfollow" 
            ON follows FOR INSERT 
            WITH CHECK (follower_id = auth.uid());
            
          CREATE POLICY "Allow users to unfollow" 
            ON follows FOR DELETE 
            USING (follower_id = auth.uid());
        END
        $$;
        COMMIT;
      `
    });

    if (rlsError) {
      throw rlsError;
    }

    console.log('✅ RLS policies for follows table set up successfully');
    
  } catch (error) {
    console.error('Error setting up follows table:', error);
    process.exit(1);
  }
}

// Run the setup
setupFollowsTable()
  .then(() => {
    console.log('✅ Follow system setup completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during setup:', error);
    process.exit(1);
  }); 