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

export function CreatorProfile({ creatorId }: { creatorId: string }) {
  const router = useRouter();
  const [creator, setCreator] = useState<CreatorWithQuizzes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   
  useEffect(() => {
    async function fetchCreatorProfile() {
      try {
        // Fetch creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('users')
          .select('*')
          .eq('id', creatorId)
          .in('role', ['creator', 'admin'])
          .single();

        if (creatorError) throw creatorError;
        
        // Fetch creator's quizzes
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
      fetchCreatorProfile();
    }
  }, [creatorId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (!creator) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
            <Button 
              variant="outline" 
              onClick={() => router.push('/creators')}
            >
              Back to Creators
            </Button>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-red-700">Creator not found or no longer active.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Creator Profile</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/creators')}
          >
            Back to Creators
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
          <div className="p-8">
            <div className="flex flex-col md:flex-row">
              <div className="mb-6 md:mb-0 md:mr-8">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
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
                    <div className="flex items-center justify-center h-full w-full bg-purple-100 text-purple-800 text-4xl font-bold">
                      {(creator.full_name || creator.email || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {creator.full_name || creator.email}
                </h2>
                
                <div className="mb-4">
                  <span className="bg-purple-100 text-purple-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {creator.quizzes.length} {creator.quizzes.length === 1 ? 'Quiz' : 'Quizzes'}
                  </span>
                </div>
                
                {creator.bio && (
                  <div className="prose max-w-none text-gray-700">
                    <p>{creator.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quizzes by this Creator</h2>
          
          {creator.quizzes.length === 0 ? (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">This creator has no published quizzes yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creator.quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white shadow rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{quiz.description}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-medium text-gray-500">
                      {quiz.price ? `$${quiz.price.toFixed(2)}` : 'Free'}
                    </div>
                    <Button 
                      onClick={() => router.push(`/user/quiz/${quiz.id}`)}
                      size="sm"
                    >
                      Take Quiz
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 