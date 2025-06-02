'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { useRouter } from 'next/navigation';
import { ProfileCompletionGuard } from '@/components/ProfileCompletionGuard';
import { User } from '@/types/user';

type AuthContextType = {
  session: Session | null;
  user: SupabaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; redirectTo?: string }>;
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

  const fetchUserData = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      
      // Query to get complete user data including LinkedIn fields
      const { data, error } = await supabase
        .from('users')
        .select('*') // Fetch all fields including LinkedIn data
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

      console.log('Fetched user data:', data);

      if (error) {
        console.warn('Error fetching user data:', error);
        
        // If user doesn't exist, try to create one with basic info
        if (error.code === 'PGRST116' || error.details?.includes('0 rows')) {
          try {
            const userEmail = user?.email || session?.user?.email || 'unknown@example.com';
            const userName = user?.user_metadata?.full_name || session?.user?.user_metadata?.full_name || '';
            
            console.log('Creating new user with email:', userEmail, 'name:', userName);
            console.log('User metadata available:', user?.user_metadata);
            
            const newUserData = {
              id: userId,
              email: userEmail,
              full_name: userName && userName.trim().length >= 2 ? userName.trim() : '', // Ensure empty if invalid
              role: 'user'
            };
            
            console.log('Inserting new user data:', newUserData);
            
            const { data: newUserData_result, error: insertError } = await supabase
              .from('users')
              .insert([newUserData])
              .select('*') // Fetch all fields
              .single();

            if (!insertError && newUserData_result) {
              console.log('Created new user:', newUserData_result);
              setUserData(newUserData_result as User);
              setIsAdmin(newUserData_result.role === 'admin');
              setIsCreator(newUserData_result.role === 'creator');
            } else {
              console.warn('Failed to create user profile:', insertError);
              // Set minimal user data from auth session
              setUserData({
                id: userId,
                email: userEmail,
                full_name: userName || userEmail.split('@')[0],
                role: 'user'
              } as User);
            }
          } catch (createError) {
            console.warn('Error creating user profile:', createError);
            // Fallback: create minimal user data from session
            const userEmail = user?.email || session?.user?.email || 'unknown@example.com';
            setUserData({
              id: userId,
              email: userEmail,
              full_name: userEmail.split('@')[0],
              role: 'user'
            } as User);
          }
        }
      } else if (data) {
        console.log('Setting user data:', data);
        setUserData(data as User);
        setIsAdmin(data.role === 'admin');
        setIsCreator(data.role === 'creator');
      } else {
        // No user data found, create minimal profile
        const userEmail = user?.email || session?.user?.email || 'unknown@example.com';
        const userName = user?.user_metadata?.full_name || session?.user?.user_metadata?.full_name || '';
        
        console.log('No user data found, creating minimal profile');
        setUserData({
          id: userId,
          email: userEmail,
          full_name: userName || userEmail.split('@')[0],
          role: 'user'
        } as User);
      }
    } catch (error) {
      console.warn('Unexpected error in fetchUserData:', error);
      // Fallback: create basic user data from auth session
      const userEmail = user?.email || session?.user?.email || 'unknown@example.com';
      setUserData({
        id: userId,
        email: userEmail,
        full_name: userEmail.split('@')[0],
        role: 'user'
      } as User);
    } finally {
      setIsLoading(false);
    }
  }, [user, session]);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Fetch user data to determine redirect
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        if (!userError && userData) {
          // Determine redirect path based on role
          let redirectTo = '/user/dashboard'; // default
          
          if (userData.role === 'admin') {
            redirectTo = '/admin/dashboard';
          } else if (userData.role === 'creator') {
            redirectTo = '/creator/dashboard';
          }
          
          return { success: true, redirectTo };
        }
      }
      
      return { success: true, redirectTo: '/user/dashboard' };
    } catch (error: any) {
      // If error is 400 and the table doesn't exist, we'll provide a helpful error
      if (error.status === 400) {
        throw new Error('Failed to sign in. Please make sure the database is properly set up by running "npm run init-db".');
      }
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
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
          throw err;
        }
      }
    } catch (error: any) {
      // If rate limited, provide a helpful message
      if (error.status === 429) {
        throw new Error('Too many signup attempts. Please try again later.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // First clear local state
      setUser(null);
      setUserData(null);
      setSession(null);
      setIsAdmin(false);
      setIsCreator(false);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Force navigation to home page only in browser
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      // Handle sign out error silently in production
    }
  };

  const value = {
    session,
    user,
    userData,
    isLoading,
    isAdmin,
    isCreator,
    signIn: signInWithEmail,
    signUp: signUpWithEmail,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      <ProfileCompletionGuard>
        {children}
      </ProfileCompletionGuard>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 