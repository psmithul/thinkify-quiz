'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

export default function CreatorProfile() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (!authLoading && user && user.role !== 'creator' && user.role !== 'admin') {
      router.push('/user/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchCreatorProfile() {
      if (!user) return;

      try {
        // Fetch creator's profile
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        setFullName(data.full_name || '');
        setBio(data.bio || '');
        setProfileImage(data.profile_image || '');
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user && (user.role === 'creator' || user.role === 'admin')) {
      fetchCreatorProfile();
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          bio,
          profile_image: profileImage
        })
        .eq('id', user?.id);
        
      if (error) throw error;
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Creator Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/creator/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Your name as it will appear to users"
                required
              />
            </div>
            
            <div>
              <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">
                Profile Image URL
              </label>
              <input
                type="url"
                id="profileImage"
                value={profileImage}
                onChange={(e) => setProfileImage(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="https://example.com/your-image.jpg"
              />
              {profileImage && (
                <div className="mt-2">
                  <img 
                    src={profileImage} 
                    alt="Profile Preview" 
                    className="h-24 w-24 rounded-full object-cover border border-gray-300" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/150?text=No+Image";
                    }}
                  />
                </div>
              )}
            </div>
            
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Tell users about yourself, your expertise, and what types of quizzes you create."
              ></textarea>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isSaving}
              >
                Save Profile
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
} 