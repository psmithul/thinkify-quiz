'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

type QuizAttempt = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    profile_image?: string;
  };
};

type Quiz = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  created_by: string;
};

export default function ResultsClient({
  quizId
}: {
  quizId: string;
}) {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isAdmin) {
        router.push('/user/dashboard');
      }
    }
  }, [authLoading, user, isAdmin, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user || !isAdmin) return;
      
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        // Fetch quiz attempts with user info
        const { data: attemptsData, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            user:users(id, email, full_name, profile_image)
          `)
          .eq('quiz_id', quizId)
          .order('completed_at', { ascending: false });

        if (attemptsError) throw attemptsError;
        setAttempts(attemptsData || []);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin, quizId]);

  // Calculate stats
  const averageScore = attempts.length > 0 
    ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length 
    : 0;
  
  const highestScore = attempts.length > 0
    ? Math.max(...attempts.map(attempt => attempt.score))
    : 0;
    
  const lowestScore = attempts.length > 0
    ? Math.min(...attempts.map(attempt => attempt.score))
    : 0;

  const passRate = attempts.length > 0
    ? (attempts.filter(attempt => attempt.score >= 70).length / attempts.length) * 100
    : 0;

  if (authLoading || isLoading) {
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
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {quiz?.title ? `Results: ${quiz.title}` : 'Quiz Results'}
          </h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {quiz && (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Quiz Overview</h2>
            <p className="text-gray-700 mb-4">{quiz.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Total Attempts</h3>
                <p className="text-2xl font-bold text-purple-900">{attempts.length}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Average Score</h3>
                <p className="text-2xl font-bold text-blue-900">{averageScore.toFixed(1)}%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Highest Score</h3>
                <p className="text-2xl font-bold text-green-900">{highestScore.toFixed(1)}%</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800">Pass Rate</h3>
                <p className="text-2xl font-bold text-yellow-900">{passRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}

        {attempts.length === 0 ? (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">No Results Yet</h2>
            <p className="text-yellow-700">
              There are no results for this quiz yet. When users complete this quiz, their results will appear here.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed On</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {attempt.user?.full_name || attempt.user?.email || 'Unknown User'}
                          </div>
                          {attempt.user?.email && (
                            <div className="text-sm text-gray-500">
                              {attempt.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                        ${attempt.score >= 80 ? 'bg-green-100 text-green-800' : 
                         attempt.score >= 70 ? 'bg-blue-100 text-blue-800' : 
                         attempt.score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                         'bg-red-100 text-red-800'}`}>
                        {attempt.score.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(attempt.completed_at).toLocaleDateString()} {new Date(attempt.completed_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => router.push(`/admin/users/${attempt.user_id}`)}
                      >
                        View User
                      </button>
                      {/* If you implement a feature to view individual result details */}
                      {/* <button
                        className="ml-4 text-purple-600 hover:text-purple-900"
                        onClick={() => router.push(`/admin/results/detail/${attempt.id}`)}
                      >
                        Details
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
} 