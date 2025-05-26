'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { motion } from 'framer-motion';

type Quiz = {
  id: string;
  title: string;
  description: string;
  is_published: boolean;
  creator_id: string;
  creator?: {
    full_name: string;
    email: string;
  };
  question_count?: number;
};

type QuizAttempt = {
  id: string;
  quiz_id: string;
  score: number;
  completed: boolean;
  completed_at: string;
  quiz: {
    title: string;
  };
};

export default function UserDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;

      try {
        console.log('Fetching dashboard data...');
        
        // Fetch all data in parallel for better performance
        const [quizzesResult, attemptsResult] = await Promise.all([
          // Fetch published quizzes with creator info in a single query
          supabase
            .from('quizzes')
            .select(`
              id, 
              title, 
              description, 
              is_published,
              creator_id,
              users!creator_id (
                full_name,
                email
              )
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(20), // Limit to improve performance
          
          // Fetch user attempts with quiz info
          supabase
            .from('quiz_attempts')
            .select(`
              id,
              quiz_id,
              score,
              completed,
              completed_at,
              quizzes!quiz_id (
                title
              )
            `)
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(10) // Limit recent attempts
        ]);

        if (quizzesResult.error) {
          console.error('Error fetching quizzes:', quizzesResult.error);
          throw quizzesResult.error;
        }
        
        if (attemptsResult.error) {
          console.error('Error fetching attempts:', attemptsResult.error);
          throw attemptsResult.error;
        }
        
        console.log(`Found ${quizzesResult.data?.length || 0} published quizzes`);
        console.log(`Found ${attemptsResult.data?.length || 0} quiz attempts by user`);
        
        // Process quizzes data
        const processedQuizzes: Quiz[] = (quizzesResult.data || []).map((quiz) => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          is_published: quiz.is_published,
          creator_id: quiz.creator_id,
          creator: (quiz as any).users ? {
            full_name: (quiz as any).users.full_name,
            email: (quiz as any).users.email
          } : undefined,
          question_count: 0 // We'll fetch this separately if needed
        }));
        
        // Process attempts data
        const processedAttempts: QuizAttempt[] = (attemptsResult.data || []).map((attempt) => ({
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          score: attempt.score,
          completed: attempt.completed,
          completed_at: attempt.completed_at,
          quiz: (attempt as any).quizzes ? {
            title: (attempt as any).quizzes.title
          } : { title: 'Unknown Quiz' }
        }));
        
        setAvailableQuizzes(processedQuizzes);
        setUserAttempts(processedAttempts);
        
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <LoadingIndicator 
          size="lg" 
          message="Loading your dashboard..."
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 p-4 rounded-md"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
        
        {userAttempts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-medium text-gray-900">Your Recent Quiz Progress</h2>
            <div className="bg-white shadow overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quiz
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userAttempts.slice(0, 5).map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.quiz?.title || 'Unknown Quiz'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attempt.score >= 80 ? 'bg-green-100 text-green-800' :
                          attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {attempt.score}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/user/results/${attempt.id}`)}
                        >
                          View Results
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {userAttempts.length > 5 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/user/results')}
                >
                  View All Results
                </Button>
              </div>
            )}
          </motion.div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-gray-900">Available Quizzes</h2>
            <Button
              variant="outline"
              onClick={() => router.push('/creators')}
            >
              Browse Creators
            </Button>
          </div>
          
          {availableQuizzes.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 border border-gray-200 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
              <p className="text-gray-500">
                There are no published quizzes available at the moment. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableQuizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white shadow rounded-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{quiz.description}</p>
                  
                  {quiz.creator && (
                    <p className="text-xs text-gray-500 mb-4">
                      Created by {quiz.creator.full_name}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Quiz • Multiple Choice
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/user/quiz/${quiz.id}`)}
                    >
                      Take Quiz
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
} 