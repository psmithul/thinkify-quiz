'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { getEligibilityTier, EligibilityTier } from '../quiz/[quiz_id]/client';
import { motion } from 'framer-motion';
import { CompanyShortlist } from '@/components/CompanyShortlist';

type Result = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    id: string;
    title: string;
    description: string;
    category?: string;
  };
};

export default function UserResults() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompanyOpportunities, setShowCompanyOpportunities] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchResults() {
      if (!user) return;

      try {
        console.log('Fetching results for user:', user.id);
        
        // Fetch user's quiz results
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            quiz:quizzes(id, title, description)
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false });

        if (error) {
          console.error('Error fetching quiz attempts:', error);
          throw error;
        }
        
        console.log('Quiz attempts loaded:', data?.length || 0);
        setResults(data || []);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchResults();
    }
  }, [user]);

  const getEligibilityTierForResult = (result: Result): EligibilityTier => {
    // Try to get custom thresholds from the quiz if available
    // Since we don't have quiz data here, we'll use default tiers for now
    // In a real implementation, you might want to fetch quiz data or store tier_thresholds in results
    return getEligibilityTier(result.score);
  };

  const handleShowCompanyOpportunities = (result: Result) => {
    setSelectedResult(result);
    setShowCompanyOpportunities(true);
  };

  const handleBackToResults = () => {
    setShowCompanyOpportunities(false);
    setSelectedResult(null);
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

  if (showCompanyOpportunities && selectedResult) {
    return (
      <Layout>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Company Opportunities</h1>
            <Button 
              variant="outline" 
              onClick={handleBackToResults}
            >
              Back to Results
            </Button>
          </div>

          <CompanyShortlist 
            userTier={getEligibilityTierForResult(selectedResult).tier}
            quizId={selectedResult.quiz_id}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Quiz Results</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/user/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {results.length === 0 ? (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h2 className="text-lg font-medium text-yellow-800 mb-2">No Results Yet</h2>
            <p className="text-yellow-700">
              You haven't completed any quizzes yet. Complete a quiz to see your results here.
            </p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg border border-gray-200">
            {/* Mobile Card View */}
            <div className="block md:hidden">
              <div className="space-y-4 p-4">
                {results.map((result) => {
                  const eligibilityTier = getEligibilityTierForResult(result);
                  return (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {result.quiz?.title || 'Unknown Quiz'}
                        </h3>
                        <div className={`text-xs font-medium rounded-full px-2 py-1
                          ${result.score >= 80 ? 'bg-green-100 text-green-800' : 
                           result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                           'bg-red-100 text-red-800'}`}>
                          {result.score.toFixed(1)}%
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(result.completed_at).toLocaleDateString()}
                      </div>
                      
                      <div className="mb-3">
                        <div className={`text-xs font-bold rounded-full px-2 py-1 inline-block ${eligibilityTier.bgClass} ${eligibilityTier.textClass} border ${eligibilityTier.borderClass}`}>
                          {eligibilityTier.label} (Tier {eligibilityTier.tier})
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/user/results/${result.id}`)}
                          className="text-xs"
                        >
                          📊 Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShowCompanyOpportunities(result)}
                          className="text-xs"
                        >
                          🏢 Companies
                        </Button>
                        {eligibilityTier.tier >= 3 && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => router.push(`/user/certificate/${result.id}`)}
                            className="text-xs bg-green-600 hover:bg-green-700"
                          >
                            🏆 Certificate
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quiz</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Completed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eligibility</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result) => {
                    const eligibilityTier = getEligibilityTierForResult(result);
                    return (
                      <motion.tr 
                        key={result.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.quiz?.title || 'Unknown Quiz'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(result.completed_at).toLocaleDateString()} {new Date(result.completed_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium rounded-full px-2 py-1 inline-block
                            ${result.score >= 80 ? 'bg-green-100 text-green-800' : 
                             result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                             'bg-red-100 text-red-800'}`}>
                            {result.score.toFixed(1)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold rounded-full px-3 py-2 inline-block ${eligibilityTier.bgClass} ${eligibilityTier.textClass} border ${eligibilityTier.borderClass}`}>
                            {eligibilityTier.label} (Tier {eligibilityTier.tier})
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/user/results/${result.id}`)}
                              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                            >
                              📊 View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/user/quiz/${result.quiz_id}`)}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50 hover:border-purple-300"
                            >
                              🧠 View Quiz
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleShowCompanyOpportunities(result)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                            >
                              🏢 Company Opportunities
                            </Button>
                            {eligibilityTier.tier >= 3 && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => router.push(`/user/certificate/${result.id}`)}
                                className="bg-green-600 hover:bg-green-700 border-green-600"
                              >
                                🏆 Certificate
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 