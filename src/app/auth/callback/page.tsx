'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Layout } from '@/components/Layout';
import { motion } from 'framer-motion';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading');
        
        // Get the URL hash fragment which contains OAuth data
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        
        // Check for OAuth error in URL parameters
        const errorParam = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        
        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setError(errorDescription || 'Authentication failed');
          setStatus('error');
          return;
        }

        // Handle the OAuth callback using Supabase's session handling
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          
          // Try to exchange the code for a session if we have one
          const code = urlParams.get('code');
          if (code) {
            console.log('Attempting to exchange code for session...');
            // Let Supabase handle the OAuth callback automatically
            // The session should be available after the redirect
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: retryData, error: retryError } = await supabase.auth.getSession();
            
            if (retryError || !retryData.session) {
              setError('Failed to establish session after OAuth');
              setStatus('error');
              return;
            }
            
            console.log('✅ Session established after retry');
            setStatus('success');
            redirectToAppropriateLocation(retryData.session.user);
            return;
          }
          
          setError(sessionError.message);
          setStatus('error');
          return;
        }

        if (sessionData.session && sessionData.session.user) {
          console.log('✅ LinkedIn OAuth successful');
          console.log('User data:', sessionData.session.user);
          console.log('User metadata:', sessionData.session.user.user_metadata);
          
          setStatus('success');
          redirectToAppropriateLocation(sessionData.session.user);
        } else {
          // Check if we're still waiting for the session to be established
          const code = urlParams.get('code');
          if (code) {
            console.log('Code found, waiting for session...');
            // Wait a bit longer for Supabase to process the OAuth
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const { data: finalData, error: finalError } = await supabase.auth.getSession();
            if (finalData.session) {
              console.log('✅ Session found after waiting');
              setStatus('success');
              redirectToAppropriateLocation(finalData.session.user);
              return;
            }
          }
          
          setError('No session found after OAuth callback');
          setStatus('error');
        }
      } catch (err) {
        console.error('Callback handling error:', err);
        setError('Failed to process authentication callback');
        setStatus('error');
      }
    };

    const redirectToAppropriateLocation = (user: any) => {
      // Small delay to show success message
      setTimeout(() => {
        // Clean up URL and redirect
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to dashboard - the auth context will handle role-based routing
        const redirectPath = '/user/dashboard';
        console.log('Redirecting to:', redirectPath);
        router.push(redirectPath);
      }, 1500);
    };

    // Only run once and avoid running on server
    if (typeof window !== 'undefined') {
      handleAuthCallback();
    }
  }, []); // Empty dependency array to run only once

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 text-center max-w-md w-full mx-4"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Completing LinkedIn Sign In</h2>
            <p className="text-gray-600 mb-6">
              Please wait while we finish setting up your account...
            </p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (status === 'success') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 text-center max-w-md w-full mx-4"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">✅</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Thinkify!</h2>
            <p className="text-gray-600 mb-6">
              Your LinkedIn account has been successfully connected. Redirecting to your dashboard...
            </p>
            <div className="text-sm text-gray-500">
              If you're not redirected automatically, <button onClick={() => router.push('/user/dashboard')} className="text-purple-600 hover:text-purple-700 underline">click here</button>.
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 text-center max-w-md w-full mx-4"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">❌</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Failed</h2>
            <p className="text-gray-600 mb-6">
              {error || 'Something went wrong during the LinkedIn authentication process.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                Go Home
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return null;
} 