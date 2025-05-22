'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';

const usersTableSetup = `
-- Add missing columns to users table if needed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Ensure role is one of the valid values
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_role'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT check_role CHECK (role IN ('user', 'creator', 'admin'));
    END IF;
END
$$;
`;

const quizzesTableSetup = `
-- Add required columns to quizzes table if they don't exist
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add index for faster queries on creator_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_quizzes_creator_id'
    ) THEN
        CREATE INDEX idx_quizzes_creator_id ON quizzes(creator_id);
    END IF;
END
$$;
`;

const rlsSetup = `
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users if they don't already exist
DO $$
BEGIN
    -- Users can view other users profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view other users profiles'
    ) THEN
        CREATE POLICY "Users can view other users profiles" 
        ON users FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;

    -- Users can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON users FOR UPDATE 
        TO authenticated 
        USING (id = auth.uid());
    END IF;
    
    -- Users can insert their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON users FOR INSERT 
        TO authenticated 
        WITH CHECK (id = auth.uid());
    END IF;

    -- Service role can insert any user profile (for admin/signup functions)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can manage all users'
    ) THEN
        CREATE POLICY "Service role can manage all users" 
        ON users 
        TO service_role
        USING (true);
    END IF;
    
    -- Allow public (unauthenticated) access to insert initial user records
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public insert for signup'
    ) THEN
        CREATE POLICY "Allow public insert for signup" 
        ON users FOR INSERT 
        TO anon
        WITH CHECK (true);
    END IF;
END
$$;

-- Add RLS policies for quizzes if they don't already exist
DO $$
BEGIN
    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Users can view published quizzes'
    ) THEN
        CREATE POLICY "Users can view published quizzes" 
        ON quizzes FOR SELECT 
        TO authenticated 
        USING (is_published = true);
    END IF;

    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Creators can view their own quizzes'
    ) THEN
        CREATE POLICY "Creators can view their own quizzes" 
        ON quizzes FOR SELECT 
        TO authenticated 
        USING (creator_id = auth.uid());
    END IF;

    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Creators can insert their own quizzes'
    ) THEN
        CREATE POLICY "Creators can insert their own quizzes" 
        ON quizzes FOR INSERT 
        TO authenticated 
        WITH CHECK (creator_id = auth.uid());
    END IF;

    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Creators can update their own quizzes'
    ) THEN
        CREATE POLICY "Creators can update their own quizzes" 
        ON quizzes FOR UPDATE 
        TO authenticated 
        USING (creator_id = auth.uid());
    END IF;

    -- Check if the policy already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Creators can delete their own quizzes'
    ) THEN
        CREATE POLICY "Creators can delete their own quizzes" 
        ON quizzes FOR DELETE 
        TO authenticated 
        USING (creator_id = auth.uid());
    END IF;
    
    -- Service role can manage all quizzes
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'quizzes' AND policyname = 'Service role can manage all quizzes'
    ) THEN
        CREATE POLICY "Service role can manage all quizzes" 
        ON quizzes 
        TO service_role
        USING (true);
    END IF;
END
$$;
`;

export default function SetupDatabasePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [authorized, setAuthorized] = useState(true);

  // Check if user is admin with useEffect instead of during render
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      setAuthorized(false);
      router.push('/');
    }
  }, [isLoading, user, router]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, log]);
  };

  const executeSQL = async (sql: string, description: string) => {
    try {
      addLog(`Executing: ${description}...`);
      
      // Using RPC functions requires admin privileges in Supabase
      // This is just a placeholder - in a real app, you would create a server-side API endpoint
      // or a Supabase Edge Function with admin privileges to run these SQL commands
      const { error } = await supabase.rpc('execute_sql', { sql_query: sql });
      
      if (error) {
        addLog(`Error: ${error.message}`);
        throw error;
      }
      
      addLog(`✓ ${description} completed successfully`);
      return true;
    } catch (err) {
      addLog(`✗ Failed: ${description}`);
      addLog(`Error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };

  const setupDatabase = async () => {
    setStatus('loading');
    setMessage('Setting up database...');
    setLogs([]);
    
    try {
      // Setup steps
      const steps = [
        { sql: usersTableSetup, description: 'Setting up users table' },
        { sql: quizzesTableSetup, description: 'Setting up quizzes table' },
        { sql: rlsSetup, description: 'Configuring Row Level Security' }
      ];
      
      let success = true;
      
      for (const step of steps) {
        const stepSuccess = await executeSQL(step.sql, step.description);
        if (!stepSuccess) {
          success = false;
          // Continue with other steps even if one fails
        }
      }
      
      if (success) {
        setStatus('success');
        setMessage('Database setup completed successfully!');
      } else {
        setStatus('error');
        setMessage('Database setup completed with errors. See log for details.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(`Setup failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const testCreatorAccount = async () => {
    try {
      setStatus('loading');
      setMessage('Making your account a creator...');
      
      if (!user) {
        throw new Error('You must be logged in');
      }
      
      // Update the current user to be a creator
      const { error } = await supabase
        .from('users')
        .update({ role: 'creator' })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Force refresh the page to update the user's role
      window.location.href = '/creator/dashboard';
    } catch (err) {
      setStatus('error');
      setMessage(`Failed to make you a creator: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (!authorized) {
    return null; // Let the useEffect redirect handle this
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Setup Database Structure</h2>
            <p className="text-gray-600">
              This will set up the necessary database tables, columns, and Row Level Security policies
              for the quiz application.
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={setupDatabase}
                disabled={status === 'loading'}
                fullWidth
              >
                {status === 'loading' ? 'Setting up...' : 'Setup Database'}
              </Button>
              
              <Button 
                onClick={testCreatorAccount}
                disabled={status === 'loading'}
                variant="outline"
                fullWidth
              >
                Make Me a Creator
              </Button>
            </div>
            
            {message && (
              <div className={`p-4 rounded-md ${
                status === 'error' ? 'bg-red-50 text-red-700' : 
                status === 'success' ? 'bg-green-50 text-green-700' : 
                'bg-blue-50 text-blue-700'
              }`}>
                <p>{message}</p>
              </div>
            )}
            
            {logs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-2">Execution Log</h3>
                <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
                  {logs.map((log, index) => (
                    <div key={index} className="font-mono text-sm">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Alternative Setup Instructions</h2>
          <p className="text-gray-600 mb-4">
            If the automatic setup doesn't work, you can run the SQL scripts manually in the Supabase SQL editor:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Go to your Supabase project dashboard</li>
            <li>Click on "SQL Editor" in the left sidebar</li>
            <li>Create a new query and paste the SQL scripts from the SQL files in the project</li>
            <li>Run the scripts in this order:
              <ul className="list-disc pl-5 mt-1">
                <li>setup_users_table.sql</li>
                <li>add_creator_id.sql</li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
} 