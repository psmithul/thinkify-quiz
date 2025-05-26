'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase, User, Course } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type CreatorWithCourses = User & {
  courses: Course[];
};

export function CreatorCourses({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorWithCourses | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreatorAndCourses() {
      try {
        // Fetch creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .single();

        if (creatorError) throw creatorError;

        // Fetch creator's published courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        setCreator({
          ...creatorData,
          courses: coursesData || []
        });
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (creatorId) {
      fetchCreatorAndCourses();
    }
  }, [creatorId]);

  const filteredCourses = creator?.courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/creators')} variant="outline">
            Back to Creators
          </Button>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <h1 className="text-2xl font-bold text-yellow-700 mb-4">Creator Not Found</h1>
          <p className="text-yellow-600 mb-4">The creator you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/creators')} variant="outline">
            Back to Creators
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-white p-0.5">
                <div className="h-full w-full rounded-full overflow-hidden">
                  {creator.profile_image ? (
                    <img 
                      src={creator.profile_image} 
                      alt={creator.full_name || 'Creator'} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-green-100 text-green-700 text-2xl font-bold">
                      {(creator.full_name || creator.email || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Creator Courses</h1>
                <p className="text-green-100 mt-2">
                  {creator.full_name || creator.email}'s Courses
                </p>
                <p className="text-green-200 text-sm">
                  {creator.courses.length} {creator.courses.length === 1 ? 'course' : 'courses'} available
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/creators')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600"
            >
              Back to Creators
            </Button>
          </div>
        </div>

        {/* Creator Info */}
        {creator.bio && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About the Creator</h2>
            <p className="text-gray-600">{creator.bio}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Courses
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Search courses..."
              />
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="bg-yellow-50 rounded-xl p-8 text-center border border-yellow-200">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-lg font-medium text-yellow-800 mb-2">No Courses Found</h2>
            <p className="text-yellow-600">
              {searchTerm 
                ? `No courses match your search "${searchTerm}".`
                : "This creator hasn't published any courses yet."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/course/${course.id}`)}
              >
                {/* Course Thumbnail */}
                <div className="h-48 bg-gradient-to-r from-green-400 to-teal-500 relative overflow-hidden">
                  {course.thumbnail_url ? (
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-6xl">📚</div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 bg-white/90 text-green-800 text-xs font-medium rounded-full">
                      {course.level}
                    </span>
                  </div>
                  {course.is_featured && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {course.category || 'General'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {course.duration_minutes}min
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description || 'No description available'}
                  </p>

                  {/* Tags */}
                  {course.tags && course.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {course.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {course.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{course.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{course.description ? course.description.length > 50 ? course.description.substring(0, 50) + '...' : course.description : 'No description'}</span>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <Button
                    fullWidth
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/course/${course.id}`);
                    }}
                  >
                    View Course
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{creator.courses.length}</div>
              <div className="text-sm text-green-700">Total Courses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600">{filteredCourses.length}</div>
              <div className="text-sm text-teal-700">Matching Search</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {creator.courses.reduce((sum, c) => sum + (c.duration_minutes || 0), 0)}
              </div>
              <div className="text-sm text-blue-700">Total Minutes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {new Set(creator.courses.map(c => c.category)).size}
              </div>
              <div className="text-sm text-purple-700">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 