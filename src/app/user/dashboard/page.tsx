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

export default function UserDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [userAttempts, setUserAttempts] = useState<Record<string, any>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchQuizzes() {
      if (!user) return;

      try {
        console.log('Fetching available quizzes...');
        
        // Fetch published quizzes
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select(`
            id, 
            title, 
            description, 
            is_published,
            creator_id
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (quizzesError) {
          console.error('Error fetching quizzes:', quizzesError);
          throw quizzesError;
        }
        
        console.log(`Found ${quizzes?.length || 0} published quizzes`);
        
        // Fetch creator info for each quiz
        const quizzesWithCreator: Quiz[] = (quizzes || []).map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          is_published: q.is_published,
          creator_id: q.creator_id,
          question_count: 0
        }));
        
        // For each quiz, fetch creator info and question count
        if (quizzes && quizzes.length > 0) {
          for (let i = 0; i < quizzes.length; i++) {
            const quiz = quizzes[i];
            
            // Get creator info
            if (quiz.creator_id) {
              const { data: creatorData, error: creatorError } = await supabase
                .from('users')
                .select('full_name, email')
                .eq('id', quiz.creator_id)
                .single();
                
              if (!creatorError && creatorData) {
                quizzesWithCreator[i].creator = creatorData;
              }
            }
            
            // Get question count
            const { count, error: countError } = await supabase
              .from('quiz_questions')
              .select('id', { count: 'exact', head: true })
              .eq('quiz_id', quiz.id);
              
            if (!countError) {
              quizzesWithCreator[i].question_count = count || 0;
            }
          }
        }
        
        setAvailableQuizzes(quizzesWithCreator);
        
        // Fetch user attempts
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            id,
            quiz_id,
            score,
            completed,
            completed_at,
            quizzes (
              title
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });
          
        if (attemptsError) {
          console.error('Error fetching user attempts:', attemptsError);
          throw attemptsError;
        }
        
        console.log(`Found ${attempts?.length || 0} quiz attempts by user`);
        setUserAttempts(attempts || []);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchQuizzes();
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
            <h2 className="text-xl font-medium text-gray-900">Your Quiz Progress</h2>
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
                  {userAttempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.quizzes?.title || 'Unknown Quiz'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.completed ? (
                          <div className="text-sm text-gray-900">{attempt.score}%</div>
                        ) : (
                          <div className="text-sm text-gray-500">In progress</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.completed ? (
                          <div className="text-sm text-gray-900">
                            {new Date(attempt.completed_at).toLocaleString()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not completed</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => attempt.completed 
                            ? router.push(`/user/results`)
                            : router.push(`/user/quiz/${attempt.quiz_id}`)
                          }
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          {attempt.completed ? 'View Results' : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-medium text-gray-900">Available Quizzes</h2>
          
          {availableQuizzes.length === 0 ? (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">No quizzes are currently available. Please check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableQuizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{quiz.description}</p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                      <div>
                        {quiz.question_count} {quiz.question_count === 1 ? 'question' : 'questions'}
                      </div>
                      <div>
                        By: {quiz.creator?.full_name || quiz.creator?.email || 'Unknown'}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => router.push(`/user/quiz/${quiz.id}`)}
                      fullWidth
                    >
                      Start Quiz
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
} 