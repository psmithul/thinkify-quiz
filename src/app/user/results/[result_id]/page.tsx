'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { getEligibilityTier } from '../../quiz/[quiz_id]/client';
import { CompanyShortlist } from '@/components/CompanyShortlist';
import { motion } from 'framer-motion';

type ResultWithDetails = {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  completed_at: string;
  quiz: {
    id: string;
    title: string;
    description: string;
    category: string;
    tier_thresholds: string;
    creator: {
      full_name: string;
      email: string;
    };
  };
};

interface PageProps {
  params: Promise<{ result_id: string }>;
}

export default function IndividualResultPage({ params }: PageProps) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [result, setResult] = useState<ResultWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string>('');
  const [eligibilityTier, setEligibilityTier] = useState<ReturnType<typeof getEligibilityTier> | null>(null);

  // Unwrap params
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setResultId(resolvedParams.result_id);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchResult() {
      if (!user || !resultId) return;

      try {
        console.log('Fetching result details for:', resultId);
        
        // Fetch the result and related quiz data
        const { data, error } = await supabase
          .from('quiz_attempts')
          .select(`
            *,
            quiz:quizzes(
              id, 
              title, 
              description, 
              category,
              tier_thresholds,
              creator:users(full_name, email)
            )
          `)
          .eq('id', resultId)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Result not found');

        setResult(data);
        
        // Calculate eligibility tier with custom thresholds if available
        const eligibilityTier = getEligibilityTier(data.score, data.quiz?.tier_thresholds);
        setEligibilityTier(eligibilityTier);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user && resultId) {
      fetchResult();
    }
  }, [user, resultId]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !result) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Result</h1>
            <Button 
              variant="outline" 
              onClick={() => router.push('/user/results')}
            >
              Back to Results
            </Button>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Result</h2>
            <p className="text-red-700">
              {error || 'Result not found or you do not have permission to view it.'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Quiz Result Details</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/user/results')}
          >
            Back to Results
          </Button>
        </div>

        {/* Result Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white shadow rounded-lg p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{result.quiz.title}</h2>
            <div className={`text-lg font-bold rounded-full px-4 py-2 ${
              result.score >= 80 ? 'bg-green-100 text-green-800' : 
              result.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {result.score.toFixed(1)}%
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">{result.quiz.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Completed On</div>
              <div className="font-medium">
                {new Date(result.completed_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(result.completed_at).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Your Score</div>
              <div className="text-2xl font-bold text-purple-600">
                {result.score.toFixed(1)}%
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">Eligibility Tier</div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${eligibilityTier?.bgClass} ${eligibilityTier?.textClass}`}>
                Tier {eligibilityTier?.tier}: {eligibilityTier?.label}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4"
        >
          <Button 
            onClick={() => router.push(`/user/quiz/${result.quiz_id}`)}
            variant="outline"
          >
            Retake Quiz
          </Button>
          
          {eligibilityTier && eligibilityTier.tier >= 3 && (
            <Button 
              onClick={() => router.push(`/user/certificate/${result.id}`)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              🏆 View Certificate
            </Button>
          )}
        </motion.div>

        {/* Company Opportunities */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Opportunities</h2>
          {eligibilityTier && (
            <CompanyShortlist userTier={eligibilityTier.tier} quizId={result.quiz_id} />
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
} 