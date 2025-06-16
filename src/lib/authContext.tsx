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
  
  // Initialize states with localStorage values to prevent loading flicker
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUserData = localStorage.getItem('thinkify_user_data');
        const storedIsAdmin = localStorage.getItem('thinkify_is_admin');
        const storedIsCreator = localStorage.getItem('thinkify_is_creator');
        
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          setUserData(parsedUserData);
          setIsAdmin(storedIsAdmin === 'true');
          setIsCreator(storedIsCreator === 'true');
          // If we have stored user data, don't show loading initially
          setIsLoading(false);
          setHasInitialized(true);
        }
      } catch (error) {
        console.warn('Error restoring auth state from localStorage:', error);
      }
      setIsHydrated(true);
    }
  }, []);

  // Persist user data to localStorage
  const persistUserData = (userData: User | null, isAdmin: boolean, isCreator: boolean) => {
    if (typeof window !== 'undefined') {
      try {
        if (userData) {
          localStorage.setItem('thinkify_user_data', JSON.stringify(userData));
          localStorage.setItem('thinkify_is_admin', isAdmin.toString());
          localStorage.setItem('thinkify_is_creator', isCreator.toString());
        } else {
          localStorage.removeItem('thinkify_user_data');
          localStorage.removeItem('thinkify_is_admin');
          localStorage.removeItem('thinkify_is_creator');
        }
      } catch (error) {
        console.warn('Error persisting auth state to localStorage:', error);
      }
    }
  };

  // Loading timeout - redirect to homepage if auth takes too long
  const { hasTimedOut } = useLoadingTimeout(isLoading, {
    timeout: 15000, // 15 seconds for auth
    onTimeout: () => {
      console.warn('Auth timeout reached, redirecting to homepage');
      setIsLoading(false);
      setError(new Error('Authentication timeout - please try again'));
    }
  });

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
        // Call fetchUserData directly without dependency
        const authUser = currentSession.user;
        
        try {
          // Only show loading if we don't have user data yet and we're hydrated
          if (!userData && isHydrated && !hasInitialized) {
            setIsLoading(true);
          }
          setError(null);
          
          console.log('Fetching user data for:', authUser.email);
          
          // Quick retry logic for retryAuth
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email, role, full_name, bio, job_title, location, company, linkedin_url, phone, profile_image, created_at, updated_at')
            .eq('id', authUser.id)
            .maybeSingle();
          
          if (!fetchError && existingUser) {
            const isAdminUser = existingUser.role === 'admin';
            const isCreatorUser = existingUser.role === 'creator';
            
            setUserData(existingUser);
            setIsAdmin(isAdminUser);
            setIsCreator(isCreatorUser);
            persistUserData(existingUser, isAdminUser, isCreatorUser);
            setIsLoading(false);
            setRetryCount(0);
          } else {
            throw new Error('Failed to fetch user data during retry');
          }
        } catch (userError) {
          console.error('User data fetch failed during retry:', userError);
          throw userError;
        }
      } else {
        setSession(null);
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        setIsCreator(false);
        persistUserData(null, false, false);
        setIsLoading(false);
      }
    } catch (retryError) {
      console.error('Auth retry failed:', retryError);
      setError(retryError instanceof Error ? retryError : new Error('Auth retry failed'));
      setIsLoading(false);
    }
  }, [retryCount, userData, isHydrated, hasInitialized]);

  const fetchUserData = useCallback(async (authUser: SupabaseUser) => {
    try {
      // Only show loading if we don't have user data yet and we're hydrated
      if (!userData && isHydrated && !hasInitialized) {
        setIsLoading(true);
      }
      setError(null);
      
      console.log('Fetching user data for:', authUser.email);
      
      // Shorter timeout to fail faster and use emergency profile
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('User data fetch timeout')), 8000); // Reduced to 8 seconds
      });
      
      let existingUser = null;
      let fetchError = null;
      
      try {
        // Try to find existing user in database
        const fetchPromise = supabase
          .from('users')
          .select('id, email, role, full_name, bio, job_title, location, company, linkedin_url, phone, profile_image, created_at, updated_at')
          .eq('id', authUser.id)
          .maybeSingle();
        
        const result = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]) as any;
        
        existingUser = result.data;
        fetchError = result.error;
      } catch (timeoutError) {
        console.warn('⚠️  Database fetch timed out, using emergency profile');
        // Don't re-throw, just use emergency profile
        fetchError = timeoutError;
      }
      
      // Handle timeout or other database errors gracefully
      if (fetchError) {
        console.warn('Database fetch issue:', fetchError.message);
        
        // Create emergency profile immediately for any database issue
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
        
        console.log('✅ Using emergency profile for user:', authUser.email);
        setUserData(emergencyProfile);
        setIsAdmin(false);
        setIsCreator(false);
        persistUserData(emergencyProfile, false, false);
        setIsLoading(false);
        setRetryCount(0);
        
        // Set a non-blocking warning
        setError(new Error('Using offline profile - some features may be limited'));
        return;
      }
      
      if (existingUser) {
        console.log('✅ Found existing user in database');
        const isAdminUser = existingUser.role === 'admin';
        const isCreatorUser = existingUser.role === 'creator';
        
        setUserData(existingUser);
        setIsAdmin(isAdminUser);
        setIsCreator(isCreatorUser);
        persistUserData(existingUser, isAdminUser, isCreatorUser);
        setIsLoading(false);
        setRetryCount(0); // Reset retry count on success
        return;
      }
      
      // Try to create new user profile, but with timeout protection
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
      
      let createdUser = null;
      let createError = null;
      
      try {
        const createPromise = supabase
          .from('users')
          .insert([newUserProfile])
          .select()
          .maybeSingle();
        
        const result = await Promise.race([
          createPromise,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('User creation timeout')), 8000);
          })
        ]) as any;
        
        createdUser = result.data;
        createError = result.error;
      } catch (timeoutError) {
        console.warn('⚠️  User creation timed out, using local profile');
        createError = timeoutError;
      }
      
      if (createError) {
        console.warn('Database create issue:', createError.message);
        // Use profile locally even if database insert failed
        setUserData(newUserProfile);
        setIsAdmin(false);
        setIsCreator(false);
        persistUserData(newUserProfile, false, false);
        setIsLoading(false);
        setRetryCount(0);
        
        // Set a non-blocking warning
        setError(new Error('Using local profile - will sync when database is available'));
        return;
      }
      
      if (createdUser) {
        console.log('✅ User profile created in database');
        setUserData(createdUser);
        setIsAdmin(false);
        setIsCreator(false);
        persistUserData(createdUser, false, false);
        setIsLoading(false);
        setRetryCount(0);
      }
      
    } catch (error) {
      // Final fallback - ensure we never crash
      console.warn('Auth error caught, creating fallback profile:', error);
      
      const fallbackProfile: User = {
        id: authUser.id,
        email: authUser.email || 'unknown@example.com',
        full_name: extractLinkedInName(authUser) || authUser.email?.split('@')[0] || 'User',
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
      
      console.log('✅ Using fallback profile for user:', authUser.email);
      setUserData(fallbackProfile);
      setIsAdmin(false);
      setIsCreator(false);
      persistUserData(fallbackProfile, false, false);
      setIsLoading(false);
      
      // Set a non-blocking error message
      setError(new Error('Limited connectivity - using offline mode'));
    }
  }, [isHydrated, userData, hasInitialized]);

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
    // Don't start auth initialization until we've hydrated from localStorage
    if (!isHydrated) return;
    
    let mounted = true;
    let initializationTimeout: NodeJS.Timeout;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session');
        
        // Only set loading if we don't have stored user data and haven't initialized yet
        if (!hasInitialized && !userData) {
          setIsLoading(true);
        }
        
        // Set a fallback timeout to ensure loading never hangs forever
        initializationTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('Session initialization timeout, clearing loading state');
            setIsLoading(false);
            setHasInitialized(true);
          }
        }, 10000); // 10 second timeout

        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        if (error) {
          console.error('Initial session error:', error);
          clearTimeout(initializationTimeout);
          setIsLoading(false);
          setHasInitialized(true);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await fetchUserData(session.user);
          } catch (fetchError) {
            console.warn('Error in initial session fetchUserData:', fetchError);
            // Don't throw - fetchUserData already handles errors internally
            // This is just a safety net
          }
        } else {
          // Clear stored data if no session
          persistUserData(null, false, false);
          clearTimeout(initializationTimeout);
          setIsLoading(false);
        }
        
        setHasInitialized(true);
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted) {
          clearTimeout(initializationTimeout);
          setIsLoading(false);
          setHasInitialized(true);
        }
      }
    };

    // Always try to get initial session, but only show loading on first init
    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.email);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await fetchUserData(session.user);
        } catch (fetchError) {
          console.warn('Error in auth state change fetchUserData:', fetchError);
          // Don't throw - fetchUserData already handles errors internally
          // This is just a safety net to prevent any unhandled errors from crashing the app
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
        setIsCreator(false);
        persistUserData(null, false, false);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(initializationTimeout);
      subscription.unsubscribe();
    };
  }, [isHydrated]); // Only depend on hydration state to prevent re-initialization

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
      
      // Clear localStorage
      persistUserData(null, false, false);
      
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

  // Show error state only for critical errors that prevent app functionality
  // Don't show error fallback if we have user data (even with warnings)
  if (error && !isLoading && !userData) {
    // Check if it's a database connectivity issue
    const isDatabaseIssue = error.message.includes('offline') || 
                           error.message.includes('timeout') || 
                           error.message.includes('Limited connectivity') ||
                           error.message.includes('Using offline profile');
    
    // For database issues, still try to render the app normally
    if (isDatabaseIssue) {
      console.log('Database connectivity issue detected, but continuing with app...');
      // Continue to render the app normally
    } else {
      // Only show error fallback for non-database critical errors
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