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
  const [activeTab, setActiveTab] = useState<'overview'|'quizzes'|'courses'|'analytics'|'profile'>('overview');
  
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
        
        // Fetch creator profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // User doesn't exist, redirect to complete profile
            router.push('/user/complete-profile');
            return;
          }
          throw profileError;
        }

        setCreatorProfile(profileData);

        // Fetch user's quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (quizzesError) {
          // Non-fatal error, continue without quizzes
          setQuizzes([]);
        } else {
          setQuizzes(quizzesData || []);
        }

        // Fetch user's courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (coursesError) {
          // Non-fatal error, continue without courses
          setCourses([]);
        } else {
          setCourses(coursesData || []);
        }

        // Calculate stats
        const totalQuizzes = quizzesData?.length || 0;
        const totalCourses = coursesData?.length || 0;

        // Fetch quiz attempt statistics
        let totalQuizAttempts = 0;

        if (totalQuizzes > 0) {
          const quizIds = quizzesData?.map(q => q.id) || [];
          
          const { data: attempts, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('score')
            .in('quiz_id', quizIds)
            .eq('completed', true);

          if (!attemptsError && attempts) {
            totalQuizAttempts = attempts.length;
          }
        }

        // Fetch course enrollment statistics
        let totalCourseEnrollments = 0;

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 p-0.5">
                  <div className="h-full w-full rounded-full overflow-hidden bg-white">
                {creatorProfile?.profile_image ? (
                  <img 
                    src={creatorProfile.profile_image} 
                    alt={creatorProfile.full_name || 'Creator'} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                      <div className="flex items-center justify-center h-full w-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-2xl font-bold">
                    {(creatorProfile?.full_name || creatorProfile?.email || 'C').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
              <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back, {creatorProfile?.full_name || 'Creator'}! 👋
                </h1>
                  <p className="text-gray-600 mt-1">
                    {creatorStats.totalQuizzes} quizzes and {creatorStats.totalCourses} courses created
                  </p>
                  {creatorProfile?.linkedin_url && (
                    <p className="text-blue-600 text-sm mt-1">
                      <a 
                        href={creatorProfile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn Profile
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => router.push('/creator/quiz/create')}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  ➕ Create Quiz
                </Button>
                <Button 
                  onClick={() => router.push('/creator/course/create')}
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                >
                  📚 Create Course
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {/* Quiz Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                  <p className="text-3xl font-bold text-purple-600">{creatorStats.totalQuizzes}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                  🧠
            </div>
          </div>
        </div>
        
            {/* Course Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-3xl font-bold text-green-600">{creatorStats.totalCourses}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                  📚
          </div>
              </div>
            </div>
            
            {/* Engagement Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Engagement</p>
                  <p className="text-3xl font-bold text-indigo-600">{creatorStats.totalQuizAttempts + creatorStats.totalCourseEnrollments}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {creatorStats.totalQuizAttempts} quiz attempts, {creatorStats.totalCourseEnrollments} enrollments
                  </p>
                </div>
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl">
                  📊
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: '🏠' },
                  { id: 'quizzes', name: 'My Quizzes', icon: '🧠' },
                  { id: 'courses', name: 'My Courses', icon: '📚' },
                  { id: 'analytics', name: 'Analytics', icon: '📊' },
                  { id: 'profile', name: 'Profile', icon: '👤' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600 bg-purple-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg transition-all duration-200`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
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
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button
                      onClick={() => router.push('/creator/quiz/create')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 p-4 h-auto hover:bg-purple-50 hover:border-purple-300"
                    >
                      <span className="text-2xl">🧠</span>
                      <span>Create Quiz</span>
                    </Button>
                    <Button
                      onClick={() => router.push('/creator/course/create')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 p-4 h-auto hover:bg-green-50 hover:border-green-300"
                    >
                      <span className="text-2xl">📚</span>
                      <span>Create Course</span>
                    </Button>
                    <Button
                      onClick={() => setActiveTab('analytics')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 p-4 h-auto hover:bg-indigo-50 hover:border-indigo-300"
                    >
                      <span className="text-2xl">📊</span>
                      <span>View Analytics</span>
                    </Button>
                    <Button
                      onClick={() => setActiveTab('profile')}
                      variant="outline"
                      className="flex items-center justify-center space-x-2 p-4 h-auto hover:bg-gray-50 hover:border-gray-300"
                    >
                      <span className="text-2xl">👤</span>
                      <span>Edit Profile</span>
                    </Button>
                  </div>
                </div>

                {/* Recent Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Quizzes */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Quizzes</h3>
                    {quizzes.length > 0 ? (
                      <div className="space-y-4">
                        {quizzes.slice(0, 3).map((quiz) => (
                          <div
                            key={quiz.id}
                            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-purple-200 transition-colors cursor-pointer"
                            onClick={() => router.push(`/creator/quiz/${quiz.id}/edit`)}
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {quiz.description?.substring(0, 60)}...
                              </p>
                              <div className="flex items-center mt-2 text-xs">
                                <span className={`px-2 py-1 rounded-full ${
                                  quiz.is_published 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {quiz.is_published ? 'Published' : 'Draft'}
                                </span>
                              </div>
                            </div>
                            <div className="text-2xl ml-4">🧠</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No quizzes created yet.</p>
                    )}
                  </div>

                  {/* Recent Courses */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Courses</h3>
                    {courses.length > 0 ? (
                      <div className="space-y-4">
                        {courses.slice(0, 3).map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-green-200 transition-colors cursor-pointer"
                            onClick={() => router.push(`/creator/course/${course.id}/edit`)}
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{course.title}</h4>
                              <p className="text-sm text-gray-500 mt-1">
                                {course.description?.substring(0, 60)}...
                              </p>
                              <div className="flex items-center mt-2 text-xs space-x-2">
                                <span className={`px-2 py-1 rounded-full ${
                                  course.is_published 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {course.is_published ? 'Published' : 'Draft'}
                                </span>
                                <span className="text-gray-500">
                                  {course.level} • {course.duration_minutes}min
                                </span>
                              </div>
                            </div>
                            <div className="text-2xl ml-4">📚</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No courses created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'quizzes' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">All Quizzes</h3>
                  <Button
                    onClick={() => router.push('/creator/quiz/create')}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  >
                    ➕ Create New Quiz
                  </Button>
                </div>
                
                {quizzes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🧠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes yet</h3>
                    <p className="text-gray-500 mb-6">Create your first quiz to start testing knowledge!</p>
                    <Button
                      onClick={() => router.push('/creator/quiz/create')}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      Create Your First Quiz
                    </Button>
              </div>
            ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => (
                      <motion.div
                        key={quiz.id}
                        whileHover={{ y: -4 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">🧠</div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            quiz.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {quiz.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{quiz.title}</h4>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {quiz.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>Created {new Date(quiz.created_at).toLocaleDateString()}</span>
                          <span className="text-purple-600 font-medium">Quiz</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => router.push(`/creator/quiz/${quiz.id}/edit`)}
                            size="sm"
                            className="flex-1 sm:flex-initial bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          >
                            ✏️ Edit Quiz
                          </Button>
                          <Button
                            onClick={() => router.push(`/user/quiz/${quiz.id}`)}
                            variant="outline"
                            size="sm"
                            className="flex-1 sm:flex-initial border-gray-300 text-gray-700"
                          >
                            👁️ Preview
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">All Courses</h3>
                          <Button
                    onClick={() => router.push('/creator/course/create')}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                          >
                    ➕ Create New Course
                          </Button>
                </div>
                
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
                    <p className="text-gray-500 mb-6">Create your first course to start teaching!</p>
                          <Button
                      onClick={() => router.push('/creator/course/create')}
                      className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                          >
                      Create Your First Course
                          </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                      <motion.div
                        key={course.id}
                        whileHover={{ y: -4 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => router.push(`/creator/course/${course.id}/edit`)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">📚</div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            course.is_published 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{course.title}</h4>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.description || 'No description available'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                          <span className="capitalize">{course.level}</span>
                          <span>{course.duration_minutes}min</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
                          <span className="text-green-600 font-medium">Course</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Performance</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Attempts</span>
                        <span className="font-medium">{creatorStats.totalQuizAttempts}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Published Quizzes</span>
                        <span className="font-medium">{quizzes.length - (quizzes.filter(q => !q.is_published).length)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Performance</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Enrollments</span>
                        <span className="font-medium">{creatorStats.totalCourseEnrollments}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Published Courses</span>
                        <span className="font-medium">{courses.length - (courses.filter(c => !c.is_published).length)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Avg. Course Duration</span>
                        <span className="font-medium">
                          {courses.length > 0 
                            ? Math.round(courses.reduce((sum, c) => sum + (c.duration_minutes || 0), 0) / courses.length)
                            : 0}min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Creator Profile</h3>
                {creatorProfile && (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-6">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 p-0.5">
                        <div className="h-full w-full rounded-full overflow-hidden bg-white">
                          {creatorProfile.profile_image ? (
                            <img 
                              src={creatorProfile.profile_image} 
                              alt={creatorProfile.full_name || 'Creator'} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-3xl font-bold">
                              {(creatorProfile.full_name || creatorProfile.email || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900">
                          {creatorProfile.full_name || 'Creator Name'}
                        </h4>
                        <p className="text-gray-600">{creatorProfile.email}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {creatorProfile.job_title || 'Content Creator'} • {creatorProfile.location || 'Remote'}
                        </p>
                        {creatorProfile.linkedin_url && (
                          <div className="mt-2">
                            <a 
                              href={creatorProfile.linkedin_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm hover:underline"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                              View LinkedIn Profile
                            </a>
          </div>
        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                      <p className="text-gray-600">
                        {creatorProfile.bio || 'No bio available. Add a bio to tell others about yourself!'}
                      </p>
                    </div>

                    {/* Profile Stats */}
                    <div className="border-t border-gray-200 pt-6">
                      <h5 className="font-medium text-gray-900 mb-4">Profile Statistics</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">{creatorStats.totalQuizzes}</div>
                          <div className="text-sm text-purple-700">Quizzes Created</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">{creatorStats.totalCourses}</div>
                          <div className="text-sm text-green-700">Courses Created</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{creatorStats.totalQuizAttempts + creatorStats.totalCourseEnrollments}</div>
                          <div className="text-sm text-blue-700">Total Engagements</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <Button
                        onClick={() => router.push('/creator/profile')}
                        variant="outline"
                      >
                        Edit Profile
                      </Button>
                    </div>
          </div>
        )}
          </div>
        )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 