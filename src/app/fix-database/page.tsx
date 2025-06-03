'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/authContext';

export default function FixDatabasePage() {
  const { user } = useAuth();
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabaseConnection = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🔍 Testing database connection...');
      
      // Test 1: Basic connection
      const { data: session } = await supabase.auth.getSession();
      addResult(`✅ Supabase connection: OK`);
      addResult(`📧 Current user: ${session.session?.user?.email || 'Not logged in'}`);
      
      // Test 2: Check if users table exists
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count(*)')
          .limit(1);
        
        if (error) {
          addResult(`❌ Users table error: ${error.message}`);
          if (error.code === '42P01') {
            addResult(`💡 Solution: Users table doesn't exist. Run database setup.`);
          } else if (error.code === 'PGRST301' || error.message.includes('406')) {
            addResult(`💡 Solution: RLS policy issue. Need to update policies.`);
          }
        } else {
          addResult(`✅ Users table: Accessible`);
        }
      } catch (err) {
        addResult(`❌ Users table test failed: ${err}`);
      }

      // Test 3: Check current user profile
      if (session.session?.user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.session.user.id)
            .maybeSingle();
          
          if (error) {
            addResult(`❌ User profile error: ${error.message}`);
          } else if (!data) {
            addResult(`⚠️ User profile: Not found in database`);
            addResult(`💡 Solution: Create user profile manually`);
          } else {
            addResult(`✅ User profile: Found`);
            addResult(`📋 Profile data: ${JSON.stringify(data, null, 2)}`);
          }
        } catch (err) {
          addResult(`❌ User profile test failed: ${err}`);
        }
      }

      // Test 4: Test basic insert (should fail with RLS but give us error details)
      try {
        const testUser = {
          id: 'test-' + Date.now(),
          email: 'test@example.com',
          full_name: 'Test User',
          role: 'user'
        };
        
        const { error } = await supabase
          .from('users')
          .insert([testUser]);
        
        if (error) {
          addResult(`📋 Insert test error (expected): ${error.message}`);
          if (error.message.includes('RLS')) {
            addResult(`💡 RLS is enabled - this is correct for security`);
          }
        } else {
          addResult(`⚠️ Insert test: Unexpectedly succeeded (RLS may be disabled)`);
        }
      } catch (err) {
        addResult(`📋 Insert test error: ${err}`);
      }

    } catch (err) {
      addResult(`❌ Connection test failed: ${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const createUserProfile = async () => {
    if (!user) {
      addResult('❌ No authenticated user found');
      return;
    }

    setIsRunning(true);
    
    try {
      addResult('🔧 Attempting to create user profile...');
      
      const profileData = {
        id: user.id,
        email: user.email || 'unknown@example.com',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      addResult(`📋 Profile data: ${JSON.stringify(profileData, null, 2)}`);

      const { data, error } = await supabase
        .from('users')
        .upsert([profileData])
        .select()
        .single();

      if (error) {
        addResult(`❌ Profile creation failed: ${error.message}`);
        addResult(`🔧 Error code: ${error.code}`);
        
        if (error.code === '42P01') {
          addResult(`💡 Users table doesn't exist. Please run the database setup.`);
        } else if (error.message.includes('RLS') || error.message.includes('policy')) {
          addResult(`💡 RLS policy preventing insert. Check your Supabase dashboard policies.`);
        }
      } else {
        addResult(`✅ Profile created successfully!`);
        addResult(`📋 New profile: ${JSON.stringify(data, null, 2)}`);
        
        // Refresh the page to reload auth context
        setTimeout(() => {
          addResult(`🔄 Refreshing page to reload profile...`);
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      addResult(`❌ Profile creation error: ${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearUserProfile = async () => {
    if (!user) {
      addResult('❌ No authenticated user found');
      return;
    }

    setIsRunning(true);
    
    try {
      addResult('🗑️ Clearing user profile to test profile completion...');
      
      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: '', // Clear name to trigger profile completion
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        addResult(`❌ Profile clear failed: ${error.message}`);
      } else {
        addResult(`✅ Profile cleared! Refreshing page...`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      addResult(`❌ Profile clear error: ${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Database Diagnostics & Fixes</h1>
        
        <div className="space-y-6">
          {/* User Status */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Current Status</h2>
            <div className="space-y-2">
              <p><strong>Authenticated:</strong> {user ? '✅ Yes' : '❌ No'}</p>
              {user && (
                <>
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </>
              )}
            </div>
          </div>

          {/* Test Actions */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Diagnostic Tests</h2>
            <div className="space-y-3">
              <button 
                onClick={testDatabaseConnection}
                disabled={isRunning}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 mr-3"
              >
                🔍 Test Database Connection
              </button>
              
              {user && (
                <>
                  <button 
                    onClick={createUserProfile}
                    disabled={isRunning}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 mr-3"
                  >
                    🔧 Create/Fix User Profile
                  </button>
                  
                  <button 
                    onClick={clearUserProfile}
                    disabled={isRunning}
                    className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    🗑️ Clear Profile (Test Completion)
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Test Results</h2>
            {results.length === 0 ? (
              <p className="text-gray-500">Run a test to see results...</p>
            ) : (
              <div className="bg-white p-3 rounded border max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="text-sm font-mono mb-1">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Common Issues & Solutions</h2>
            <div className="space-y-2 text-sm">
              <div><strong>406 Error:</strong> Usually RLS (Row Level Security) policy issue. Check Supabase dashboard → Authentication → Policies</div>
              <div><strong>Table doesn't exist:</strong> Run the database setup SQL in Supabase dashboard → SQL Editor</div>
              <div><strong>Profile completion not showing:</strong> Use "Clear Profile" to trigger the completion flow</div>
              <div><strong>Environment variables:</strong> Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 