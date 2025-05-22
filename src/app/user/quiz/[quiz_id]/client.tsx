'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

// Updated question type to match quiz_questions table
type Question = {
  id: string;
  quiz_id: string;
  question: string;
  question_type: 'multiple_choice' | 'text';
  points: number;
  position: number;
  options?: Option[];
};

type Option = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
};

type Quiz = {
  id: string;
  title: string;
  description: string;
  created_at: string;
  creator_id?: string;
  creator?: {
    id: string;
    full_name?: string;
    email: string;
  };
};

export type EligibilityTier = {
  tier: number;
  label: string;
  minScore: number;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
};

export const eligibilityTiers: EligibilityTier[] = [
  {
    tier: 1,
    label: "Beginner",
    minScore: 0,
    color: "red",
    bgClass: "bg-red-200",
    borderClass: "border-red-500",
    textClass: "text-red-900",
    description: "Not yet qualified. Additional training recommended."
  },
  {
    tier: 2,
    label: "Basic",
    minScore: 40,
    color: "orange",
    bgClass: "bg-orange-200",
    borderClass: "border-orange-500",
    textClass: "text-orange-900",
    description: "Basic understanding. Further improvement needed."
  },
  {
    tier: 3,
    label: "Intermediate",
    minScore: 60,
    color: "yellow",
    bgClass: "bg-yellow-200",
    borderClass: "border-yellow-600",
    textClass: "text-yellow-900",
    description: "Satisfactory performance. Eligible for certification."
  },
  {
    tier: 4,
    label: "Proficient",
    minScore: 75,
    color: "lime",
    bgClass: "bg-lime-200",
    borderClass: "border-lime-600",
    textClass: "text-lime-900",
    description: "Strong proficiency demonstrated. Well qualified."
  },
  {
    tier: 5,
    label: "Expert",
    minScore: 90,
    color: "green",
    bgClass: "bg-green-200",
    borderClass: "border-green-600",
    textClass: "text-green-900",
    description: "Expert level knowledge. Highly qualified."
  }
];

export function getEligibilityTier(score: number): EligibilityTier {
  // Find the highest tier the score qualifies for
  for (let i = eligibilityTiers.length - 1; i >= 0; i--) {
    if (score >= eligibilityTiers[i].minScore) {
      return eligibilityTiers[i];
    }
  }
  return eligibilityTiers[0]; // Default to lowest tier
}

export default function QuizClient({
  quizId
}: {
  quizId: string;
}) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [eligibilityTier, setEligibilityTier] = useState<EligibilityTier | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchQuizData() {
      if (!user) return;

      try {
        console.log('Fetching quiz with ID:', quizId);
        
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          console.error('Error fetching quiz:', quizError);
          throw quizError;
        }
        
        console.log('Quiz data loaded:', quizData);
        
        // If quiz has a creator_id, fetch creator info separately
        let creatorInfo = null;
        if (quizData.creator_id) {
          const { data: creatorData, error: creatorError } = await supabase
            .from('users')
            .select('id, full_name, email')
            .eq('id', quizData.creator_id)
            .single();
            
          if (!creatorError && creatorData) {
            creatorInfo = creatorData;
          }
        }
        
        // Combine quiz and creator data
        setQuiz({
          ...quizData,
          creator: creatorInfo
        });

        // Fetch questions from quiz_questions table
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('position');

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          throw questionsError;
        }
        
        console.log('Questions loaded:', questionsData?.length || 0);
        
        // Fetch options for multiple choice questions
        let questionsWithOptions = [...(questionsData || [])];
        
        if (questionsData && questionsData.length > 0) {
          const questionIds = questionsData.map(q => q.id);
          
          const { data: optionsData, error: optionsError } = await supabase
            .from('quiz_options')
            .select('*')
            .in('question_id', questionIds)
            .order('position');
            
          if (optionsError) {
            console.error('Error fetching options:', optionsError);
          } else if (optionsData) {
            console.log('Options loaded:', optionsData.length);
            
            // Group options by question_id
            const optionsByQuestion = optionsData.reduce((acc, option) => {
              if (!acc[option.question_id]) {
                acc[option.question_id] = [];
              }
              acc[option.question_id].push(option);
              return acc;
            }, {} as Record<string, Option[]>);
            
            // Add options to each question
            questionsWithOptions = questionsData.map(question => ({
              ...question,
              options: optionsByQuestion[question.id] || []
            }));
          }
        }
        
        setQuestions(questionsWithOptions);

        // Check if user has already completed this quiz
        const { data: attemptData, error: attemptError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', user.id)
          .eq('quiz_id', quizId)
          .maybeSingle();

        if (!attemptError && attemptData) {
          // User has already completed this quiz
          setScore(attemptData.score);
          setResultId(attemptData.id);
          setEligibilityTier(getEligibilityTier(attemptData.score));
          setSuccess('You have already completed this quiz!');
        }
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchQuizData();
    }
  }, [user, quizId, router]);

  function handleAnswerChange(questionId: string, answer: string) {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }

  function handleNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }

  function handlePreviousQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }

  async function handleSubmitQuiz() {
    if (!user || !quiz) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const allQuestionsAnswered = questions.every(q => answers[q.id]);
      
      if (!allQuestionsAnswered) {
        throw new Error('Please answer all questions before submitting');
      }
      
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      for (const question of questions) {
        const userAnswer = answers[question.id];
        totalPoints += question.points || 1;
        
        if (question.question_type === 'multiple_choice') {
          // Find the correct option
          const correctOption = question.options?.find(opt => opt.is_correct);
          if (correctOption && userAnswer === correctOption.option_text) {
            correctAnswers += question.points || 1;
          }
        } else {
          // Text questions would need some fuzzy matching logic
          // For now, this is just a placeholder
          // In a real app, you might compare to stored correct answers
        }
      }
      
      const finalScore = totalPoints > 0 ? Math.round((correctAnswers / totalPoints) * 100) : 0;
      const tier = getEligibilityTier(finalScore);
      
      // Save results to database
      const { data, error } = await supabase
        .from('quiz_attempts')
        .upsert({
          quiz_id: quizId,
          user_id: user.id,
          score: finalScore,
          max_score: totalPoints,
          completed: true,
          completed_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setResultId(data.id);
      setScore(finalScore);
      setEligibilityTier(tier);
      setSuccess('Quiz completed successfully!');
      
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (!quiz) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Quiz Not Found</h1>
          <p className="text-red-600 mb-4">
            The quiz you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
          >
            Go to Home
          </Button>
        </div>
      </Layout>
    );
  }

  if (score !== null && eligibilityTier) {
    // Show results if quiz is completed
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
            <Button
              variant="outline"
              onClick={() => router.push('/user/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
          
          <div className={`p-6 rounded-lg border ${eligibilityTier.borderClass} ${eligibilityTier.bgClass}`}>
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-2xl font-bold">Quiz Completed!</h2>
              <div className="flex items-center justify-center w-32 h-32 rounded-full border-4 border-current">
                <span className="text-4xl font-bold">{score}%</span>
              </div>
              <h3 className={`text-xl font-bold ${eligibilityTier.textClass}`}>
                {eligibilityTier.label} Level
              </h3>
              <p>{eligibilityTier.description}</p>
              
              {eligibilityTier.tier >= 3 && (
                <Button
                  onClick={() => router.push(`/user/certificate/${resultId}`)}
                  fullWidth
                >
                  View Your Certificate
                </Button>
              )}
            </div>
          </div>
          
          <Button
            onClick={() => router.push('/user/dashboard')}
            variant="outline"
            fullWidth
          >
            Back to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  // Show quiz questions
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          <Button
            variant="outline"
            onClick={() => router.push('/user/dashboard')}
          >
            Exit Quiz
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}
        
        {questions.length === 0 ? (
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <p className="text-yellow-700">This quiz doesn't have any questions yet.</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            
            <h2 className="text-xl font-medium text-gray-900 mb-6">{currentQuestion.question}</h2>
            
            {currentQuestion.question_type === 'multiple_choice' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option, i) => (
                  <div key={option.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`option-${option.id}`}
                      name={`question-${currentQuestion.id}`}
                      value={option.option_text}
                      checked={answers[currentQuestion.id] === option.option_text}
                      onChange={() => handleAnswerChange(currentQuestion.id, option.option_text)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <label 
                      htmlFor={`option-${option.id}`}
                      className="ml-3 block text-gray-700"
                    >
                      {option.option_text}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {currentQuestion.question_type === 'text' && (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Enter your answer"
                />
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="outline"
              >
                Previous
              </Button>
              
              {currentQuestionIndex < questions.length - 1 ? (
                <Button onClick={handleNextQuestion}>
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 