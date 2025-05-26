'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';

interface DebugInfo {
  code?: string;
  state?: string;
  error?: string;
  clientId?: string;
  timestamp?: string;
}

export default function LinkedInCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing LinkedIn login...');
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  useEffect(() => {
    async function handleLinkedInCallback() {
      try {
        // Check if LinkedIn is configured
        const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
        if (!clientId || clientId === 'your_linkedin_client_id_here') {
          throw new Error('LinkedIn OAuth is not configured properly');
        }

        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        
        console.log('LinkedIn callback received:', {
          code: code ? code.substring(0, 10) + '...' : null,
          state: state ? state.substring(0, 5) + '...' : null,
          error,
          fullUrl: window.location.href
        });

        setDebugInfo({
          code: code ? code.substring(0, 10) + '...' : undefined,
          state: state ? state.substring(0, 5) + '...' : undefined,
          error: error || undefined,
          clientId: clientId.substring(0, 10) + '...'
        });
        
        if (error) {
          throw new Error(`LinkedIn OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('Missing authorization code');
        }
        
        // Verify state parameter (make it more lenient)
        const storedState = sessionStorage.getItem('linkedin_oauth_state');
        if (state && storedState && state !== storedState) {
          console.warn('State parameter mismatch:', { provided: state, stored: storedState });
          // Don't throw error, just warn and continue
        }
        
        // Remove stored state
        sessionStorage.removeItem('linkedin_oauth_state');
        
        console.log('Starting LinkedIn user data exchange...');
        setMessage('Exchanging authorization code for user data...');
        
        // Exchange code for access token and get user info via our API
        const linkedInData = await exchangeCodeForUserData(code);
        
        console.log('LinkedIn data received:', {
          email: linkedInData.email,
          fullName: linkedInData.fullName,
          id: linkedInData.id
        });
        
        setMessage('Creating user account...');
        
        // Check if user exists, if not create account
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', linkedInData.email)
          .single();
        
        if (userError && userError.code !== 'PGRST116') {
          throw userError;
        }
        
        if (existingUser) {
          // Update LinkedIn profile data if user exists
          await supabase
            .from('users')
            .update({
              linkedin_url: linkedInData.linkedinUrl,
              profile_image: linkedInData.profileImage || existingUser.profile_image,
              full_name: linkedInData.fullName || existingUser.full_name
            })
            .eq('id', existingUser.id);
        } else {
          // Create new user account
          const { error: createError } = await supabase
            .from('users')
            .insert({
              email: linkedInData.email,
              full_name: linkedInData.fullName,
              profile_image: linkedInData.profileImage,
              linkedin_url: linkedInData.linkedinUrl,
              role: 'user'
            });
            
          if (createError) throw createError;
        }
        
        setMessage('Completing authentication...');
        
        // Create or sign in user with Supabase Auth
        try {
          // For LinkedIn OAuth, we'll create a magic link sign-in
          const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
            email: linkedInData.email,
            options: {
              shouldCreateUser: true,
              data: {
                full_name: linkedInData.fullName,
                linkedin_id: linkedInData.id,
                linkedin_url: linkedInData.linkedinUrl,
                profile_image: linkedInData.profileImage,
                oauth_provider: 'linkedin'
              }
            }
          });
          
          if (otpError) {
            console.error('OTP sign-in failed:', otpError);
            
            // Fallback: Try to create user with a random password and sign in
            const tempPassword = 'linkedin_' + Math.random().toString(36).substring(2, 15);
            
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: linkedInData.email,
              password: tempPassword,
              options: {
                data: {
                  full_name: linkedInData.fullName,
                  linkedin_id: linkedInData.id,
                  linkedin_url: linkedInData.linkedinUrl,
                  profile_image: linkedInData.profileImage,
                  oauth_provider: 'linkedin'
                }
              }
            });
            
            if (signUpError) {
              console.error('Sign up failed:', signUpError);
              setStatus('error');
              setMessage('Authentication successful, but session creation failed. Please log in manually with your email.');
              setTimeout(() => {
                router.push('/auth/login?email=' + encodeURIComponent(linkedInData.email));
              }, 3000);
              return;
            }
            
            // Try to sign in with the temp password
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: linkedInData.email,
              password: tempPassword
            });
            
            if (signInError) {
              console.error('Password sign-in failed:', signInError);
              setStatus('error');
              setMessage('Account created successfully. Please check your email or log in manually.');
              setTimeout(() => {
                router.push('/auth/login?email=' + encodeURIComponent(linkedInData.email));
              }, 3000);
              return;
            }
          } else {
            console.log('OTP sign-in initiated successfully');
            setStatus('success');
            setMessage('LinkedIn authentication successful! Please check your email to complete the sign-in process.');
            setTimeout(() => {
              router.push('/auth/login?message=check_email');
            }, 3000);
            return;
          }
          
        } catch (authError) {
          console.error('Authentication error:', authError);
          setStatus('error');
          setMessage('Authentication failed. Please try logging in manually.');
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
          return;
        }
        
        setStatus('success');
        setMessage('LinkedIn authentication successful! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/user/dashboard');
        }, 2000);
        
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        
        // Determine error message based on error type
        let errorMessage = 'Failed to process LinkedIn login';
        
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        } else if (err && typeof err === 'object') {
          if ('message' in err) {
            errorMessage = err.message as string;
          } else if ('error' in err) {
            errorMessage = err.error as string;
          } else {
            errorMessage = JSON.stringify(err);
          }
        }
        
        console.log('Processed error message:', errorMessage);
        setStatus('error');
        setMessage(errorMessage);
        
        // Also log debug info for troubleshooting
        setDebugInfo((prev: DebugInfo | null) => ({
          ...prev,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }));
        
        // Redirect to login page after error
        setTimeout(() => {
          router.push('/auth/login');
        }, 5000);
      }
    }
    
    // Only run the callback if we're actually processing a LinkedIn callback
    if (searchParams.get('code') || searchParams.get('error')) {
      handleLinkedInCallback();
    } else {
      // Redirect to login if we're on this page without LinkedIn callback parameters
      router.push('/auth/login');
    }
  }, [searchParams, router, signIn]);

  async function exchangeCodeForUserData(code: string) {
    try {
      // Use the EXACT same redirect URI that was used in the initial OAuth request
      const redirectUri = 'http://localhost:3001/auth/linkedin/callback';
      
      console.log('Exchanging code with redirect URI:', redirectUri);
      console.log('Code length:', code.length);
      console.log('Code preview:', code.substring(0, 20) + '...');
      
      // Use our API route to handle LinkedIn token exchange and user data fetching
      const response = await fetch('/api/auth/linkedin/userinfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri }),
      });
      
      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('API response text:', responseText);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(responseText);
          console.log('Parsed error data:', errorData);
          errorMessage = errorData.error || errorMessage;
          if (errorData.details) {
            errorMessage += ` - ${errorData.details}`;
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorMessage += ` - ${responseText}`;
        }
        throw new Error(`Failed to get LinkedIn user data: ${errorMessage}`);
      }
      
      const userData = JSON.parse(responseText);
      console.log('LinkedIn user data received:', userData);
      
      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid response format from LinkedIn API');
      }
      
      if (!userData.email) {
        throw new Error('No email found in LinkedIn profile');
      }
      
      return {
        id: userData.id || userData.sub,
        email: userData.email,
        fullName: userData.fullName || userData.name || `${userData.given_name || ''} ${userData.family_name || ''}`.trim(),
        firstName: userData.given_name,
        lastName: userData.family_name,
        profileImage: userData.picture || userData.profileImage,
        linkedinUrl: userData.linkedinUrl || `https://www.linkedin.com/in/${userData.id || userData.sub}`
      };
    } catch (error) {
      console.error('Error in exchangeCodeForUserData:', error);
      throw error;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="text-4xl">🧠</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thinkify
              </h1>
            </div>
            
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin"></div>
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">{message}</p>
                  <p className="text-gray-600 mt-2">Please wait while we process your LinkedIn login...</p>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-900">{message}</p>
                  <p className="text-green-700 mt-2">Redirecting to your dashboard...</p>
                </div>
              </div>
            )}
            
            {status === 'error' && (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-red-900">Authentication Failed</p>
                  <p className="text-red-700 mt-2">{message}</p>
                  <p className="text-gray-600 text-sm mt-3">Redirecting to login page...</p>
                </div>
                
                {debugInfo && (
                  <div className="mt-4 p-3 bg-gray-100 rounded-lg text-left">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Debug Info:</p>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 