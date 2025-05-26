'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { formatErrorMessage } from '@/utils/errorHandler';
import { supabase } from '@/lib/supabaseClient';

export default function CreatorSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setDebug(null);

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
      // Check Supabase connection first
      try {
        const { error: pingError } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
        if (pingError) {
          // Show connection error for debugging
          setDebug(`Database connection error: ${pingError.message}`);
        }
      } catch (pingErr) {
        setDebug(`Failed to connect to database: ${pingErr}`);
      }

      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError) {
        setDebug(`Auth error: ${JSON.stringify(authError)}`);
        throw authError;
      }
      
      if (authData?.user) {
        // Create user entry in users table with the creator role
        const { error: userError } = await supabase.from('users').insert([
          { 
            id: authData.user.id, 
            email, 
            role: 'creator',
            full_name: fullName.trim(),
            bio: bio || null,
            profile_image: profileImage || null
          }
        ]);
        
        if (userError) {
          setDebug(`User insertion error: ${JSON.stringify(userError)}`);
          throw userError;
        }
        
        // Redirect to creator dashboard
        router.push('/creator/dashboard');
      } else {
        // Handle case where auth worked but no user data was returned
        throw new Error('Authentication successful but no user data returned');
      }
    } catch (err: any) {
      setError(formatErrorMessage(err));
      if (err.message) {
        setDebug(`Error details: ${err.message}`);
      }
      if (err.code) {
        setDebug(`Error code: ${err.code}`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">Thinkify Quiz</h1>
          <h2 className="mt-2 text-center text-xl font-medium text-gray-900">Create a Creator Account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join as a quiz creator and publish your own quizzes
          </p>
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              helper="Your name as it will appear to users"
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
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Tell users about yourself and your expertise"
              ></textarea>
            </div>
            
            <Input
              id="profile-image"
              label="Profile Image URL (optional)"
              name="profileImage"
              type="url"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              helper="Link to your profile picture"
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              {debug && (
                <p className="mt-1 text-xs text-red-500 font-mono">{debug}</p>
              )}
            </div>
          )}

          <div>
            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
            >
              Create Creator Account
            </Button>
          </div>

          <div className="flex flex-col space-y-3 text-center text-sm">
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-500">
              Want a regular account? Sign up here
            </Link>
            <Link href="/auth/creator-login" className="text-purple-600 hover:text-purple-500">
              Already have a creator account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 