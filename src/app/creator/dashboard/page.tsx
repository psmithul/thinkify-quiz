'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase, Quiz, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

export default function CreatorDashboard() {
  const router = useRouter();
  const { user, userData, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quizzes'|'stats'|'comments'>('quizzes');
  
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/auth/login');
      } else if (!isCreator && !isAdmin) {
        console.log('User is not a creator or admin, redirecting to user dashboard');
        router.push('/user/dashboard');
      } else {
        console.log('User is authorized as creator/admin:', userData);
      }
    }
  }, [authLoading, user, userData, isCreator, isAdmin, router]);

  useEffect(() => {
    async function fetchCreatorData() {
      if (!user) return;

      try {
        console.log('Fetching creator data for user:', user.id);
        
        // Fetch creator profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          throw profileError;
        }
        
        console.log('Creator profile loaded:', profileData);
        setCreatorProfile(profileData);
        
        // Check if quizzes table has been properly set up
        const { error: tableCheckError } = await supabase
          .from('quizzes')
          .select('id')
          .limit(1);
          
        if (tableCheckError) {
          console.error('Error checking quizzes table:', tableCheckError);
          setQuizzes([]);
        } else {
          try {
            console.log('Fetching quizzes for creator:', user.id);
            
            // Try to fetch quizzes by creator ID, but handle the case where the column doesn't exist
            const { data: quizzesData, error: quizzesError } = await supabase
              .from('quizzes')
              .select('*')
              .eq('creator_id', user.id)
              .order('created_at', { ascending: false });

            if (quizzesError) {
              console.error('Error fetching quizzes:', quizzesError);
              setQuizzes([]);
            } else {
              console.log('Quizzes loaded:', quizzesData?.length || 0);
              setQuizzes(quizzesData || []);
            }
          } catch (quizError) {
            console.error('Failed to fetch quizzes:', quizError);
            setQuizzes([]);
          }
        }
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && user && (isCreator || isAdmin)) {
      fetchCreatorData();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [authLoading, user, isCreator, isAdmin]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  // If not authorized, show a message
  if (!isCreator && !isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
          <p className="text-red-600 mb-4">
            You don't have permission to access the creator dashboard. You need to have a creator account.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/user/dashboard')}
              variant="outline"
            >
              Go to User Dashboard
            </Button>
            <Button
              onClick={() => router.push('/admin/setup-database')}
            >
              Setup Database
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Channel Header - YouTube Style */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          {/* Channel Banner */}
          <div className="h-40 bg-gradient-to-r from-purple-500 to-indigo-600 relative">
            {/* Channel Avatar */}
            <div className="absolute -bottom-12 left-8">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white bg-white">
                {creatorProfile?.profile_image ? (
                  <img 
                    src={creatorProfile.profile_image} 
                    alt={creatorProfile.full_name || 'Creator'} 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://via.placeholder.com/150?text=C";
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full w-full bg-purple-100 text-purple-800 text-3xl font-bold">
                    {(creatorProfile?.full_name || creatorProfile?.email || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Channel Info */}
          <div className="pt-16 pb-6 px-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {creatorProfile?.full_name || 'Your Creator Channel'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'} published
                </p>
                <p className="text-gray-600 mt-3 max-w-2xl">
                  {creatorProfile?.bio || 'Update your profile to add a bio that describes your expertise and the types of quizzes you create.'}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/creator/profile')}
                >
                  Edit Profile
                </Button>
                <Button 
                  onClick={() => router.push('/creator/quiz/new')}
                >
                  Create Quiz
                </Button>
              </div>
            </div>
          </div>
          
          {/* Channel Navigation */}
          <div className="border-t border-gray-200 px-8">
            <div className="flex space-x-6">
              <button 
                className={`py-3 px-1 font-medium border-b-2 ${activeTab === 'quizzes' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveTab('quizzes')}
              >
                Quizzes
              </button>
              <button 
                className={`py-3 px-1 font-medium border-b-2 ${activeTab === 'stats' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveTab('stats')}
              >
                Analytics
              </button>
              <button 
                className={`py-3 px-1 font-medium border-b-2 ${activeTab === 'comments' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                onClick={() => setActiveTab('comments')}
              >
                Comments
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Content Section */}
        {activeTab === 'quizzes' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium text-gray-900">My Quizzes</h2>
              <div className="flex items-center">
                <select 
                  className="rounded-md border-gray-300 shadow-sm focus:ring-purple-500 focus:border-purple-500 text-sm"
                  defaultValue="all"
                >
                  <option value="all">All Quizzes</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>
            </div>
            
            {quizzes.length === 0 ? (
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <p className="text-yellow-700">
                  You haven't created any quizzes yet. Click the "Create Quiz" button to get started.
                </p>
                <p className="text-yellow-700 mt-2">
                  Note: The Supabase database needs to be set up with the creator_id column in the quizzes table. Please run the SQL setup script from ROLE_BASED_ACCESS.md.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => router.push('/admin/setup-database')}
                    variant="outline"
                  >
                    Go to Database Setup
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                    {/* Quiz Preview Image/Thumbnail */}
                    <div className="h-40 bg-gradient-to-r from-indigo-100 to-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-700">
                        {quiz.title?.substring(0, 2).toUpperCase() || 'QZ'}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex justify-between">
                        <h3 className="text-lg font-medium text-gray-900 truncate">{quiz.title || 'Untitled Quiz'}</h3>
                        <span className={`text-xs rounded-full px-2 py-1 ${
                          quiz.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <p className="mt-2 text-gray-500 line-clamp-2">{quiz.description || 'No description'}</p>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {quiz.price ? `$${quiz.price.toFixed(2)}` : 'Free'}
                        </div>
                        <div className="absolute bottom-4 right-4 flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/creator/quiz/${quiz.id}/edit`)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline" 
                            onClick={() => router.push(`/creator/quiz/${quiz.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/creator/quiz/${quiz.id}/stats`)}
                          >
                            Results
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Analytics Dashboard</h2>
            <p className="text-gray-500">Analytics features coming soon. You'll be able to track quiz completions, average scores, and more.</p>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Quiz Comments</h2>
            <p className="text-gray-500">Comments features coming soon. You'll be able to view and respond to comments on your quizzes.</p>
          </div>
        )}
      </div>
    </Layout>
  );
} 