'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase, Course, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

type CourseWithCreator = Course & {
  creator?: User;
};

export default function CourseViewPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();
  
  const [course, setCourse] = useState<CourseWithCreator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId, user]);

  const fetchCourse = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch course with creator info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          creator:users(*)
        `)
        .eq('id', courseId)
        .eq('is_published', true)
        .single();

      if (courseError) {
        if (courseError.code === 'PGRST116') {
          setError('Course not found or not published');
          return;
        }
        throw courseError;
      }

      setCourse(courseData);

      // Check if user is enrolled (if logged in)
      if (user) {
        const { data: enrollment } = await supabase
          .from('course_enrollments')
          .select('id')
          .eq('course_id', courseId)
          .eq('user_id', user.id)
          .single();

        setIsEnrolled(!!enrollment);
      }

      // If course has YouTube URL, redirect immediately
      if (courseData.youtube_url) {
        window.open(courseData.youtube_url, '_blank');
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert([
          {
            course_id: courseId,
            user_id: user.id,
            progress: 0
          }
        ]);

      if (error) throw error;

      setIsEnrolled(true);
      
      // If course has YouTube URL, open it after enrollment
      if (course?.youtube_url) {
        window.open(course.youtube_url, '_blank');
      }
    } catch (err) {
      setError(formatErrorMessage(err));
    }
  };

  const handleOpenYouTube = () => {
    if (course?.youtube_url) {
      window.open(course.youtube_url, '_blank');
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

  if (error) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-700 mb-4">Error</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/browse')}>
              Browse Courses
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-yellow-700 mb-4">Course Not Found</h1>
            <p className="text-yellow-600 mb-4">The course you're looking for doesn't exist or is not published.</p>
            <Button onClick={() => router.push('/browse')}>
              Browse Courses
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Course Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
                {/* Course Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">📚</span>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                      <p className="text-gray-600">
                        by {course.creator?.full_name || 'Anonymous Creator'}
                      </p>
                    </div>
                  </div>

                  {course.description && (
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      {course.description}
                    </p>
                  )}

                  {/* Course Details */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      📈 {course.level || 'Beginner'}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      🕐 {course.duration_minutes || 60} minutes
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      📁 {course.category || 'General'}
                    </span>
                    {course.price && course.price > 0 ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        💰 ${course.price}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        🆓 Free
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {course.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Course Thumbnail */}
                <div className="lg:col-span-1">
                  <div className="aspect-video bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl overflow-hidden">
                    {course.thumbnail_url ? (
                      <img 
                        src={course.thumbnail_url} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white text-6xl">
                        📚
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {course.youtube_url ? (
                  <Button
                    onClick={handleOpenYouTube}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
                    size="lg"
                  >
                    📺 Watch on YouTube
                  </Button>
                ) : (
                  <>
                    {user ? (
                      isEnrolled ? (
                        <div className="text-center">
                          <div className="text-green-600 text-lg font-semibold mb-2">
                            ✅ You're enrolled in this course!
                          </div>
                          <Button
                            onClick={() => router.push('/user/dashboard')}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            size="lg"
                          >
                            📚 Go to My Courses
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={handleEnroll}
                          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                          size="lg"
                        >
                          🎓 Enroll in Course
                        </Button>
                      )
                    ) : (
                      <Button
                        onClick={() => router.push('/auth/login')}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        size="lg"
                      >
                        🔐 Login to Enroll
                      </Button>
                    )}
                  </>
                )}
                
                <Button
                  onClick={() => router.push('/browse')}
                  variant="outline"
                  size="lg"
                >
                  🔍 Browse More Courses
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Course Content (only show if no YouTube URL) */}
          {!course.youtube_url && course.content && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
                <div className="prose max-w-none text-gray-700">
                  {course.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Creator Info */}
          {course.creator && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About the Creator</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                    {course.creator.full_name?.charAt(0) || course.creator.email.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {course.creator.full_name || 'Anonymous Creator'}
                    </h3>
                    {course.creator.bio && (
                      <p className="text-gray-600 mt-1">{course.creator.bio}</p>
                    )}
                    <Button
                      onClick={() => router.push(`/creators/${course.creator?.id}`)}
                      variant="outline"
                      size="sm"
                      className="mt-2"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
} 