'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { formatErrorMessage } from '@/utils/errorHandler';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user, userData, isAdmin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!isLoading && user && userData) {
      console.log('User is already authenticated, redirecting based on role:', userData.role);
      
      if (userData.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userData.role === 'creator') {
        router.push('/creator/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [user, userData, isAdmin, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoginLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      // Don't manually redirect here - let the useEffect handle it
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoginLoading(false);
    }
  }

  async function handleLinkedInLogin() {
    setIsLinkedInLoading(true);
    setError(null);
    
    try {
      // Use Supabase's built-in LinkedIn OIDC provider
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/linkedin/callback`,
          scopes: 'openid profile email'
        }
      });

      if (error) {
        console.error('LinkedIn OAuth error:', error);
        throw error;
      }

      console.log('LinkedIn OAuth login initiated successfully');
      // The redirect will happen automatically via Supabase
      
    } catch (err) {
      console.error('LinkedIn login failed:', err);
      setError(err instanceof Error ? err.message : 'LinkedIn login failed. Please try again.');
      setIsLinkedInLoading(false);
    }
  }

  // Check if LinkedIn OAuth is configured
  const isLinkedInConfigured = () => {
    // With Supabase LinkedIn OIDC provider, we don't need environment variable checks
    // Configuration is handled in Supabase dashboard
    return true;
  };

  // Show loading while checking authentication state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="text-4xl">🧠</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thinkify
              </h1>
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-8 h-8 border-4 border-purple-200 rounded-full animate-spin"></div>
                <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
              </div>
            </div>
            <p className="text-gray-600 mt-4">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="text-4xl">🧠</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Thinkify
              </h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
            <p className="text-gray-600 mt-2">Sign in to continue your learning journey</p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                id="email-address"
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />

              <Input
                id="password"
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
              />
            </div>

            {error && (
              <div className="status-error">
                <div className="flex items-center gap-3">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <p className="font-semibold">Sign in failed</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoginLoading}
                variant="primary"
                size="lg"
              >
                {isLoginLoading ? 'Signing in...' : 'Sign in'}
              </Button>

              {isLinkedInConfigured() && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="lg"
                    isLoading={isLinkedInLoading}
                    onClick={handleLinkedInLogin}
                    className="inline-flex items-center justify-center border-2 hover:border-blue-500 hover:text-blue-600"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    {isLinkedInLoading ? 'Connecting...' : 'Continue with LinkedIn'}
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-col space-y-3 text-center text-sm border-t border-gray-200 pt-6">
              <Link href="/auth/signup" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Don&apos;t have an account? <span className="font-semibold">Sign up</span>
              </Link>
              <Link href="/auth/creator-login" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Creator? <span className="font-semibold">Sign in here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 