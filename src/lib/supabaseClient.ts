import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Regular client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User types
export type User = {
  id: string;
  email: string;
  role: string;
  full_name?: string | null;
  bio?: string | null;
  profile_image?: string | null;
  location?: string | null;
  job_title?: string | null;
  skills?: string[] | null;
  created_at?: string | null;
};

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  creator_id?: string;
  is_published?: boolean;
  price?: number;
  created_at: string;
  updated_at?: string;
};

// Admin client with service role key that bypasses RLS
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
  
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }
  
  // Create client with auth options that disable auto session management
  // This should ONLY be used server-side and never exposed to the client
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
};

// Types for our database
export type Question = {
  id: string;
  quiz_id: string;
  prompt: string;
  type: 'multiple_choice' | 'text';
  options: string[] | null;
  correct_answer: string;
};

export type Assignment = {
  id: string;
  user_id: string;
  quiz_id: string;
  assigned_at: string;
};

export type Result = {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string>;
  score: number;
  completed_at: string;
};

// Added for clarity and future-proofing
export type QuizAttempt = Result;

export type Payment = {
  id: string;
  user_id: string;
  quiz_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  paid_at: string | null;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  follower?: User;
  following?: User;
}; 