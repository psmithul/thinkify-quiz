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
  created_at: string;
  updated_at: string;
  is_published: boolean;
  creator_id: string;
  question_count?: number;
};

type Question = {
  id: string;
  quiz_id: string;
  prompt: string;
  type: string;
  options: string[] | null;
  correct_answer: string;
};

type QuizClientProps = {
  quizId: string;
};

export default function QuizClient({ quizId }: QuizClientProps) {
  const router = useRouter();
  const { user, isCreator, isLoading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/login');
      } else if (!isCreator) {
        router.push('/user/dashboard');
      }
    }
  }, [authLoading, user, isCreator, router]);

  useEffect(() => {
    async function fetchQuizData() {
      if (!user || !isCreator) return;
      
      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;
        setQuiz(quizData);

        // Make sure this creator owns the quiz
        if (quizData.creator_id !== user.id) {
          setError("You don't have permission to view this quiz");
          setIsLoading(false);
          return;
        }

        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('id');

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

        // Fetch attempts count
        const { count, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('quiz_id', quizId);

        if (attemptsError) throw attemptsError;
        setTotalAttempts(count || 0);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isCreator) {
      fetchQuizData();
    }
  }, [user, isCreator, quizId]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <LoadingIndicator 
          size="lg" 
          message="Loading quiz details..."
        />
      </Layout>
    );
  }

  if (error || !quiz) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Details</h1>
            <Button 
              variant="outline" 
              onClick={() => router.push('/creator/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <p className="text-red-700">{error || "Quiz not found"}</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Quiz Details</h1>
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/creator/dashboard')}
            >
              Back to Dashboard
            </Button>
            <Button 
              onClick={() => router.push(`/creator/quiz/${quizId}/edit`)}
            >
              Edit Quiz
            </Button>
          </div>
        </div>
        
        {/* Quiz Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow rounded-lg p-6 border border-gray-200"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
              <div className="flex items-center mt-2 space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  quiz.is_published 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
                <span className="text-sm text-gray-500">
                  Created: {new Date(quiz.created_at).toLocaleDateString()}
                </span>
                {quiz.updated_at && (
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(quiz.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-gray-700">{quiz.description}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Questions</h3>
                <p className="text-2xl font-bold text-purple-900">{questions.length}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Total Attempts</h3>
                <p className="text-2xl font-bold text-blue-900">{totalAttempts}</p>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Question List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Questions</h2>
          
          {questions.length === 0 ? (
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <p className="text-yellow-700">No questions have been added to this quiz yet.</p>
              <Button 
                onClick={() => router.push(`/creator/quiz/${quizId}/edit`)}
                className="mt-4"
                size="sm"
              >
                Add Questions
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <motion.div 
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white shadow rounded-lg p-6 border border-gray-200"
                >
                  <div className="flex justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Question {index + 1}</h3>
                    <span className="text-sm text-gray-500">Type: {question.type}</span>
                  </div>
                  
                  <p className="mt-2 text-gray-700">{question.prompt}</p>
                  
                  {question.options && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium text-gray-700">Options:</h4>
                      <ul className="space-y-1">
                        {question.options.map((option, optIndex) => (
                          <li key={optIndex} className="flex items-center space-x-2">
                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium ${
                              option === question.correct_answer 
                                ? 'bg-green-100 text-green-800 border border-green-300' 
                                : 'bg-gray-100 text-gray-800 border border-gray-300'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}
                            </span>
                            <span className={option === question.correct_answer ? 'font-medium' : ''}>
                              {option}
                              {option === question.correct_answer && (
                                <span className="ml-2 text-green-600 text-xs">(Correct)</span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {!question.options && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700">Correct Answer:</h4>
                      <p className="text-green-600">{question.correct_answer}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <Button 
            onClick={() => router.push(`/creator/quiz/${quizId}/edit`)}
            fullWidth
          >
            Edit Quiz
          </Button>
          
          <Button 
            onClick={() => router.push(`/creator/quiz/${quizId}/stats`)}
            variant="outline"
            fullWidth
          >
            View Analytics
          </Button>
        </div>
      </motion.div>
    </Layout>
  );
} 