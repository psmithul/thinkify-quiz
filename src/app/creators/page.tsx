'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type CreatorWithQuizCount = User & {
  quiz_count: number;
};

export default function CreatorsListPage() {
  const router = useRouter();
  const [creators, setCreators] = useState<CreatorWithQuizCount[]>([]);
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
        
        // Set creators with a default quiz count of 0 to avoid the 400 error
        const creatorsWithCounts = (data || []).map(creator => {
          return { ...creator, quiz_count: 0 };
        });
        
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
          <h1 className="text-3xl font-bold text-gray-900">Quiz Creators</h1>
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
              <div key={creator.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="h-16 w-16 rounded-full overflow-hidden mr-4 bg-gray-100 border border-gray-300">
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
                        <div className="flex items-center justify-center h-full w-full bg-purple-100 text-purple-800 text-xl font-bold">
                          {(creator.full_name || creator.email || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{creator.full_name || creator.email}</h3>
                      <p className="text-sm text-gray-500">
                        {creator.quiz_count} {creator.quiz_count === 1 ? 'quiz' : 'quizzes'} created
                      </p>
                    </div>
                  </div>
                  
                  {creator.bio && (
                    <p className="text-gray-600 mb-4 line-clamp-3">{creator.bio}</p>
                  )}
                  
                  <Button 
                    onClick={() => router.push(`/creator/${creator.id}`)}
                    fullWidth
                  >
                    View Creator Profile
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 