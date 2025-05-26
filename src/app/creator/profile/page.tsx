'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type QuizStats = {
  totalQuizzes: number;
  publishedQuizzes: number;
  draftQuizzes: number;
  totalAttempts: number;
  averageScore: number;
};

export default function CreatorProfile() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [quizStats, setQuizStats] = useState<QuizStats>({
    totalQuizzes: 0,
    publishedQuizzes: 0,
    draftQuizzes: 0,
    totalAttempts: 0,
    averageScore: 0
  });
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

        // Fetch quiz statistics
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id, is_published')
          .eq('creator_id', user.id);

        if (quizzesError) throw quizzesError;

        const totalQuizzes = quizzes?.length || 0;
        const publishedQuizzes = quizzes?.filter(q => q.is_published).length || 0;
        const draftQuizzes = totalQuizzes - publishedQuizzes;

        // Fetch attempt statistics
        let totalAttempts = 0;
        let averageScore = 0;

        if (totalQuizzes > 0) {
          const quizIds = quizzes?.map(q => q.id) || [];
          
          const { data: attempts, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('score')
            .in('quiz_id', quizIds)
            .eq('completed', true);

          if (!attemptsError && attempts) {
            totalAttempts = attempts.length;
            if (totalAttempts > 0) {
              averageScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalAttempts;
            }
          }
        }

        setQuizStats({
          totalQuizzes,
          publishedQuizzes,
          draftQuizzes,
          totalAttempts,
          averageScore
        });
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Creator Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/creator/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Creator Statistics */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Creator Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-2xl font-bold text-purple-900">{quizStats.totalQuizzes}</div>
              <div className="text-sm text-purple-700">Total Quizzes</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-900">{quizStats.publishedQuizzes}</div>
              <div className="text-sm text-green-700">Published</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-2xl font-bold text-yellow-900">{quizStats.draftQuizzes}</div>
              <div className="text-sm text-yellow-700">Drafts</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-2xl font-bold text-blue-900">{quizStats.totalAttempts}</div>
              <div className="text-sm text-blue-700">Total Attempts</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-2xl font-bold text-indigo-900">{quizStats.averageScore.toFixed(1)}%</div>
              <div className="text-sm text-indigo-700">Avg Score</div>
            </div>
          </div>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name *
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
              <p className="mt-1 text-sm text-gray-500">This will appear on your certificates and profile</p>
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