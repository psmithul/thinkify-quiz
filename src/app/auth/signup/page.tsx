'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { authDebugger, validateSignupData, checkEnvironmentVariables } from '@/utils/authDebug';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    acceptTerms: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check environment on page load
    checkEnvironmentVariables();
    authDebugger.testSupabaseConnection();
    authDebugger.testDatabaseConnection();

    // Check if user is already authenticated
    async function checkCurrentUser() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        authDebugger.log('Already Authenticated', true, { userId: session.user.id });
      }
      setIsCheckingAuth(false);
    }
    
    checkCurrentUser();
  }, []);

  // If user is already authenticated, show different content
  if (currentUser && !isCheckingAuth) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">✅</span>
                </div>
              </div>
              <h2 className="heading-2 text-center">You're Already Signed In!</h2>
              <p className="text-gray-600 text-lg mb-8">You're already authenticated with Thinkify</p>
              
              <div className="space-y-4">
                <Button
                  onClick={() => router.push('/user/dashboard')}
                  className="w-full btn-primary"
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.reload();
                  }}
                  variant="outline"
                  className="w-full btn-outline"
                >
                  Sign Out & Create New Account
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation with debug logging
    const validationErrors = validateSignupData(formData);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.join(', ');
      authDebugger.log('Form Validation', false, { errors: validationErrors }, errorMessage);
      setError(errorMessage);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      authDebugger.log('Signup Started', true, { email: formData.email });
      
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
          }
        }
      });

      if (signUpError) {
        authDebugger.log('Supabase Signup', false, { email: formData.email }, signUpError.message);
        throw signUpError;
      }

      authDebugger.log('Supabase Signup', true, { 
        userId: data.user?.id, 
        email: data.user?.email,
        hasSession: !!data.session 
      });

      // Create user profile if signup was successful
      if (data.user) {
        authDebugger.log('Profile Creation Started', true, { userId: data.user.id });
        
        const profileData = {
          id: data.user.id,
          email: formData.email,
          full_name: formData.fullName,
          role: 'user', // Default role
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Check if user profile already exists (in case of re-signup)
        const { data: existingProfile, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (existingProfile) {
          authDebugger.log('Profile Update', true, { userId: data.user.id, exists: true });
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: formData.email,
              full_name: formData.fullName,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          if (updateError) {
            authDebugger.log('Profile Update', false, { userId: data.user.id }, updateError.message);
            // Don't throw error here as the user account was created successfully
          }
        } else {
          authDebugger.log('Profile Creation', true, { userId: data.user.id, exists: false });
          const { error: profileError } = await supabase
            .from('users')
            .insert([profileData]);

          if (profileError) {
            authDebugger.log('Profile Creation', false, profileData, profileError.message);
            // Don't throw error here as the user account was created successfully
          }
        }

        // Check if email confirmation is required
        if (data.session) {
          // User is immediately signed in, redirect to dashboard
          authDebugger.log('Immediate Signin', true, { userId: data.user.id });
          setSuccess('Account created successfully! Redirecting to your dashboard...');
          
          setTimeout(() => {
            router.push('/user/dashboard');
          }, 2000);
        } else {
          // Email confirmation required
          authDebugger.log('Email Confirmation Required', true, { userId: data.user.id });
          setSuccess('Account created successfully! Please check your email to verify your account, then sign in.');
          
          // Redirect to login after a longer delay
          setTimeout(() => {
            router.push('/auth/login');
          }, 4000);
        }
      } else {
        authDebugger.log('No User Data', false, { hasData: !!data }, 'No user data returned from signup');
        throw new Error('No user data returned from signup');
      }
    } catch (err) {
      authDebugger.log('Signup Failed', false, { email: formData.email }, formatErrorMessage(err));
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSignup = async () => {
    setIsLinkedInLoading(true);
    setError(null);

    try {
      authDebugger.log('LinkedIn OAuth Started', true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/linkedin/callback`,
          scopes: 'profile email openid'
        }
      });

      if (error) {
        authDebugger.log('LinkedIn OAuth', false, null, error.message);
        throw error;
      }

      authDebugger.log('LinkedIn OAuth', true, { redirecting: true });
      // The redirect will happen automatically
    } catch (err) {
      authDebugger.log('LinkedIn Signup Failed', false, null, formatErrorMessage(err));
      setError(formatErrorMessage(err));
      setIsLinkedInLoading(false);
    }
  };

  // Debug helper - only show in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Debug Panel - Only in development */}
          {isDevelopment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-100 p-4 rounded-lg text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Debug Mode</span>
                <button
                  onClick={() => authDebugger.downloadDebugReport()}
                  className="text-blue-600 hover:text-blue-800 text-xs"
                >
                  Download Debug Log
                </button>
              </div>
              <p className="text-gray-600">Check browser console for detailed logs</p>
            </motion.div>
          )}

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🚀</span>
              </div>
            </div>
            <h2 className="heading-2 text-center">Join Thinkify</h2>
            <p className="text-gray-600 text-lg">Create your account and start learning</p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="form-container"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="status-error"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">❌</span>
                    <div>
                      <p className="font-semibold">Registration Failed</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="status-success"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="font-semibold">Success!</p>
                      <p className="text-sm mt-1">{success}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="form-group">
                <label htmlFor="fullName" className="form-label required">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label required">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label required">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Create a password (min. 6 characters)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label required">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm your password"
                />
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    required
                    checked={formData.acceptTerms}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="acceptTerms" className="text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="font-medium text-purple-600 hover:text-purple-500">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="font-medium text-purple-600 hover:text-purple-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.password || !formData.fullName || !formData.acceptTerms}
                  className="w-full btn-primary"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full btn-outline flex items-center justify-center gap-3"
                  onClick={handleLinkedInSignup}
                  disabled={isLinkedInLoading}
                  isLoading={isLinkedInLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  {isLinkedInLoading ? 'Connecting...' : 'Continue with LinkedIn'}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-semibold text-purple-600 hover:text-purple-500 transition-colors">
                Sign in
              </Link>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Want to create content?{' '}
                <Link href="/make-me-creator" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Become a Creator
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 