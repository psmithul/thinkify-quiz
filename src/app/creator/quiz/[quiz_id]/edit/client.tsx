'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase, Quiz } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';

// Define types for quiz questions
interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: 'multiple_choice' | 'text';
  points: number;
  position: number;
  created_at: string;
  updated_at: string;
}

interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
}

type QuizWithQuestions = Quiz & {
  questions: QuizQuestion[];
  options?: QuizOption[];
};

export function QuizEditor({ quizId }: { quizId: string }) {
  const router = useRouter();
  const { user, userData, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [isPublished, setIsPublished] = useState(false);
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'text'>('multiple_choice');
  const [options, setOptions] = useState<{text: string, isCorrect: boolean}[]>([
    {text: '', isCorrect: false},
    {text: '', isCorrect: false},
    {text: '', isCorrect: false},
    {text: '', isCorrect: false}
  ]);
  const [points, setPoints] = useState(1);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    
    if (!authLoading && user && !isCreator && !isAdmin) {
      router.push('/user/dashboard');
      return;
    }
  }, [authLoading, user, isCreator, isAdmin, router]);

  useEffect(() => {
    async function fetchQuizData() {
      if (!user) return;

      try {
        console.log('Fetching quiz data for ID:', quizId);
        
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
        
        // Check if quiz belongs to current creator
        if (quizData.creator_id !== user.id && !isAdmin) {
          console.log('Quiz does not belong to current user');
          router.push('/creator/dashboard');
          return;
        }
        
        // Fetch questions
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
        
        // Fetch options for multiple-choice questions
        let optionsData: QuizOption[] = [];
        if (questionsData && questionsData.length > 0) {
          const questionIds = questionsData.map(q => q.id);
          const { data: options, error: optionsError } = await supabase
            .from('quiz_options')
            .select('*')
            .in('question_id', questionIds)
            .order('position');
            
          if (optionsError) {
            console.error('Error fetching options:', optionsError);
          } else {
            optionsData = options || [];
            console.log('Options loaded:', optionsData.length);
          }
        }
        
        // Set quiz data
        setQuiz({
          ...quizData,
          questions: questionsData || [],
          options: optionsData
        });
        
        setTitle(quizData.title || '');
        setDescription(quizData.description || '');
        setPrice(quizData.price ? quizData.price.toString() : '0');
        setIsPublished(quizData.is_published || false);
        setQuestions(questionsData || []);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    if (user && quizId) {
      fetchQuizData();
    }
  }, [user, quizId, router, isAdmin]);

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate inputs
      if (!title.trim()) {
        throw new Error('Quiz title is required');
      }
      
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue < 0) {
        throw new Error('Price must be a valid non-negative number');
      }
      
      // Update quiz
      const { error } = await supabase
        .from('quizzes')
        .update({
          title,
          description,
          price: priceValue === 0 ? null : priceValue,
          is_published: isPublished,
          updated_at: new Date().toISOString()
        })
        .eq('id', quizId);
        
      if (error) throw error;
      
      setSuccess('Quiz updated successfully!');
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = () => {
    setCurrentQuestion(null);
    setQuestionText('');
    setQuestionType('multiple_choice');
    setOptions([
      {text: '', isCorrect: false},
      {text: '', isCorrect: false},
      {text: '', isCorrect: false},
      {text: '', isCorrect: false}
    ]);
    setPoints(1);
    setIsAddingQuestion(true);
    setIsEditingQuestion(false);
  };

  const handleEditQuestion = async (question: QuizQuestion) => {
    setCurrentQuestion(question);
    setQuestionText(question.question || '');
    setQuestionType(question.question_type || 'multiple_choice');
    setPoints(question.points || 1);
    
    // Fetch options for this question
    if (question.question_type === 'multiple_choice') {
      try {
        const { data, error } = await supabase
          .from('quiz_options')
          .select('*')
          .eq('question_id', question.id)
          .order('position');
          
        if (error) throw error;
        
        // Convert to options format
        if (data && data.length > 0) {
          setOptions(data.map(option => ({
            text: option.option_text,
            isCorrect: option.is_correct
          })));
        } else {
          // Default options if none found
          setOptions([
            {text: '', isCorrect: false},
            {text: '', isCorrect: false},
            {text: '', isCorrect: false},
            {text: '', isCorrect: false}
          ]);
        }
      } catch (err) {
        console.error('Error fetching options:', err);
        setError(formatErrorMessage(err));
      }
    }
    
    setIsAddingQuestion(false);
    setIsEditingQuestion(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions(currentOptions => {
      const newOptions = [...currentOptions];
      newOptions[index] = { ...newOptions[index], text: value };
      return newOptions;
    });
  };

  const handleOptionCorrectChange = (index: number) => {
    setOptions(currentOptions => {
      // For multiple choice, only one option can be correct
      return currentOptions.map((option, i) => ({
        ...option,
        isCorrect: i === index
      }));
    });
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate question
      if (!questionText.trim()) {
        throw new Error('Question text is required');
      }
      
      if (questionType === 'multiple_choice') {
        // Check if at least 2 options are provided
        const filledOptions = options.filter(opt => opt.text.trim());
        if (filledOptions.length < 2) {
          throw new Error('At least 2 options are required for multiple choice questions');
        }
        
        // Check if at least one option is marked as correct
        if (!options.some(opt => opt.isCorrect)) {
          throw new Error('Please mark at least one option as correct');
        }
      }
      
      // Determine position for new question
      const position = currentQuestion?.position || (questions.length > 0 ? Math.max(...questions.map(q => q.position)) + 1 : 1);
      
      // Prepare question data
      const questionData = {
        question: questionText,
        question_type: questionType,
        points: points,
        position: position,
        quiz_id: quizId,
        updated_at: new Date().toISOString()
      };
      
      let questionId;
      
      if (isAddingQuestion) {
        // Insert new question
        const { data, error } = await supabase
          .from('quiz_questions')
          .insert({
            ...questionData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;
        questionId = data.id;
        
        // Add to questions list
        const newQuestion = {
          ...data,
          options: []
        };
        setQuestions([...questions, newQuestion]);
        setSuccess('Question added successfully!');
      } else if (isEditingQuestion && currentQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('quiz_questions')
          .update(questionData)
          .eq('id', currentQuestion.id);
          
        if (error) throw error;
        questionId = currentQuestion.id;
        
        // Update questions list
        setQuestions(questions.map(q => 
          q.id === currentQuestion.id ? { ...q, ...questionData } : q
        ));
        setSuccess('Question updated successfully!');
      }
      
      // Handle options for multiple choice
      if (questionType === 'multiple_choice' && questionId) {
        // First delete existing options for this question
        if (isEditingQuestion) {
          const { error: deleteError } = await supabase
            .from('quiz_options')
            .delete()
            .eq('question_id', questionId);
            
          if (deleteError) throw deleteError;
        }
        
        // Insert new options
        const validOptions = options.filter(opt => opt.text.trim());
        if (validOptions.length > 0) {
          const optionsToInsert = validOptions.map((opt, index) => ({
            question_id: questionId,
            option_text: opt.text,
            is_correct: opt.isCorrect,
            position: index + 1
          }));
          
          const { error: insertError } = await supabase
            .from('quiz_options')
            .insert(optionsToInsert);
            
          if (insertError) throw insertError;
        }
      }
      
      // Reset form
      setIsAddingQuestion(false);
      setIsEditingQuestion(false);
      setCurrentQuestion(null);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete question (options will be cascade deleted due to foreign key constraint)
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
        
      if (error) throw error;
      
      // Update questions list
      setQuestions(questions.filter(q => q.id !== questionId));
      setSuccess('Question deleted successfully!');
    } catch (err) {
      setError(formatErrorMessage(err));
    }
  };

  const handleCancelQuestion = () => {
    setIsAddingQuestion(false);
    setIsEditingQuestion(false);
    setCurrentQuestion(null);
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

  if (!isCreator && !isAdmin) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
          <p className="text-red-600 mb-4">
            You don't have permission to edit quizzes. You need to have a creator account.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push('/user/dashboard')}
              variant="outline"
            >
              Go to User Dashboard
            </Button>
            <Button
              onClick={() => router.push('/make-me-creator')}
            >
              Become a Creator
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Edit Quiz</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push('/creator/dashboard')}
          >
            Back to Dashboard
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
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-medium text-gray-900 mb-4">Quiz Details</h2>
          <form onSubmit={handleSaveQuiz} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Quiz Title*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter a descriptive title for your quiz"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Provide a detailed description of what this quiz covers"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Price (USD)
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Leave as 0 to make the quiz free</p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_published"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="is_published" className="ml-2 block text-sm text-gray-700">
                Publish quiz (make it visible to users)
              </label>
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Quiz Details'}
              </Button>
            </div>
          </form>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-gray-900">Quiz Questions</h2>
            <Button 
              onClick={handleAddQuestion}
              disabled={isAddingQuestion || isEditingQuestion}
            >
              Add Question
            </Button>
          </div>
          
          {isAddingQuestion || isEditingQuestion ? (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isAddingQuestion ? 'Add New Question' : 'Edit Question'}
              </h3>
              <form onSubmit={handleSaveQuestion} className="space-y-6">
                <div>
                  <label htmlFor="question_text" className="block text-sm font-medium text-gray-700">
                    Question*
                  </label>
                  <textarea
                    id="question_text"
                    rows={3}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter your question"
                    required
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="question_type" className="block text-sm font-medium text-gray-700">
                    Question Type
                  </label>
                  <select
                    id="question_type"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as 'multiple_choice' | 'text')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="text">Text Answer</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="points" className="block text-sm font-medium text-gray-700">
                    Points
                  </label>
                  <input
                    type="number"
                    id="points"
                    min="1"
                    step="1"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value, 10) || 1)}
                    className="mt-1 block w-1/4 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                {questionType === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options (select one as correct)
                    </label>
                    <div className="space-y-3">
                      {options.map((option, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="radio"
                            id={`option_${index}_correct`}
                            name="correct_option"
                            checked={option.isCorrect}
                            onChange={() => handleOptionCorrectChange(index)}
                            className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          />
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Select the radio button next to the correct option.</p>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleCancelQuestion}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Question'}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}
          
          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No questions added yet. Click "Add Question" to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 mr-2">#{index + 1}</span>
                      <span className="text-gray-700">{question.question}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditQuestion(question)}
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Text Answer'}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2">
                      {question.points} point{question.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 