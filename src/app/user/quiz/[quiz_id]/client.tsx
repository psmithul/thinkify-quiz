'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import QuizTimer from '@/components/QuizTimer';

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
  time_limit_minutes?: number;
  tier_thresholds?: any;
  category?: string;
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
    bgClass: "bg-red-100",
    borderClass: "border-red-500",
    textClass: "text-red-900",
    description: "Not yet qualified. Additional training recommended."
  },
  {
    tier: 2,
    label: "Basic",
    minScore: 40,
    color: "orange",
    bgClass: "bg-orange-100",
    borderClass: "border-orange-500",
    textClass: "text-orange-900",
    description: "Basic understanding. Further improvement needed."
  },
  {
    tier: 3,
    label: "Intermediate",
    minScore: 60,
    color: "yellow",
    bgClass: "bg-yellow-100",
    borderClass: "border-yellow-600",
    textClass: "text-yellow-900",
    description: "Satisfactory performance. Eligible for certification."
  },
  {
    tier: 4,
    label: "Proficient",
    minScore: 75,
    color: "lime",
    bgClass: "bg-lime-100",
    borderClass: "border-lime-600",
    textClass: "text-lime-900",
    description: "Strong proficiency demonstrated. Well qualified."
  },
  {
    tier: 5,
    label: "Expert",
    minScore: 90,
    color: "green",
    bgClass: "bg-green-100",
    borderClass: "border-green-600",
    textClass: "text-green-900",
    description: "Expert level knowledge. Highly qualified."
  }
];

export function getEligibilityTier(score: number, customThresholds?: any): EligibilityTier {
  let thresholds = eligibilityTiers;
  
  // If custom thresholds are provided, use them
  if (customThresholds && typeof customThresholds === 'object') {
    try {
      thresholds = [
        {
          tier: 1,
          label: "Beginner",
          minScore: 0, // Always starts at 0
          color: "red",
          bgClass: "bg-red-100",
          borderClass: "border-red-500",
          textClass: "text-red-900",
          description: "Not yet qualified. Additional training recommended."
        },
        {
          tier: 2,
          label: "Basic",
          minScore: customThresholds.tier_2?.min_score || 40,
          color: "orange",
          bgClass: "bg-orange-100",
          borderClass: "border-orange-500",
          textClass: "text-orange-900",
          description: "Basic understanding. Further improvement needed."
        },
        {
          tier: 3,
          label: "Intermediate",
          minScore: customThresholds.tier_3?.min_score || 60,
          color: "yellow",
          bgClass: "bg-yellow-100",
          borderClass: "border-yellow-600",
          textClass: "text-yellow-900",
          description: "Satisfactory performance. Eligible for certification."
        },
        {
          tier: 4,
          label: "Proficient",
          minScore: customThresholds.tier_4?.min_score || 75,
          color: "lime",
          bgClass: "bg-lime-100",
          borderClass: "border-lime-600",
          textClass: "text-lime-900",
          description: "Strong proficiency demonstrated. Well qualified."
        },
        {
          tier: 5,
          label: "Expert",
          minScore: customThresholds.tier_5?.min_score || 90,
          color: "green",
          bgClass: "bg-green-100",
          borderClass: "border-green-600",
          textClass: "text-green-900",
          description: "Expert level knowledge. Highly qualified."
        }
      ];
    } catch (error) {
      // Silently fall back to defaults in production
    }
  }
  
  // Find the highest tier the score qualifies for
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i].minScore) {
      return thresholds[i];
    }
  }
  
  return thresholds[0]; // Default to lowest tier
}

// Code Formatter Component for displaying code blocks properly
const CodeBlock = ({ children }: { children: string }) => {
  // Check if there are code blocks in the text
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  const matches = [...children.matchAll(codeBlockRegex)];
  
  if (matches.length > 0) {
    // Split the text by code blocks and render each part
    const parts = [];
    let lastIndex = 0;
    
    matches.forEach((match, index) => {
      const matchStart = match.index!;
      const matchEnd = matchStart + match[0].length;
      
      // Add text before the code block
      if (matchStart > lastIndex) {
        const textBefore = children.slice(lastIndex, matchStart);
        if (textBefore.trim()) {
          parts.push(
            <div key={`text-${index}`} className="mb-4">
              <span 
                className="question-text"
                dangerouslySetInnerHTML={{
                  __html: textBefore.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
                }}
              />
            </div>
          );
        }
      }
      
      // Add the code block
      const language = match[1] || '';
      const code = match[2].trim();
      
      parts.push(
        <div key={`code-${index}`} className="my-4 bg-gray-900 rounded-lg overflow-hidden">
          {language && (
            <div className="bg-gray-800 px-4 py-2 text-xs font-medium text-gray-300 uppercase tracking-wide">
              {language}
            </div>
          )}
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
              {code}
            </code>
          </pre>
        </div>
      );
      
      lastIndex = matchEnd;
    });
    
    // Add any remaining text after the last code block
    if (lastIndex < children.length) {
      const textAfter = children.slice(lastIndex);
      if (textAfter.trim()) {
        parts.push(
          <div key="text-after" className="mt-4">
            <span 
              className="question-text"
              dangerouslySetInnerHTML={{
                __html: textAfter.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
              }}
            />
          </div>
        );
      }
    }
    
    return <div>{parts}</div>;
  }
  
  // Handle inline code only (no code blocks)
  return (
    <span 
      className="question-text"
      dangerouslySetInnerHTML={{
        __html: children.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      }}
    />
  );
};

// Fullscreen utilities
const enterFullscreen = () => {
  try {
    const element = document.documentElement;
    
    // Check if already in fullscreen
    const isInFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    );
    
    if (isInFullscreen) {
      // Already in fullscreen, no need to enter
      return;
    }
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      (element as any).webkitRequestFullscreen();
    } else if ((element as any).msRequestFullscreen) {
      (element as any).msRequestFullscreen();
    }
  } catch (error) {
    // Silently handle any fullscreen entry errors
    console.warn('Failed to enter fullscreen:', error);
  }
};

const exitFullscreen = () => {
  // Check if document is actually in fullscreen before attempting to exit
  const isInFullscreen = !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );
  
  if (!isInFullscreen) {
    // Document is not in fullscreen, no need to exit
    return;
  }
  
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  } catch (error) {
    // Silently handle any fullscreen exit errors
    console.warn('Failed to exit fullscreen:', error);
  }
};

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
  
  // Timer and quiz attempt state
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Fullscreen change detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // If user exits fullscreen during quiz, end the quiz
      if (!isCurrentlyFullscreen && isQuizStarted && !score) {
        const shouldEndQuiz = window.confirm(
          'You have exited fullscreen mode. For security reasons, the quiz will now be submitted automatically. Click OK to continue.'
        );
        if (shouldEndQuiz) {
          handleSubmitQuiz(true);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [isQuizStarted, score]);

  // Prevent quiz exit during active quiz
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isQuizStarted && !score) {
        e.preventDefault();
        e.returnValue = 'You have an active quiz. Are you sure you want to leave? Your progress will be lost.';
        return e.returnValue;
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (isQuizStarted && !score) {
        const confirmed = window.confirm('You have an active quiz. Are you sure you want to leave? Your progress will be lost.');
        if (!confirmed) {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    if (isQuizStarted && !score) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      
      // Prevent back button
      window.history.pushState(null, '', window.location.href);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isQuizStarted, score]);

  // Timer completion handler
  const handleTimeUp = useCallback(async () => {
    if (!isSubmitting && isQuizStarted) {
      await handleSubmitQuiz(true); // Pass true to indicate auto-submission
    }
  }, [isSubmitting, isQuizStarted]);

  useEffect(() => {
    async function fetchQuizData() {
      if (!user) return;

      try {
        // Fetch quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) {
          throw quizError;
        }
        
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
          throw questionsError;
        }
        
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
            // Non-critical error, continue without options
          } else if (optionsData) {
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
          setEligibilityTier(getEligibilityTier(attemptData.score, quizData?.tier_thresholds));
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

  // Start quiz function
  const startQuiz = async () => {
    if (!user || !quiz) return;
    
    try {
      // Enter fullscreen mode
      enterFullscreen();
      
      const startTime = new Date();
      setQuizStartTime(startTime);
      setIsQuizStarted(true);
      
      // Create quiz attempt record
      const { data: attemptData, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          user_id: user.id,
          started_at: startTime.toISOString(),
          is_completed: false
        })
        .select()
        .single();
        
      if (attemptError) {
        throw attemptError;
      }
      
      setAttemptId(attemptData.id);
    } catch (err) {
      setError(formatErrorMessage(err));
    }
  };

  async function handleSubmitQuiz(autoSubmit: boolean = false) {
    if (!user || !quiz) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const allQuestionsAnswered = questions.every(q => answers[q.id]);
      
      if (!autoSubmit && !allQuestionsAnswered) {
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
      
      // Calculate the final tier using custom thresholds if available
      const tier = getEligibilityTier(finalScore, quiz?.tier_thresholds);
      
      const endTime = new Date();
      const timeTakenSeconds = quizStartTime ? Math.round((endTime.getTime() - quizStartTime.getTime()) / 1000) : null;
      
      // Update the existing attempt or create new one
      const attemptData = {
        quiz_id: quizId,
        user_id: user.id,
        score: finalScore,
        max_score: totalPoints,
        is_completed: true,
        completed_at: endTime.toISOString(),
        time_taken_seconds: timeTakenSeconds,
        answers: JSON.stringify(answers)
      };
      
      let resultData;
      if (attemptId) {
        // Update existing attempt
        const { data, error } = await supabase
          .from('quiz_attempts')
          .update(attemptData)
          .eq('id', attemptId)
          .select()
          .single();
          
        if (error) throw error;
        resultData = data;
      } else {
        // Create new attempt (fallback)
        const { data, error } = await supabase
          .from('quiz_attempts')
          .insert(attemptData)
          .select()
          .single();
          
        if (error) throw error;
        resultData = data;
      }
      
      setResultId(resultData.id);
      setScore(finalScore);
      setEligibilityTier(tier);
      setIsQuizStarted(false); // Allow navigation again
      
      // Exit fullscreen when quiz is completed (with small delay to ensure state updates)
      setTimeout(() => {
        exitFullscreen();
      }, 100);
      
      if (autoSubmit) {
        setSuccess('Time\'s up! Quiz has been automatically submitted.');
      } else {
        setSuccess('Quiz completed successfully!');
      }
      
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
      {/* Quiz Timer - only show when quiz has time limit and is started */}
      {quiz?.time_limit_minutes && isQuizStarted && !score && (
        <QuizTimer
          timeLimitMinutes={quiz.time_limit_minutes}
          onTimeUp={handleTimeUp}
          isActive={true}
        />
      )}
      
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
          {!isQuizStarted || score !== null ? (
            <Button
              variant="outline"
              onClick={() => router.push('/user/dashboard')}
            >
              {score !== null ? 'Back to Dashboard' : 'Exit'}
            </Button>
          ) : (
            <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">Quiz in progress - Exit blocked</span>
            </div>
          )}
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
        ) : !isQuizStarted && score === null ? (
          // Quiz start screen
          <div className="bg-white shadow rounded-lg p-8 border border-gray-200 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
              {quiz.description && (
                <p className="text-gray-600 mb-4">{quiz.description}</p>
              )}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-blue-700 font-medium">{questions.length} Questions</span>
                  </div>
                  {quiz.time_limit_minutes && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-blue-700 font-medium">{quiz.time_limit_minutes} Minutes</span>
                    </div>
                  )}
                  {!quiz.time_limit_minutes && (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-700 font-medium">No Time Limit</span>
                    </div>
                  )}
                </div>
              </div>
              {quiz.time_limit_minutes && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-6">
                  <p className="text-amber-800 text-sm">
                    ⚠️ <strong>Important:</strong> Once you start, you cannot exit the quiz until completion or time expires.
                  </p>
                </div>
              )}
            </div>
            <Button
              onClick={startQuiz}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              🚀 Start Quiz
            </Button>
          </div>
        ) : (
          // Quiz questions interface
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <div className="flex justify-between mb-4">
              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
            
            <h2 className="text-xl font-medium text-gray-900 mb-6">
              <CodeBlock>{currentQuestion.question}</CodeBlock>
            </h2>
            
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
                      className="ml-3 block text-gray-700 cursor-pointer p-2 rounded hover:bg-gray-50"
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
                  onClick={() => handleSubmitQuiz()}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
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