'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase, Quiz, Course, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

interface CreatorStats {
  totalQuizzes: number;
  totalCourses: number;
  totalQuizAttempts: number;
  totalCourseEnrollments: number;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const { user, userData, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<User | null>(null);
  const [creatorStats, setCreatorStats] = useState<CreatorStats>({
    totalQuizzes: 0,
    totalCourses: 0,
    totalQuizAttempts: 0,
    totalCourseEnrollments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview'|'quizzes'|'courses'|'profile'>('overview');
  
  useEffect(() => {
    async function checkAndFetchData() {
      if (!user || !userData) return;

      // Only allow creators and admins
      if (userData.role !== 'creator' && userData.role !== 'admin') {
        router.push('/user/dashboard');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch creator profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;
        setCreatorProfile(profileData);

        // Fetch creator's quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (quizzesError) throw quizzesError;
        setQuizzes(quizzesData || []);

        // Fetch creator's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Calculate statistics
        const totalQuizzes = quizzesData?.length || 0;
        const totalCourses = coursesData?.length || 0;
        let totalQuizAttempts = 0;
        let totalCourseEnrollments = 0;

        // Fetch quiz attempt statistics
        if (totalQuizzes > 0) {
          const quizIds = quizzesData?.map(q => q.id) || [];
          
          const { data: attempts, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('score, is_completed')
            .in('quiz_id', quizIds)
            .eq('is_completed', true);

          if (!attemptsError && attempts) {
            totalQuizAttempts = attempts.length;
          }
        }

        // Fetch course enrollment statistics
        if (totalCourses > 0) {
          const courseIds = coursesData?.map(c => c.id) || [];
          
          const { data: enrollments, error: enrollmentsError } = await supabase
            .from('course_enrollments')
            .select('id')
            .in('course_id', courseIds);

          if (!enrollmentsError && enrollments) {
            totalCourseEnrollments = enrollments.length;
          }
        }

        setCreatorStats({
          totalQuizzes,
          totalCourses,
          totalQuizAttempts,
          totalCourseEnrollments,
        });
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    checkAndFetchData();
  }, [user, userData, router]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex justify-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex justify-center items-center">
          <div className="max-w-md w-full p-6">
            <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-red-700 mb-4">Oops! Something went wrong</h1>
              <p className="text-red-600 mb-6">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const publishedQuizzes = quizzes.filter(q => q.is_published);
  const publishedCourses = courses.filter(c => c.is_published);
  const completionRate = creatorStats.totalQuizAttempts > 0 
    ? Math.round((creatorStats.totalQuizAttempts / (creatorStats.totalQuizzes || 1)) * 100) 
    : 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {creatorProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold mb-2">
                      Welcome back, {creatorProfile?.full_name || 'Creator'}! 👋
                    </h1>
                    <p className="text-purple-100 text-lg">
                      Ready to inspire minds and share knowledge?
                    </p>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="text-6xl opacity-30">🚀</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Quizzes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{creatorStats.totalQuizzes}</p>
                  <p className="text-green-600 text-sm mt-1">
                    {publishedQuizzes.length} published
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Total Courses</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{creatorStats.totalCourses}</p>
                  <p className="text-green-600 text-sm mt-1">
                    {publishedCourses.length} published
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Quiz Attempts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{creatorStats.totalQuizAttempts}</p>
                  <p className="text-indigo-600 text-sm mt-1">
                    {completionRate}% completion rate
                  </p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Enrollments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{creatorStats.totalCourseEnrollments}</p>
                  <p className="text-green-600 text-sm mt-1">
                    Students learning
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  onClick={() => router.push('/creator/quiz/create')}
                  className="h-20 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  fullWidth
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🧠</div>
                    <div className="text-sm font-medium">Create Quiz</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => router.push('/creator/course/create')}
                  className="h-20 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  fullWidth
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-sm font-medium">Create Course</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('quizzes')}
                  variant="outline"
                  className="h-20 border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  fullWidth
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📝</div>
                    <div className="text-sm font-medium text-gray-700">Manage Quizzes</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('courses')}
                  variant="outline"
                  className="h-20 border-2 border-blue-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  fullWidth
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">📖</div>
                    <div className="text-sm font-medium text-gray-700">Manage Courses</div>
                  </div>
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
              <div className="flex space-x-2">
                {[
                  { id: 'overview', label: '📊 Overview', icon: '📊' },
                  { id: 'quizzes', label: '🧠 Quizzes', icon: '🧠' },
                  { id: 'courses', label: '📚 Courses', icon: '📚' },
                  { id: 'profile', label: '👤 Profile', icon: '👤' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Content</h3>
                  <div className="space-y-4">
                    {[...quizzes.slice(0, 3), ...courses.slice(0, 2)].slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm">
                              {'creator_id' in item ? '🧠' : '📚'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                            <p className="text-gray-500 text-xs">
                              {item.is_published ? 'Published' : 'Draft'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if ('creator_id' in item) {
                              router.push(`/creator/quiz/${item.id}`);
                            } else {
                              router.push(`/creator/course/${item.id}/edit`);
                            }
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                    {quizzes.length === 0 && courses.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">🎯</div>
                        <p className="text-gray-500">No content created yet. Start your journey!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Your Impact</h3>
                  <div className="space-y-6">
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                      <div className="text-4xl font-bold text-purple-600 mb-2">
                        {creatorStats.totalQuizAttempts + creatorStats.totalCourseEnrollments}
                      </div>
                      <p className="text-gray-600">Total Learners Reached</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-xl">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round((publishedQuizzes.length / Math.max(creatorStats.totalQuizzes, 1)) * 100)}%
                        </div>
                        <p className="text-gray-600 text-sm">Quiz Publish Rate</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((publishedCourses.length / Math.max(creatorStats.totalCourses, 1)) * 100)}%
                        </div>
                        <p className="text-gray-600 text-sm">Course Publish Rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Your Quizzes</h3>
                  <Button
                    onClick={() => router.push('/creator/quiz/create')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    Create New Quiz
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          quiz.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{quiz.title}</h4>
                      <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/creator/quiz/${quiz.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/creator/quiz/${quiz.id}/manage`)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                  {quizzes.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="text-6xl mb-4">🧠</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
                      <p className="text-gray-500 mb-6">Create your first quiz to get started!</p>
                      <Button
                        onClick={() => router.push('/creator/quiz/create')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                      >
                        Create Quiz
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Your Courses</h3>
                  <Button
                    onClick={() => router.push('/creator/course/create')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Create New Course
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          course.is_published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </span>
                        {course.youtube_url && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            📺 YouTube
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                      <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/creator/course/${course.id}/edit`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/course/${course.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <div className="text-6xl mb-4">📚</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                      <p className="text-gray-500 mb-6">Create your first course to get started!</p>
                      <Button
                        onClick={() => router.push('/creator/course/create')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      >
                        Create Course
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h3>
                <div className="max-w-2xl">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {creatorProfile?.full_name || 'Not set'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        {creatorProfile?.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <div className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
                        {creatorProfile?.bio || 'No bio added yet'}
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push('/creator/profile')}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 