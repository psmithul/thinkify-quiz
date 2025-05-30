'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, userData, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (!authLoading && user && userData) {
      // If user already has a full name, redirect to appropriate dashboard
      if (userData.full_name && userData.full_name.trim() !== '') {
        if (userData.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (userData.role === 'creator') {
          router.push('/creator/dashboard');
        } else {
          router.push('/user/dashboard');
        }
      }
    }
  }, [authLoading, user, userData, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !fullName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName.trim() })
        .eq('id', user.id);

      if (error) throw error;

      // Redirect to appropriate dashboard
      if (userData?.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userData?.role === 'creator') {
        router.push('/creator/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

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
            <p className="text-gray-600 mt-4">Loading...</p>
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
            <h2 className="text-xl font-semibold text-gray-900">Complete Your Profile</h2>
            <p className="text-gray-600 mt-2">
              We need your name to personalize your certificates and profile
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                id="full-name"
                label="Full Name"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="form-input"
                helper="This name will appear on your certificates and public profile"
                placeholder="Enter your full name"
              />
            </div>

            {error && (
              <div className="status-error">
                <div className="flex items-center gap-3">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <p className="font-semibold">Profile update failed</p>
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
                disabled={!fullName.trim()}
              >
                {isLoading ? 'Saving...' : 'Complete Profile'}
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
              <p>
                Your name is required to generate personalized certificates and 
                create a complete profile experience.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 