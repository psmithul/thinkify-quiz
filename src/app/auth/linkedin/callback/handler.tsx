'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LinkedInCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing LinkedIn authentication...');

  useEffect(() => {
    async function handleLinkedInCallback() {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        
        console.log('LinkedIn callback received:', {
          code: code ? code.substring(0, 10) + '...' : null,
          error,
          fullUrl: typeof window !== 'undefined' ? window.location.href : 'SSR'
        });
        
        if (error) {
          throw new Error(`LinkedIn OAuth error: ${error}`);
        }
        
        if (!code) {
          throw new Error('Missing authorization code');
        }
        
        console.log('Exchanging code for session with Supabase...');
        setMessage('Exchanging authorization code for session...');
        
        // Use Supabase's built-in code exchange
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        
        if (exchangeError) {
          console.error('Code exchange failed:', exchangeError);
          throw exchangeError;
        }
        
        if (!data.user) {
          throw new Error('No user data received from LinkedIn');
        }
        
        console.log('LinkedIn user data received:', {
          userId: data.user.id,
          email: data.user.email,
          fullName: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
          picture: data.user.user_metadata?.picture || data.user.user_metadata?.avatar_url,
          linkedinUrl: data.user.user_metadata?.linkedin_url,
          rawMetadata: data.user.user_metadata
        });
        
        setMessage('Creating your profile with LinkedIn data...');
        
        // Check if user came from creator signup (check referrer or local storage)
        // Only access browser APIs if we're in the browser
        let isCreatorSignup = false;
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          isCreatorSignup = document.referrer.includes('/auth/creator-signup') || 
                           window.localStorage.getItem('linkedin_creator_signup') === 'true';
          
          // Clear localStorage flag if it exists
          window.localStorage.removeItem('linkedin_creator_signup');
        }
        
        // Extract LinkedIn profile data with fallbacks
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || 
                    data.user.user_metadata?.name || 
                    data.user.user_metadata?.given_name + ' ' + data.user.user_metadata?.family_name || 
                    data.user.email?.split('@')[0],
          profile_image: data.user.user_metadata?.picture || 
                        data.user.user_metadata?.avatar_url,
          linkedin_url: data.user.user_metadata?.linkedin_url,
          role: isCreatorSignup ? 'creator' : 'user', // Assign role based on signup context
          // Extract additional LinkedIn data if available
          job_title: data.user.user_metadata?.job_title || 
                    data.user.user_metadata?.headline,
          location: data.user.user_metadata?.location,
          bio: data.user.user_metadata?.summary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('Prepared profile data:', {
          ...profileData,
          isCreatorSignup,
          role: profileData.role
        });
        
        // Update or create user profile in our users table
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .upsert(profileData, {
            onConflict: 'id',
            ignoreDuplicates: false
          })
          .select()
          .single();
        
        if (profileError) {
          console.error('Profile update failed:', profileError);
          throw profileError;
        }
        
        console.log('User profile created/updated successfully:', userData);
        
        setStatus('success');
        setMessage(`LinkedIn authentication successful! Welcome to Thinkify${userData.role === 'creator' ? ' as a creator' : ''}!`);
        
        // Determine redirect based on user role
        const redirectUrl = userData.role === 'admin' ? '/admin/dashboard' : 
                           userData.role === 'creator' ? '/creator/dashboard' : 
                           '/user/dashboard';
        
        console.log('Redirecting to:', redirectUrl);
        
        // Redirect to appropriate dashboard
        setTimeout(() => {
          router.push(redirectUrl);
        }, 2000);
        
      } catch (err) {
        console.error('LinkedIn callback error:', err);
        
        let errorMessage = 'Failed to process LinkedIn authentication';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        
        setStatus('error');
        setMessage(errorMessage);
        
        // Redirect to login page after error
        setTimeout(() => {
          router.push('/auth/login?error=' + encodeURIComponent(errorMessage));
        }, 5000);
      }
    }
    
    // Only run if we have the necessary parameters
    if (searchParams.get('code') || searchParams.get('error')) {
      handleLinkedInCallback();
    } else {
      // Redirect to login if we're on this page without callback parameters
      router.push('/auth/login');
    }
  }, [searchParams, router]);

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
                  <p className="text-gray-600 mt-2">Please wait while we complete your LinkedIn authentication...</p>
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
                  <p className="text-green-700 mt-2">Your LinkedIn profile has been imported successfully!</p>
                  <p className="text-gray-600 text-sm mt-2">Redirecting to your dashboard...</p>
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 