'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type CreatorWithCounts = User & {
  quiz_count: number;
  course_count: number;
};

export default function CreatorsListPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<CreatorWithCounts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchCreators() {
      try {
        // Fetch all users with creator role
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .in('role', ['creator', 'admin'])
          .order('full_name');

        if (error) throw error;
        
        // Fetch quiz and course counts for each creator
        const creatorsWithCounts = await Promise.all(
          (data || []).map(async (creator) => {
            // Fetch quiz count
            const { data: quizzes, error: quizError } = await supabase
              .from('quizzes')
              .select('id')
              .eq('creator_id', creator.id)
              .eq('is_published', true); // Only count published quizzes
            
            // Fetch course count
            const { data: courses, error: courseError } = await supabase
              .from('courses')
              .select('id')
              .eq('creator_id', creator.id)
              .eq('is_published', true); // Only count published courses
            
            if (quizError) {
              console.error(`Error fetching quiz count for creator ${creator.id}:`, quizError);
            }
            
            if (courseError) {
              console.error(`Error fetching course count for creator ${creator.id}:`, courseError);
            }
            
            return { 
              ...creator, 
              quiz_count: quizzes?.length || 0,
              course_count: courses?.length || 0
            };
          })
        );
        
        setCreators(creatorsWithCounts);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreators();
  }, []);

  if (isLoading) {
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Content Creators</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
          >
            Back to Home
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {creators.length === 0 ? (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <p className="text-yellow-700">No creators found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creators.map((creator) => (
              <div key={creator.id} className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden mr-4 bg-gradient-to-r from-purple-500 to-indigo-600 p-0.5">
                      <div className="h-full w-full rounded-full overflow-hidden bg-white">
                        {creator.profile_image ? (
                          <img 
                            src={creator.profile_image} 
                            alt={creator.full_name || 'Creator'} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://via.placeholder.com/150?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full w-full bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xl font-bold">
                            {(creator.full_name || creator.email || 'C').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{creator.full_name || creator.email}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-1">
                          <span>🧠</span>
                          <span>{creator.quiz_count} {creator.quiz_count === 1 ? 'quiz' : 'quizzes'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span>📚</span>
                          <span>{creator.course_count} {creator.course_count === 1 ? 'course' : 'courses'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">{creator.bio}</p>
                  )}
                  
                  {/* Content Summary */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <div className="text-2xl text-purple-600 font-bold">{creator.quiz_count}</div>
                      <div className="text-xs text-purple-700">Quizzes</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <div className="text-2xl text-green-600 font-bold">{creator.course_count}</div>
                      <div className="text-xs text-green-700">Courses</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={() => router.push(`/creators/${creator.id}`)}
                      fullWidth
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    >
                      View Profile
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => router.push(`/creators/${creator.id}/quizzes`)}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        🧠 Quizzes
                      </Button>
                      <Button 
                        onClick={() => router.push(`/creators/${creator.id}/courses`)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        📚 Courses
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 