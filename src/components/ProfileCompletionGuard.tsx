'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    date_of_birth: '',
    address: '',
    bio: ''
  });

  useEffect(() => {
    async function checkProfileCompletion() {
      if (!user) {
        setIsCheckingProfile(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('full_name, date_of_birth, address, bio')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // Check if essential profile fields are filled
        const requiredFields: (keyof typeof profileData)[] = ['full_name'];
        const isComplete = requiredFields.every(field => 
          data?.[field] && data[field].trim().length > 0
        );

        if (isComplete) {
          setIsProfileComplete(true);
        } else {
          // Pre-fill form with existing data
          setProfileData({
            full_name: data?.full_name || '',
            date_of_birth: data?.date_of_birth || '',
            address: data?.address || '',
            bio: data?.bio || ''
          });
        }
      } catch (err) {
        // If there's an error checking the profile, allow access
        setIsProfileComplete(true);
      } finally {
        setIsCheckingProfile(false);
      }
    }

    checkProfileCompletion();
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    setError(null);

    try {
      // Validate required fields
      if (!profileData.full_name.trim()) {
        throw new Error('Full name is required');
      }

      // Update profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name.trim(),
          date_of_birth: profileData.date_of_birth || null,
          address: profileData.address.trim() || null,
          bio: profileData.bio.trim() || null,
          profile_completed_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsProfileComplete(true);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Show loading while checking auth or profile
  if (authLoading || isCheckingProfile) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // If no user, show children (login page will handle redirect)
  if (!user) {
    return <>{children}</>;
  }

  // If profile is complete, show children
  if (isProfileComplete) {
    return <>{children}</>;
  }

  // Show profile completion form
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
          >
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h1>
              <p className="text-gray-600">
                Please complete your profile to access all features. This information helps us provide you with a better experience.
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Full Name - Required */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  required
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Date of Birth - Optional */}
              <div>
                <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  value={profileData.date_of_birth}
                  onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                />
              </div>

              {/* Address - Optional */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  id="address"
                  rows={3}
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your address"
                />
              </div>

              {/* Bio - Optional */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  Bio <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                  placeholder="Tell us about yourself..."
                />
                <p className="mt-1 text-sm text-gray-500">
                  Brief description about yourself, your interests, or professional background.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile || !profileData.full_name.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                  size="lg"
                >
                  {isUpdatingProfile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Updating Profile...
                    </>
                  ) : (
                    '✓ Complete Profile'
                  )}
                </Button>
              </div>
            </form>

            {/* Footer note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields must be completed to continue
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 