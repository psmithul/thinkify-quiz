'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorFallback } from '@/components/ErrorFallback';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';

type AuthContextType = {
  session: Session | null;
  user: SupabaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isCreator: boolean;
  error: Error | null;
  retryAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; redirectTo?: string }>;
  signInWithLinkedIn: () => Promise<{ success: boolean; redirectTo?: string }>;
  signUp: (email: string, password: string) => Promise<void>;
  signUpWithLinkedIn: () => Promise<void>;
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
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Loading timeout - redirect to homepage if auth takes too long
  const { hasTimedOut } = useLoadingTimeout(isLoading, {
    timeout: 15000, // 15 seconds for auth
    onTimeout: () => {
      console.warn('Auth timeout reached, redirecting to homepage');
      setIsLoading(false);
      setError(new Error('Authentication timeout - please try again'));
    }
  });

  // Handle tab visibility to prevent unnecessary operations when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const retryAuth = useCallback(async () => {
    if (retryCount >= 3) {
      setError(new Error('Maximum retry attempts reached. Please refresh the page.'));
      return;
    }

    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoading(true);

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchUserData(currentSession.user);
      } else {
        setSession(null);
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        setIsCreator(false);
        setIsLoading(false);
      }
    } catch (retryError) {
      console.error('Auth retry failed:', retryError);
      setError(retryError instanceof Error ? retryError : new Error('Auth retry failed'));
      setIsLoading(false);
    }
  }, [retryCount]);

  const fetchUserData = useCallback(async (authUser: SupabaseUser) => {
    // Don't fetch data when tab is not visible to save resources
    if (!isTabVisible) {
      console.log('Tab not visible, skipping user data fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching user data for:', authUser.email);
      
      // Add timeout to prevent hanging - increased to 15 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User data fetch timeout')), 15000);
      });
      
      // Try to find existing user in database
      const fetchPromise = supabase
        .from('users')
        .select('id, email, role, full_name, bio, job_title, location, company, linkedin_url, phone, profile_image, created_at, updated_at')
        .eq('id', authUser.id)
        .maybeSingle();
      
      const { data: existingUser, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;
      
      if (fetchError) {
        console.warn('Database fetch error:', fetchError.message);
        // Don't throw immediately, try to create emergency profile
        if (fetchError.message === 'User data fetch timeout') {
          console.warn('⚠️  Database is slow, creating emergency profile...');
          // Create emergency profile immediately instead of throwing
          const emergencyProfile: User = {
            id: authUser.id,
            email: authUser.email || 'unknown@example.com',
            full_name: extractLinkedInName(authUser) || null,
            bio: null,
            job_title: null,
            location: null,
            company: null,
            linkedin_url: extractLinkedInUrl(authUser) || null,
            phone: null,
            profile_image: extractProfilePicture(authUser) || null,
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setUserData(emergencyProfile);
          setIsAdmin(false);
          setIsCreator(false);
          setIsLoading(false);
          setRetryCount(0);
          return;
        }
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      if (existingUser) {
        console.log('✅ Found existing user in database');
        setUserData(existingUser);
        setIsAdmin(existingUser.role === 'admin');
        setIsCreator(existingUser.role === 'creator');
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
        return;
      }
      
      // Create new user profile with LinkedIn data if available
      const linkedInName = extractLinkedInName(authUser);
      const linkedInUrl = extractLinkedInUrl(authUser);
      const profilePicture = extractProfilePicture(authUser);
      
      const newUserProfile = {
        id: authUser.id,
        email: authUser.email!,
        full_name: linkedInName || null,
        bio: null,
        job_title: null,
        location: null,
        company: null,
        linkedin_url: linkedInUrl || null,
        phone: null,
        profile_image: profilePicture || null,
        role: 'user' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const createPromise = supabase
        .from('users')
        .insert([newUserProfile])
        .select()
        .maybeSingle();
      
      const { data: createdUser, error: createError } = await Promise.race([
        createPromise,
        timeoutPromise
      ]) as any;
      
      if (createError) {
        console.warn('Database create error:', createError.message);
        // Use profile without database but don't throw error
        setUserData(newUserProfile);
        setIsAdmin(false);
        setIsCreator(false);
        setIsLoading(false);
        setRetryCount(0);
        return;
      }
      
      if (createdUser) {
        console.log('✅ User profile created in database');
        setUserData(createdUser);
        setIsAdmin(false);
        setIsCreator(false);
        setIsLoading(false);
        setRetryCount(0);
      }
      
    } catch (error) {
      console.error('Auth error:', error);
      
      // Create emergency profile to prevent complete failure
      const emergencyProfile: User = {
        id: authUser.id,
        email: authUser.email || 'unknown@example.com',
        full_name: extractLinkedInName(authUser) || null,
        bio: null,
        job_title: null,
        location: null,
        company: null,
        linkedin_url: extractLinkedInUrl(authUser) || null,
        phone: null,
        profile_image: extractProfilePicture(authUser) || null,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setUserData(emergencyProfile);
      setIsAdmin(false);
      setIsCreator(false);
      setIsLoading(false);
      
      // Set error but don't break the app
      if (error instanceof Error) {
        setError(error);
      } else {
        setError(new Error('Failed to load user data completely'));
      }
    }
  }, [isTabVisible]);

  // Helper functions to extract LinkedIn data (OpenID Connect format)
  const extractLinkedInName = (user: SupabaseUser): string | null => {
    // OpenID Connect format provides 'name', 'given_name', 'family_name'
    if (user.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user.user_metadata?.given_name && user.user_metadata?.family_name) {
      return `${user.user_metadata.given_name} ${user.user_metadata.family_name}`;
    }
    // Fallback to legacy format if present
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user.user_metadata?.first_name && user.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    return null;
  };

  const extractLinkedInUrl = (user: SupabaseUser): string | null => {
    // Try to get LinkedIn profile URL from metadata
    if (user.user_metadata?.linkedin_url) {
      return user.user_metadata.linkedin_url;
    }
    if (user.user_metadata?.profile_url) {
      return user.user_metadata.profile_url;
    }
    // OpenID Connect provides 'sub' as the unique identifier
    // We can try to construct a LinkedIn URL, but this may not always work
    if (user.user_metadata?.sub) {
      const sub = user.user_metadata.sub;
      if (typeof sub === 'string' && sub.length > 0) {
        // Note: This may not work for all LinkedIn accounts
        // LinkedIn doesn't always provide the profile URL directly
        return null; // Better to leave empty than guess incorrectly
      }
    }
    return null;
  };

  const extractProfilePicture = (user: SupabaseUser): string | null => {
    // OpenID Connect provides 'picture' field
    if (user.user_metadata?.picture) {
      return user.user_metadata.picture;
    }
    if (user.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session, tab visible:', isTabVisible);
        
        // Set a fallback timeout to ensure loading never hangs forever
        initializationTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('Session initialization timeout, clearing loading state');
            setIsLoading(false);
          }
        }, 10000); // 10 second timeout

        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Initial session error:', error);
          clearTimeout(initializationTimeout);
          setIsLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && isTabVisible) {
          await fetchUserData(session.user);
        } else {
          clearTimeout(initializationTimeout);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          clearTimeout(initializationTimeout);
          setIsLoading(false);
        }
      }
    };

    // Only initialize when tab is visible or on first load
    if (isTabVisible || !user) {
      getInitialSession();
    } else {
      // If tab becomes hidden and we already have a user, just clear loading
      setIsLoading(false);
    }

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.email, 'tab visible:', isTabVisible);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && isTabVisible) {
        await fetchUserData(session.user);
      } else {
        setUserData(null);
        setIsAdmin(false);
        setIsCreator(false);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initializationTimeout);
      subscription.unsubscribe();
    };
  }, [isTabVisible]); // Remove fetchUserData dependency to prevent infinite loops

  // Handle tab visibility changes - refresh data when tab becomes visible again
  useEffect(() => {
    if (isTabVisible && user && !userData && !isLoading) {
      console.log('Tab became visible, refreshing user data');
      fetchUserData(user);
    }
  }, [isTabVisible, user, userData, isLoading, fetchUserData]);

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Provide better error messages for common issues
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else if (error.message.includes('too_many_requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        }
        throw error;
      }

      // Ensure user exists in our database
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .maybeSingle();

        if (userError) {
          console.warn('Error fetching user data:', userError);
          // Still allow login, user data will be created automatically
        }

        if (userData) {
          const redirectTo = userData.role === 'admin' ? '/admin/dashboard' : 
                           userData.role === 'creator' ? '/creator/dashboard' : 
                           '/user/dashboard';
          return { success: true, redirectTo };
        }
      }
      
      return { success: true, redirectTo: '/user/dashboard' };
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithLinkedIn = async (): Promise<{ success: boolean; redirectTo?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email'
        }
      });

      if (error) throw error;

      // OAuth redirect will handle the rest
      return { success: true };
    } catch (error: any) {
      console.error('LinkedIn sign in error:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // User profile will be created automatically by the auth listener
      console.log('User signed up, profile will be created automatically');
    } catch (error: any) {
      throw error;
    }
  };

  const signUpWithLinkedIn = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'openid profile email'
        }
      });

      if (error) throw error;

      // OAuth redirect will handle the rest
      console.log('LinkedIn OAuth initiated for signup');
    } catch (error: any) {
      console.error('LinkedIn sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setUserData(null);
      setSession(null);
      setIsAdmin(false);
      setIsCreator(false);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      if (typeof window !== 'undefined') {
        // Use replace to prevent back button issues
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    session,
    user,
    userData,
    isLoading,
    isAdmin,
    isCreator,
    error,
    retryAuth,
    signIn: signInWithEmail,
    signInWithLinkedIn,
    signUp: signUpWithEmail,
    signUpWithLinkedIn,
    signOut,
  };

  // Show error state if there's a critical error
  if (error && !isLoading && !userData) {
    return (
      <AuthContext.Provider value={value}>
        <ErrorFallback
          error={error}
          resetError={() => {
            setError(null);
            retryAuth();
          }}
          showDetails={process.env.NODE_ENV === 'development'}
          autoRetry={false} // Manual retry only for auth errors
          redirectDelay={20000} // 20 seconds before redirect
        />
      </AuthContext.Provider>
    );
  }

  // Show loading state with timeout
  if (isLoading && !hasTimedOut) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
          <LoadingSpinner
            isLoading={true}
            message="Initializing your account..."
            showTimeout={true}
            timeoutDuration={15000}
            size="lg"
            className="min-h-screen"
          />
        </div>
      </AuthContext.Provider>
    );
  }

  // Show timeout state
  if (hasTimedOut) {
    return (
      <AuthContext.Provider value={value}>
        <ErrorFallback
          error={new Error('Authentication is taking longer than expected')}
          resetError={() => {
            setError(null);
            retryAuth();
          }}
          showDetails={false}
          autoRetry={true}
          redirectDelay={10000} // 10 seconds before redirect
        />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      <OnboardingGuard>
        {children}
      </OnboardingGuard>
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