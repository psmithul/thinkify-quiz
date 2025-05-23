'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase, Quiz } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { getEligibilityTier } from '@/app/user/quiz/[quiz_id]/client';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { motion } from 'framer-motion';

// Define QuizAttempt type to replace the old Result type
type QuizAttempt = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
};

type QuizWithStats = Quiz & {
  attempts: QuizAttempt[];
  completion_count: number;
  average_score: number;
  pass_rate: number; // Percentage of users with Tier 3+ eligibility
};

type AttemptWithUser = QuizAttempt & {
  user: {
    id: string;
    email: string;
    full_name?: string;
  };
};

export function QuizStats({ quizId }: { quizId: string }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<QuizWithStats | null>(null);
  const [attempts, setAttempts] = useState<AttemptWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
   
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    if (!authLoading && user && user.role !== 'creator' && user.role !== 'admin') {
      router.push('/user/dashboard');
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchQuizStats() {
      if (!user) return;

      try {
        console.log('Fetching stats for quiz:', quizId);
        
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          console.error('Error fetching quiz data:', quizError);
          throw quizError;
        }
        
        console.log('Quiz data:', quizData);
        console.log('Current user:', user);
        console.log('Creator check:', quizData.creator_id, user.id, quizData.creator_id === user.id);
        
        // Check if quiz belongs to current creator
        if (quizData.creator_id !== user.id && user.role !== 'admin') {
          console.error('User does not have permission to view this quiz', {
            quizCreatorId: quizData.creator_id,
            userId: user.id,
            userRole: user.role
          });
          router.push('/creator/dashboard');
          return;
        }
        
        // Fetch quiz results with user details
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*, users:user_id(id, email, full_name)')
          .eq('quiz_id', quizId)
          .order('completed_at', { ascending: false });
          
        if (attemptsError) {
          console.error('Error fetching attempts data:', attemptsError);
          throw attemptsError;
        }
        
        // Process the attempt data to match our expected format
        const processedAttempts = attemptsData?.map(attempt => ({
          id: attempt.id,
          user_id: attempt.user_id,
          quiz_id: attempt.quiz_id,
          score: attempt.score,
          completed_at: attempt.completed_at,
          user: attempt.users
        })) || [];
        
        console.log('Processed attempts data:', processedAttempts);
        setAttempts(processedAttempts);
        
        // Calculate stats
        const completionCount = processedAttempts.length;
        const totalScore = processedAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
        const averageScore = completionCount > 0 ? totalScore / completionCount : 0;
        const passCount = processedAttempts.filter(attempt => getEligibilityTier(attempt.score).tier >= 3).length;
        const passRate = completionCount > 0 ? (passCount / completionCount) * 100 : 0;
        
        setQuiz({
          ...quizData,
          attempts: processedAttempts,
          completion_count: completionCount,
          average_score: averageScore,
          pass_rate: passRate
        });
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user && quizId) {
      fetchQuizStats();
    }
  }, [user, quizId, router]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <LoadingIndicator 
          size="lg" 
          message="Loading quiz statistics..."
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Quiz Statistics</h1>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push(`/creator/quiz/${quizId}/edit`)}
            >
              Edit Quiz
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/creator/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {quiz && (
          <>
            <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{quiz.title}</h2>
              <p className="text-gray-600 mb-6">{quiz.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-medium text-blue-800 uppercase tracking-wide">Completions</h3>
                  <p className="mt-2 text-3xl font-bold text-blue-900">{quiz.completion_count}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-sm font-medium text-green-800 uppercase tracking-wide">Average Score</h3>
                  <p className="mt-2 text-3xl font-bold text-green-900">{quiz.average_score.toFixed(1)}%</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-sm font-medium text-purple-800 uppercase tracking-wide">Pass Rate (Tier 3+)</h3>
                  <p className="mt-2 text-3xl font-bold text-purple-900">{quiz.pass_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Results</h2>
              
              {attempts.length === 0 ? (
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <p className="text-yellow-700">No users have completed this quiz yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Completed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eligibility</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attempts.map((attempt) => {
                        const eligibilityTier = getEligibilityTier(attempt.score);
                        return (
                          <tr key={attempt.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {attempt.user?.full_name || 'Unnamed User'}
                              </div>
                              <div className="text-sm text-gray-500">{attempt.user?.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(attempt.completed_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium rounded-full px-2 py-1 inline-block bg-gray-100 text-gray-800">
                                {attempt.score.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-bold px-3 py-2 rounded-full inline-block ${eligibilityTier.bgClass} ${eligibilityTier.textClass}`}>
                                {eligibilityTier.label} (Tier {eligibilityTier.tier})
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
} 