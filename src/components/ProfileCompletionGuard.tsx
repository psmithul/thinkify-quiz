'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';
import { User } from '@/types/user';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export function ProfileCompletionGuard({ children }: ProfileCompletionGuardProps) {
  const { user, userData, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: ''
  });

  // Pages that don't require profile completion
  const publicPages = ['/auth/', '/'];
  const isPublicPage = publicPages.some(page => pathname?.startsWith(page)) || pathname === '/';

  useEffect(() => {
    // Only check profile completion for authenticated users on protected pages
    if (!user || !userData || isPublicPage || authLoading) {
      console.log('ProfileCompletionGuard - skipping check:', {
        hasUser: !!user,
        hasUserData: !!userData,
        isPublicPage,
        authLoading
      });
      setShowProfileCompletion(false);
      return;
    }

    console.log('ProfileCompletionGuard - checking user data:', userData);
    console.log('Current pathname:', pathname);

    // Check if profile needs completion - be more strict about requirements
    const hasValidName = userData.full_name && userData.full_name.trim().length >= 2;
    const needsCompletion = !hasValidName;
    
    console.log('Profile completion check:', {
      full_name: userData.full_name,
      full_name_trimmed: userData.full_name?.trim(),
      full_name_length: userData.full_name?.trim().length,
      hasValidName,
      needsCompletion,
      hasLinkedInData: {
        profile_image: !!userData.profile_image,
        linkedin_url: !!userData.linkedin_url,
        job_title: !!userData.job_title,
        location: !!userData.location,
        bio: !!userData.bio,
        company: !!userData.company
      }
    });
    
    if (needsCompletion) {
      console.log('🚨 Profile needs completion, showing form');
      setShowProfileCompletion(true);
      setProfileData({
        full_name: userData.full_name || '',
        bio: userData.bio || ''
      });
    } else {
      console.log('✅ Profile is complete, not showing form');
      setShowProfileCompletion(false);
    }
  }, [user, userData, isPublicPage, authLoading, pathname]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    setError(null);

    try {
      // Validate required fields
      if (!profileData.full_name.trim() || profileData.full_name.trim().length < 2) {
        throw new Error('Please enter your full name (at least 2 characters)');
      }

      // Update profile with basic required fields
      const { error } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name.trim(),
          bio: profileData.bio.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Hide profile completion form
      setShowProfileCompletion(false);
      
      // Refresh page to update context
      window.location.reload();
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Show loading while checking auth
  if (authLoading) {
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

  // If no user or on public page, show children
  if (!user || isPublicPage) {
    return <>{children}</>;
  }

  // Show profile completion form if needed
  if (showProfileCompletion) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-3xl">👤</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-600 text-lg">Please provide your full name to continue</p>
              {userData && !userData.full_name && (
                <p className="text-sm text-red-600 mt-2">⚠️ Your profile is missing required information</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-white p-8 rounded-xl shadow-lg border border-gray-200"
            >
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">❌</span>
                      <div>
                        <p className="font-semibold text-red-900">Error</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Show LinkedIn import status if available */}
                {userData && (userData.linkedin_url || userData.job_title || userData.location || userData.company) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">💼</span>
                      <div>
                        <p className="font-semibold text-blue-900">LinkedIn Data Imported</p>
                        <p className="text-sm text-blue-700">We've imported some information from your LinkedIn profile</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {userData.job_title && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-blue-700">Job Title: {userData.job_title}</span>
                        </div>
                      )}
                      {userData.company && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-blue-700">Company: {userData.company}</span>
                        </div>
                      )}
                      {userData.location && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-blue-700">Location: {userData.location}</span>
                        </div>
                      )}
                      {userData.bio && (
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-blue-700">Bio imported</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                    {userData?.full_name && (
                      <span className="ml-2 text-green-600 text-xs">✓ From LinkedIn</span>
                    )}
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (Optional)
                    {userData?.bio && (
                      <span className="ml-2 text-green-600 text-xs">✓ From LinkedIn</span>
                    )}
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tell us a little about yourself..."
                  />
                  {userData?.bio && (
                    <p className="text-xs text-gray-500 mt-1">Bio imported from LinkedIn. You can edit it above.</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile || !profileData.full_name.trim() || profileData.full_name.trim().length < 2}
                    className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                    isLoading={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? 'Saving...' : 'Complete Profile'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowProfileCompletion(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Skip
                  </Button>
                </div>
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center"
            >
              <p className="text-sm text-gray-500">
                You can update your profile information anytime from your account settings.
              </p>
              {userData && (userData.linkedin_url || userData.job_title || userData.company) && (
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ Additional LinkedIn data like job title, company, and location are already saved in your profile.
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show main application
  return <>{children}</>;
} 