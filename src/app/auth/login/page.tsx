'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check for redirectTo parameter
      const urlParams = new URLSearchParams(window.location.search);
      const redirectTo = urlParams.get('redirectTo');

      // Fetch user data to determine redirect
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role, full_name')
          .eq('id', data.user.id)
          .single();

        if (!userError && userData) {
          // Use redirectTo if provided, otherwise redirect based on user role
          const targetUrl = redirectTo || 
            (userData.role === 'admin' ? '/admin/dashboard' :
             userData.role === 'creator' ? '/creator/dashboard' :
             '/user/dashboard');
          
          router.push(targetUrl);
        } else {
          // Default redirect for users without role data
          router.push(redirectTo || '/user/dashboard');
        }
      } else {
        // Fallback redirect
        router.push(redirectTo || '/user/dashboard');
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    setIsLinkedInLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/linkedin/callback`,
          scopes: 'profile email openid'
        }
      });

      if (error) {
        console.error('LinkedIn OAuth error:', error);
        throw error;
      }

      // The redirect will happen automatically
      console.log('LinkedIn OAuth initiated successfully');
    } catch (err) {
      console.error('LinkedIn login failed:', err);
      setError(formatErrorMessage(err));
      setIsLinkedInLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl">🧠</span>
              </div>
            </div>
            <h2 className="heading-2 text-center">Welcome back!</h2>
            <p className="text-gray-600 text-lg">Sign in to your Thinkify account</p>
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
                      <p className="font-semibold">Sign In Failed</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/auth/forgot-password" className="font-medium text-purple-600 hover:text-purple-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full btn-primary"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
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
                  onClick={handleLinkedInLogin}
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
              Don't have an account?{' '}
              <Link href="/auth/signup" className="font-semibold text-purple-600 hover:text-purple-500 transition-colors">
                Sign up
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