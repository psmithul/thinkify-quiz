'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { formatErrorMessage } from '@/utils/errorHandler';
import { supabase } from '@/lib/supabaseClient';

export default function CreatorLoginPage() {
  const router = useRouter();
  const { signIn, user, userData, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users away from login page
  useEffect(() => {
    if (!authLoading && user && userData) {
      console.log('User is already authenticated, redirecting based on role:', userData.role);
      
      if (userData.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userData.role === 'creator') {
        router.push('/creator/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [user, userData, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      
      // Check if user is a creator
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();
      
      if (userError) throw userError;
      
      if (userData.role !== 'creator' && userData.role !== 'admin') {
        throw new Error('This login is only for creators. Please use the regular login page.');
      }
      
      // Redirect handled by useEffect in AuthProvider
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  // Show loading while checking authentication state
  if (authLoading) {
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
            <h2 className="text-xl font-semibold text-gray-900">Creator Sign In</h2>
            <p className="text-gray-600 mt-2">Access your creator dashboard and manage your quizzes</p>
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

            <div>
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                variant="primary"
                size="lg"
              >
                {isLoading ? 'Signing in...' : 'Sign in as Creator'}
              </Button>
            </div>

            <div className="flex flex-col space-y-3 text-center text-sm border-t border-gray-200 pt-6">
              <Link href="/auth/login" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Regular user? <span className="font-semibold">Sign in here</span>
              </Link>
              <Link href="/auth/creator-signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Need a creator account? <span className="font-semibold">Sign up here</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 