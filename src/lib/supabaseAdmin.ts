import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for admin operations.');
}

// Admin client - production ready
let isUsingServiceKey = false;
let adminClient;

try {
  // Try to create admin client with service key
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    adminClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
    isUsingServiceKey = true;
    console.log('✅ Using SERVICE ROLE KEY for admin operations - RLS bypassed');
  } else {
    // Fallback to anon client (RLS disabled for development)
    adminClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'x-admin-user-id': '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        }
      }
    });
    console.log('⚠️ Using ANON KEY for admin operations - RLS may block operations');
  }
} catch (error) {
  // Final fallback
  adminClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  console.log('❌ Fallback to ANON KEY - RLS may block operations');
}

// Admin client for server-side operations that need to bypass RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for user operations
export { supabase } from './supabaseClient';

// Helper function to create admin operations with proper error handling
export function createAdminOperation() {
  return {
    // Quiz operations
    async createQuiz(data: any, userId = '6ba7b810-9dad-11d1-80b4-00c04fd430c8') {
      try {
        return await supabaseAdmin
          .from('quizzes')
          .insert([{ ...data, creator_id: userId }])
          .select()
          .single();
      } catch (error) {
        throw new Error(`Failed to create quiz: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Company operations
    async createCompany(data: any) {
      try {
        return await supabaseAdmin
          .from('companies')
          .insert([data])
          .select()
          .single();
      } catch (error) {
        throw new Error(`Failed to create company: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async updateCompany(id: string, data: any) {
      try {
        return await supabaseAdmin
          .from('companies')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
      } catch (error) {
        throw new Error(`Failed to update company: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async deleteCompany(id: string) {
      try {
        return await supabaseAdmin
          .from('companies')
          .delete()
          .eq('id', id);
      } catch (error) {
        throw new Error(`Failed to delete company: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Recruiter operations
    async createRecruiter(data: any) {
      try {
        return await supabaseAdmin
          .from('recruiters')
          .insert([{ ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
          .select()
          .single();
      } catch (error) {
        throw new Error(`Failed to create recruiter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async updateRecruiter(id: string, data: any) {
      try {
        return await supabaseAdmin
          .from('recruiters')
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();
      } catch (error) {
        throw new Error(`Failed to update recruiter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async deleteRecruiter(id: string) {
      try {
        return await supabaseAdmin
          .from('recruiters')
          .delete()
          .eq('id', id);
      } catch (error) {
        throw new Error(`Failed to delete recruiter: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // Generic operations
    async query(table: string) {
      return supabaseAdmin.from(table);
    }
  };
}

// Helper function to check admin connection (production ready)
export async function testAdminConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count(*)')
      .limit(1);
    
    return !error;
  } catch (err) {
    return false;
  }
}

export { isUsingServiceKey };
export default supabaseAdmin; 