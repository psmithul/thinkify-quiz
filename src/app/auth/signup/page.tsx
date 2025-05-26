'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { formatErrorMessage } from '@/utils/errorHandler';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isCreator, setIsCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation
    if (!fullName.trim()) {
      setError('Full name is required');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      if (authData?.user) {
        // Create user entry in users table with the selected role
        const { error: userError } = await supabase.from('users').insert([
          { 
            id: authData.user.id, 
            email, 
            role: isCreator ? 'creator' : 'user',
            full_name: fullName.trim()
          }
        ]);
        
        if (userError) throw userError;
        
        // Redirect to appropriate dashboard based on role
        if (isCreator) {
          router.push('/creator/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">Thinkify Quiz</h1>
          <h2 className="mt-2 text-center text-xl font-medium text-gray-900">Create a new account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <Input
              id="email-address"
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="full-name"
              label="Full Name"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              helper="Required - will appear on your certificates and profile"
            />

            <Input
              id="password"
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helper="Password must be at least 8 characters"
            />

            <Input
              id="confirm-password"
              label="Confirm Password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            
            <div className="flex items-center">
              <input
                id="is-creator"
                name="is-creator"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                checked={isCreator}
                onChange={(e) => setIsCreator(e.target.checked)}
              />
              <label htmlFor="is-creator" className="ml-2 block text-sm text-gray-900">
                Sign up as a quiz creator
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Sign up
            </Button>
          </div>

          <div className="flex flex-col space-y-3 text-center text-sm">
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-500">
              Already have an account? Sign in
            </Link>
            <Link href="/auth/creator-signup" className="text-purple-600 hover:text-purple-500">
              Want to create quizzes? Sign up as a creator
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 