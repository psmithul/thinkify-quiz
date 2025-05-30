'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';
import { getEligibilityTier, EligibilityTier } from '@/app/user/quiz/[quiz_id]/client';

type StudentResult = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  is_completed: boolean;
  completed_at: string;
  time_taken_seconds: number | null;
  answers: any;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
};

interface StudentResultsTabProps {
  quizId: string;
}

export function StudentResultsTab({ quizId }: StudentResultsTabProps) {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [quizDetails, setQuizDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);

  useEffect(() => {
    async function fetchStudentResults() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch quiz details first
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuizDetails(quiz);

        // Fetch all quiz attempts (both completed and incomplete for better insights)
        const { data, error: fetchError } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            user:users(id, email, full_name)
          `)
          .eq('quiz_id', quizId)
          .order('completed_at', { ascending: false });

        if (fetchError) throw fetchError;

        setResults(data || []);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchStudentResults();
  }, [quizId]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const getDisplayPercentage = (score: number) => {
    // Handle both decimal (0.67) and percentage (67) formats
    if (score <= 1) {
      // Score is stored as decimal (0.67 = 67%)
      return Math.round(score * 100);
    }
    // Score is already a percentage
    return Math.round(score);
  };

  const getRawPoints = (score: number, maxScore: number) => {
    const percentage = getDisplayPercentage(score);
    return Math.round((percentage / 100) * maxScore);
  };

  const getDetailedStats = () => {
    if (results.length === 0) return null;

    const completedResults = results.filter(r => r.is_completed);
    const incompletedResults = results.filter(r => !r.is_completed);
    
    if (completedResults.length === 0) {
      return {
        totalAttempts: results.length,
        completedAttempts: 0,
        incompleteAttempts: incompletedResults.length,
        averagePercentage: 0,
        highestPercentage: 0,
        lowestPercentage: 0,
        averageTime: 0,
        fastestTime: 0,
        slowestTime: 0,
        tierCounts: {}
      };
    }

    const percentages = completedResults.map(result => getDisplayPercentage(result.score));
    const times = completedResults
      .map(r => r.time_taken_seconds)
      .filter(t => t !== null) as number[];

    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);

    const avgTime = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0;
    const fastestTime = times.length > 0 ? Math.min(...times) : 0;
    const slowestTime = times.length > 0 ? Math.max(...times) : 0;

    const tierCounts = completedResults.reduce((acc, result) => {
      const percentage = getDisplayPercentage(result.score);
      const tier = getEligibilityTier(percentage, quizDetails?.tier_thresholds);
      acc[tier.tier] = (acc[tier.tier] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalAttempts: results.length,
      completedAttempts: completedResults.length,
      incompleteAttempts: incompletedResults.length,
      averagePercentage: Math.round(average),
      highestPercentage: highest,
      lowestPercentage: lowest,
      averageTime: Math.round(avgTime),
      fastestTime,
      slowestTime,
      tierCounts
    };
  };

  const stats = getDetailedStats();

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading student results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Results</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalAttempts}</div>
            <div className="text-sm text-gray-600">Total Attempts</div>
            <div className="text-xs text-gray-500 mt-1">
              {stats.completedAttempts} completed, {stats.incompleteAttempts} incomplete
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.averagePercentage}%</div>
            <div className="text-sm text-gray-600">Average Score</div>
            <div className="text-xs text-gray-500 mt-1">
              From {stats.completedAttempts} completed attempts
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.highestPercentage}%</div>
            <div className="text-sm text-gray-600">Highest Score</div>
            <div className="text-xs text-gray-500 mt-1">
              Lowest: {stats.lowestPercentage}%
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {formatDuration(stats.averageTime)}
            </div>
            <div className="text-sm text-gray-600">Average Time</div>
            <div className="text-xs text-gray-500 mt-1">
              Fastest: {formatDuration(stats.fastestTime)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tier Distribution */}
      {stats && stats.completedAttempts > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Distribution</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(tier => {
              const tierInfo = getEligibilityTier(tier === 1 ? 0 : tier === 2 ? 40 : tier === 3 ? 60 : tier === 4 ? 75 : 90, quizDetails?.tier_thresholds);
              const count = stats.tierCounts[tier] || 0;
              const percentage = stats.completedAttempts > 0 ? Math.round((count / stats.completedAttempts) * 100) : 0;
              return (
                <div key={tier} className={`text-center p-4 rounded-lg border ${tierInfo.borderClass} ${tierInfo.bgClass}`}>
                  <div className={`text-xl font-bold ${tierInfo.textClass}`}>{count}</div>
                  <div className={`text-sm ${tierInfo.textClass}`}>Tier {tier}</div>
                  <div className={`text-xs ${tierInfo.textClass}`}>{tierInfo.label}</div>
                  <div className={`text-xs ${tierInfo.textClass} mt-1`}>({percentage}%)</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Student Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            👥 Individual Results ({results.length})
          </h3>
          {results.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {stats?.completedAttempts || 0} completed out of {results.length} total attempts
            </div>
          )}
        </div>

        {results.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <p className="text-gray-500 text-lg mb-2">No attempts yet</p>
            <p className="text-gray-400 text-sm">Students who attempt this quiz will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time Taken
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => {
                    const percentage = getDisplayPercentage(result.score);
                    const rawPoints = getRawPoints(result.score, result.max_score);
                    const tier = getEligibilityTier(percentage, quizDetails?.tier_thresholds);
                    
                    return (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-purple-800">
                                  {(result.user?.full_name || result.user?.email || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {result.user?.full_name || 'Anonymous'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {result.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-lg font-bold text-gray-900">
                            {result.is_completed ? `${percentage}%` : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.is_completed ? `${rawPoints}/${result.max_score} points` : 'Incomplete'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.is_completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.is_completed ? '✅ Completed' : '⏳ In Progress'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {result.is_completed ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tier.bgClass} ${tier.textClass}`}>
                              Tier {tier.tier} - {tier.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDuration(result.time_taken_seconds)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {result.completed_at ? formatDate(result.completed_at) : 'In progress'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {results.map((result, index) => {
                const percentage = getDisplayPercentage(result.score);
                const rawPoints = getRawPoints(result.score, result.max_score);
                const tier = getEligibilityTier(percentage, quizDetails?.tier_thresholds);
                
                return (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-purple-800">
                            {(result.user?.full_name || result.user?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {result.user?.full_name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.user?.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {result.is_completed ? `${percentage}%` : 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {result.is_completed ? `${rawPoints}/${result.max_score}` : 'Incomplete'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        result.is_completed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.is_completed ? '✅ Completed' : '⏳ In Progress'}
                      </span>
                      
                      {result.is_completed && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tier.bgClass} ${tier.textClass}`}>
                          Tier {tier.tier} - {tier.label}
                        </span>
                      )}
                      
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        ⏱️ {formatDuration(result.time_taken_seconds)}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {result.completed_at ? `Completed: ${formatDate(result.completed_at)}` : 'Started but not completed'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
} 