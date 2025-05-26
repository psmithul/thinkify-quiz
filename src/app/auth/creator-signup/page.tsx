'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { formatErrorMessage } from '@/utils/errorHandler';
import { supabase } from '@/lib/supabaseClient';

export default function CreatorSignupPage() {
  const router = useRouter();
  const { user, userData, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users away from signup page
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
        
        if (userError) throw userError;
        
        // Redirect handled by useEffect in AuthProvider
      }
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLinkedInSignup() {
    setIsLinkedInLoading(true);
    setError(null);
    
    try {
      // Set localStorage flag to indicate creator signup intent
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('linkedin_creator_signup', 'true');
      }
      
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
        // Clear localStorage flag on error
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('linkedin_creator_signup');
        }
        throw error;
      }

      console.log('LinkedIn OAuth creator signup initiated successfully');
      // The redirect will happen automatically via Supabase
      
    } catch (err) {
      console.error('LinkedIn creator signup failed:', err);
      setError(err instanceof Error ? err.message : 'LinkedIn signup failed. Please try again.');
      setIsLinkedInLoading(false);
    }
  }

  // Check if LinkedIn OAuth is configured
  const isLinkedInConfigured = () => {
    return true;
  };

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
            <h2 className="text-xl font-semibold text-gray-900">Create Creator Account</h2>
            <p className="text-gray-600 mt-2">Join as a quiz creator and share your knowledge</p>
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
                id="full-name"
                label="Full Name"
                name="fullName"
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="form-input"
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
                className="form-input"
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
                className="form-input"
              />
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="bio"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  placeholder="Tell users about yourself and your expertise"
                ></textarea>
              </div>
              
              <Input
                id="profile-image"
                label="Profile Image URL"
                name="profileImage"
                type="url"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="form-input"
                helper="Link to your profile picture (optional)"
              />
            </div>

            {error && (
              <div className="status-error">
                <div className="flex items-center gap-3">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <p className="font-semibold">Sign up failed</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                variant="primary"
                size="lg"
              >
                {isLoading ? 'Creating creator account...' : 'Create creator account'}
              </Button>

              {isLinkedInConfigured() && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Or sign up with</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    size="lg"
                    isLoading={isLinkedInLoading}
                    onClick={handleLinkedInSignup}
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
              <Link href="/auth/creator-login" className="text-purple-600 hover:text-purple-700 font-medium transition-colors">
                Already have a creator account? <span className="font-semibold">Sign in</span>
              </Link>
              <Link href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Just want to take quizzes? <span className="font-semibold">Regular signup</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 