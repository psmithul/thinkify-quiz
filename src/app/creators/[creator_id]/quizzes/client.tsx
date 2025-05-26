'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase, User, Quiz } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type CreatorWithQuizzes = User & {
  quizzes: Quiz[];
};

export function CreatorQuizzes({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorWithQuizzes | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreatorAndQuizzes() {
      try {
        // Fetch creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .single();

        if (creatorError) throw creatorError;

        // Fetch creator's published quizzes
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('creator_id', creatorId)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (quizzesError) throw quizzesError;

        setCreator({
          ...creatorData,
          quizzes: quizzesData || []
        });
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (creatorId) {
      fetchCreatorAndQuizzes();
    }
  }, [creatorId]);

  const filteredQuizzes = creator?.quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
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
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
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
                    <div className="flex items-center justify-center h-full w-full bg-purple-100 text-purple-700 text-2xl font-bold">
                      {(creator.full_name || creator.email || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Creator Quizzes</h1>
                <p className="text-purple-100 mt-2">
                  {creator.full_name || creator.email}'s Quizzes
                </p>
                <p className="text-purple-200 text-sm">
                  {creator.quizzes.length} {creator.quizzes.length === 1 ? 'quiz' : 'quizzes'} available
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/creators')}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600"
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

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="max-w-md">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Quizzes
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Search quizzes..."
            />
          </div>
        </div>

        {/* Quizzes Grid */}
        {filteredQuizzes.length === 0 ? (
          <div className="bg-yellow-50 rounded-xl p-8 text-center border border-yellow-200">
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-lg font-medium text-yellow-800 mb-2">No Quizzes Found</h2>
            <p className="text-yellow-600">
              {searchTerm 
                ? `No quizzes match your search "${searchTerm}".`
                : "This creator hasn't published any quizzes yet."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => router.push(`/quiz/${quiz.id}`)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">🧠</div>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                      Quiz
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {quiz.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {quiz.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{quiz.description ? quiz.description.length > 50 ? quiz.description.substring(0, 50) + '...' : quiz.description : 'No description'}</span>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <Button
                    fullWidth
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/quiz/${quiz.id}`);
                    }}
                  >
                    Take Quiz
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{creator.quizzes.length}</div>
              <div className="text-sm text-purple-700">Total Quizzes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{filteredQuizzes.length}</div>
              <div className="text-sm text-indigo-700">Matching Search</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{creator.quizzes.length}</div>
              <div className="text-sm text-green-700">All Quizzes</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 