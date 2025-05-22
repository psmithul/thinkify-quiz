'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User } from './supabaseClient';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  session: Session | null;
  user: SupabaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setUserData(null);
        setIsAdmin(false);
        setIsCreator(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle redirects based on user role
  useEffect(() => {
    if (!isLoading && userData) {
      const path = window.location.pathname;
      
      // Redirect if user is on a page they shouldn't access
      if (userData.role === 'user') {
        if (path.startsWith('/admin') || path.startsWith('/creator')) {
          router.push('/user/dashboard');
        }
      } else if (userData.role === 'creator') {
        if (path.startsWith('/admin')) {
          router.push('/creator/dashboard');
        }
      } else if (userData.role === 'admin') {
        // Admin can access all pages
      }
    }
  }, [isLoading, userData, router]);

  async function fetchUserData(userId: string) {
    try {
      // Check if users table exists first
      const { error: tableError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      // If we get a 404, the table doesn't exist yet
      if (tableError && tableError.code === '42P01') {
        console.error('Users table does not exist yet. Please run npm run init-db');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user is not found in the users table, we'll create one with default role
        if (error.code === 'PGRST116') {
          const userEmail = user?.email || 'unknown@example.com';
          console.log('Creating new user record for:', userEmail);
          
          const { data: userData, error: insertError } = await supabase
            .from('users')
            .insert([
              { id: userId, email: userEmail, role: 'user' }
            ])
            .select()
            .single();
          
          if (!insertError && userData) {
            console.log('User created successfully:', userData);
            setUserData(userData as User);
            setIsAdmin(userData.role === 'admin');
            setIsCreator(userData.role === 'creator');
          } else {
            console.error('Error creating user data:', insertError);
          }
        } else {
          console.error('Error fetching user data:', error);
        }
      } else if (data) {
        console.log('User data loaded:', data);
        setUserData(data as User);
        setIsAdmin(data?.role === 'admin');
        setIsCreator(data?.role === 'creator');
        console.log('Role assignments:', { 
          role: data.role,
          isAdmin: data?.role === 'admin', 
          isCreator: data?.role === 'creator' 
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in:', error);
      // If error is 400 and the table doesn't exist, we'll provide a helpful error
      if (error.status === 400) {
        throw new Error('Failed to sign in. Please make sure the database is properly set up by running "npm run init-db".');
      }
      throw error;
    }
  }

  async function signUp(email: string, password: string) {
    // This function is now deprecated in favor of direct Supabase auth in the signup form
    // to allow users to choose their role, but we keep it for backward compatibility
    try {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      // Create user entry in users table
      if (data?.user) {
        try {
          const { error: userError } = await supabase.from('users').insert([
            { id: data.user.id, email, role: 'user' }
          ]);
          
          if (userError) {
            // If table doesn't exist, provide a helpful error
            if (userError.code === '42P01') {
              throw new Error('Users table does not exist. Please run "npm run init-db" to set up the database.');
            }
            throw userError;
          }
        } catch (err) {
          console.error('Error creating user record:', err);
          throw err;
        }
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      // If rate limited, provide a helpful message
      if (error.status === 429) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      throw error;
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push('/');
  }

  const value = {
    session,
    user,
    userData,
    isLoading,
    isAdmin,
    isCreator,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 