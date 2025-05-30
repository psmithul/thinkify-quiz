'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

type QuestionOption = {
  id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
};

type QuestionAnalytics = {
  id: string;
  question: string;
  question_type: 'multiple_choice' | 'text';
  points: number;
  position: number;
  options?: QuestionOption[];
  analytics: {
    totalAttempts: number;
    correctAnswers: number;
    correctPercentage: number;
    averageTime?: number;
    answerDistribution: Record<string, number>;
    difficultyLevel: 'Easy' | 'Medium' | 'Hard';
    commonMistakes: string[];
  };
};

interface QuestionAnalyticsProps {
  quizId: string;
}

export function QuestionAnalytics({ quizId }: QuestionAnalyticsProps) {
  const [questions, setQuestions] = useState<QuestionAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestionAnalytics() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch questions with options
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select(`
            *,
            quiz_options (*)
          `)
          .eq('quiz_id', quizId)
          .order('position');

        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
          setQuestions([]);
          return;
        }

        // Fetch all quiz attempts for this quiz
        const { data: attempts, error: attemptsError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('is_completed', true);

        if (attemptsError) throw attemptsError;

        // Process analytics for each question
        const questionsWithAnalytics: QuestionAnalytics[] = await Promise.all(
          questionsData.map(async (question) => {
            const analytics = await analyzeQuestion(question, attempts || []);
            return {
              ...question,
              options: question.quiz_options || [],
              analytics
            };
          })
        );

        setQuestions(questionsWithAnalytics);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuestionAnalytics();
  }, [quizId]);

  async function analyzeQuestion(question: any, attempts: any[]): Promise<QuestionAnalytics['analytics']> {
    const totalAttempts = attempts.length;
    let correctAnswers = 0;
    const answerDistribution: Record<string, number> = {};
    const commonMistakes: string[] = [];

    // Find the correct answer
    let correctAnswer = '';
    if (question.question_type === 'multiple_choice' && question.quiz_options) {
      const correctOption = question.quiz_options.find((opt: any) => opt.is_correct);
      correctAnswer = correctOption?.option_text || '';
    }

    // Analyze each attempt
    attempts.forEach((attempt) => {
      try {
        const answers = JSON.parse(attempt.answers || '{}');
        const userAnswer = answers[question.id];

        if (userAnswer) {
          // Count answer distribution
          answerDistribution[userAnswer] = (answerDistribution[userAnswer] || 0) + 1;

          // Check if correct
          if (question.question_type === 'multiple_choice') {
            if (userAnswer === correctAnswer) {
              correctAnswers++;
            } else {
              // Track common mistakes
              if (!commonMistakes.includes(userAnswer) && commonMistakes.length < 3) {
                commonMistakes.push(userAnswer);
              }
            }
          } else {
            // For text questions, basic keyword matching (simplified)
            // In a real app, you'd implement more sophisticated matching
            if (userAnswer.toLowerCase().includes(correctAnswer.toLowerCase())) {
              correctAnswers++;
            }
          }
        }
      } catch (error) {
        console.warn('Error parsing answers for attempt:', attempt.id);
      }
    });

    const correctPercentage = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

    // Determine difficulty level based on success rate
    let difficultyLevel: 'Easy' | 'Medium' | 'Hard';
    if (correctPercentage >= 80) {
      difficultyLevel = 'Easy';
    } else if (correctPercentage >= 50) {
      difficultyLevel = 'Medium';
    } else {
      difficultyLevel = 'Hard';
    }

    return {
      totalAttempts,
      correctAnswers,
      correctPercentage,
      answerDistribution,
      difficultyLevel,
      commonMistakes: commonMistakes.slice(0, 3) // Limit to top 3 mistakes
    };
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessRateColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading question analytics...</p>
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
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Analytics</h3>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-500 text-lg mb-2">No Questions Found</p>
          <p className="text-gray-400 text-sm">This quiz doesn't have any questions to analyze</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Question Analytics Overview</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
            <div className="text-sm text-blue-600">Total Questions</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(questions.reduce((sum, q) => sum + q.analytics.correctPercentage, 0) / questions.length)}%
            </div>
            <div className="text-sm text-green-600">Average Success Rate</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {questions.filter(q => q.analytics.difficultyLevel === 'Hard').length}
            </div>
            <div className="text-sm text-purple-600">Challenging Questions</div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-800 text-sm font-bold rounded-full mr-3">
                      {index + 1}
                    </span>
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.analytics.difficultyLevel)}`}>
                        {question.analytics.difficultyLevel}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {question.points} point{question.points !== 1 ? 's' : ''}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        question.question_type === 'multiple_choice' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Text Answer'}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{question.question}</h4>
                </div>
              </div>

              {/* Analytics Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{question.analytics.totalAttempts}</div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-lg font-bold ${getSuccessRateColor(question.analytics.correctPercentage)}`}>
                    {question.analytics.correctPercentage}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{question.analytics.correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct Answers</div>
                </div>
              </div>

              {/* Detailed Analytics Toggle */}
              <button
                onClick={() => setSelectedQuestion(selectedQuestion === question.id ? null : question.id)}
                className="w-full text-left bg-gray-50 hover:bg-gray-100 transition-colors duration-200 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {selectedQuestion === question.id ? 'Hide' : 'Show'} Detailed Analytics
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                      selectedQuestion === question.id ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Analytics */}
              {selectedQuestion === question.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  {question.question_type === 'multiple_choice' && question.options && (
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">Answer Distribution</h5>
                      <div className="space-y-2">
                        {question.options.map((option) => {
                          const count = question.analytics.answerDistribution[option.option_text] || 0;
                          const percentage = question.analytics.totalAttempts > 0 
                            ? Math.round((count / question.analytics.totalAttempts) * 100) 
                            : 0;
                          
                          return (
                            <div key={option.id} className="flex items-center">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-sm font-medium ${
                                    option.is_correct ? 'text-green-700' : 'text-gray-700'
                                  }`}>
                                    {option.is_correct && '✓ '}{option.option_text}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {count} ({percentage}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      option.is_correct ? 'bg-green-500' : 'bg-red-300'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {question.analytics.commonMistakes.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Common Mistakes</h5>
                      <div className="space-y-1">
                        {question.analytics.commonMistakes.map((mistake, idx) => (
                          <div key={idx} className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
                            • {mistake}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {question.analytics.totalAttempts === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No completed attempts yet</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 