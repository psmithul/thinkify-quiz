'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion, AnimatePresence } from 'framer-motion';
import { QuizTierSettings, TierThresholds } from '@/components/QuizTierSettings';
import { StudentResultsTab } from '@/components/StudentResultsTab';
import { QuestionAnalytics } from '@/components/QuestionAnalytics';

// Define types
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

type Quiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_published: boolean;
  time_limit_minutes: number | null;
  tier_thresholds: TierThresholds | null;
  creator_id: string;
  price?: number;
};

type Company = {
  id: string;
  name: string;
  tier: number;
  industry: string;
};

type TabType = 'settings' | 'questions' | 'students' | 'analytics';

export function QuizEditor({ quizId }: { quizId: string }) {
  const router = useRouter();
  const { user, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  
  // State management
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [associatedCompanies, setAssociatedCompanies] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Question form state
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'text'>('multiple_choice');
  const [options, setOptions] = useState<{text: string, isCorrect: boolean}[]>([
    {text: '', isCorrect: false},
    {text: '', isCorrect: false},
    {text: '', isCorrect: false},
    {text: '', isCorrect: false}
  ]);
  const [points, setPoints] = useState(1);

  // Permission check
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

  // Load quiz data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        setIsLoading(true);

        // Load quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;

        // Check permissions
        if (quizData.creator_id !== user.id && !isAdmin) {
          throw new Error('You do not have permission to edit this quiz');
        }

        setQuiz(quizData);

        // Load questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('position');

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);

        // Load companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, tier, industry')
          .order('tier', { ascending: false })
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

        // Load company associations
        const { data: associations, error: associationsError } = await supabase
          .from('quiz_company_associations')
          .select('company_id')
          .eq('quiz_id', quizId);

        if (associationsError) throw associationsError;
        setAssociatedCompanies(associations?.map(a => a.company_id) || []);

      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [user, quizId, isAdmin]);

  // Save basic quiz info
  const handleUpdateBasicInfo = async (updatedData: Partial<Quiz>) => {
    if (!quiz) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('quizzes')
        .update({ ...updatedData, updated_at: new Date().toISOString() })
        .eq('id', quizId);

      if (error) throw error;

      setQuiz(prev => prev ? { ...prev, ...updatedData } : null);
      setSuccessMessage('Quiz information updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Save tier thresholds
  const handleTierThresholdsSave = async (thresholds: TierThresholds) => {
    await handleUpdateBasicInfo({ tier_thresholds: thresholds });
  };

  // Company association management
  const handleCompanyToggle = (companyId: string) => {
    setAssociatedCompanies(prev => 
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSaveCompanyAssociations = async () => {
    try {
      setIsSaving(true);
      setError(null);

      // Remove existing associations
      const { error: deleteError } = await supabase
        .from('quiz_company_associations')
        .delete()
        .eq('quiz_id', quizId);

      if (deleteError) throw deleteError;

      // Add new associations
      if (associatedCompanies.length > 0) {
        const newAssociations = associatedCompanies.map(companyId => ({
          quiz_id: quizId,
          company_id: companyId,
        }));

        const { error: insertError } = await supabase
          .from('quiz_company_associations')
          .insert(newAssociations);

        if (insertError) throw insertError;
      }

      setSuccessMessage('Company associations updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Question management
  const handleAddQuestion = async () => {
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }

    if (questionType === 'multiple_choice') {
      const filledOptions = options.filter(opt => opt.text.trim());
      if (filledOptions.length < 2) {
        setError('At least 2 options are required for multiple choice questions');
        return;
      }
      if (!filledOptions.some(opt => opt.isCorrect)) {
        setError('At least one option must be marked as correct');
        return;
      }
    }

    try {
      setIsSaving(true);
      setError(null);

      // Add question
      const { data: newQuestion, error: questionError } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question: questionText,
          question_type: questionType,
          points: points,
          position: questions.length
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Add options for multiple choice
      if (questionType === 'multiple_choice') {
        const validOptions = options
          .filter(opt => opt.text.trim())
          .map((opt, index) => ({
            question_id: newQuestion.id,
            option_text: opt.text.trim(),
            is_correct: opt.isCorrect,
            position: index
          }));

        const { error: optionsError } = await supabase
          .from('quiz_options')
          .insert(validOptions);

        if (optionsError) throw optionsError;
      }

      setQuestions(prev => [...prev, newQuestion]);
      
      // Reset form
      setQuestionText('');
      setOptions([
        {text: '', isCorrect: false},
        {text: '', isCorrect: false},
        {text: '', isCorrect: false},
        {text: '', isCorrect: false}
      ]);
      setPoints(1);
      setIsAddingQuestion(false);
      
      setSuccessMessage('Question added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      setIsSaving(true);
      
      // Delete options first
      await supabase
        .from('quiz_options')
        .delete()
        .eq('question_id', questionId);

      // Delete question
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== questionId));
      setSuccessMessage('Question deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
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

  if (!quiz) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Quiz Not Found</h1>
          <p className="text-red-600">{error || 'The requested quiz could not be found.'}</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'settings', label: 'Quiz Settings', icon: '⚙️' },
    { id: 'questions', label: 'Questions', icon: '❓', count: questions.length },
    { id: 'students', label: 'Student Results', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                  🧠 {quiz.title}
                </h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                  Edit quiz settings, questions, and view student progress
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3 flex-wrap">
                <Button
                  onClick={() => router.push(`/user/quiz/${quizId}`)}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                >
                  👀 Preview
                </Button>
                <Button
                  onClick={() => router.push('/creator/dashboard')}
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-initial"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Status Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200"
              >
                <p className="text-sm text-green-600">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs Navigation */}
          <div className="mb-6 sm:mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    📋 Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quiz Title
                      </label>
                      <input
                        type="text"
                        value={quiz.title || ''}
                        onChange={(e) => setQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
                        onBlur={() => handleUpdateBasicInfo({ title: quiz.title })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                        placeholder="Enter quiz title..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={quiz.description || ''}
                        onChange={(e) => setQuiz(prev => prev ? { ...prev, description: e.target.value } : null)}
                        onBlur={() => handleUpdateBasicInfo({ description: quiz.description })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                        rows={3}
                        placeholder="Describe what this quiz is about..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        value={quiz.category || ''}
                        onChange={(e) => setQuiz(prev => prev ? { ...prev, category: e.target.value } : null)}
                        onBlur={() => handleUpdateBasicInfo({ category: quiz.category })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                        placeholder="e.g., Expert, Beginner, Technical..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Limit (Optional)
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={quiz.time_limit_minutes || ''}
                          onChange={(e) => setQuiz(prev => prev ? { ...prev, time_limit_minutes: e.target.value ? parseInt(e.target.value) : null } : null)}
                          onBlur={() => handleUpdateBasicInfo({ time_limit_minutes: quiz.time_limit_minutes })}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                          placeholder="30"
                        />
                        <span className="text-sm text-gray-500">minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Publication Status
                        </label>
                        <p className="text-xs text-gray-500">Make quiz visible to users</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={quiz.is_published}
                          onChange={(e) => {
                            const newStatus = e.target.checked;
                            setQuiz(prev => prev ? { ...prev, is_published: newStatus } : null);
                            handleUpdateBasicInfo({ is_published: newStatus });
                          }}
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${quiz.is_published ? 'bg-purple-600' : 'bg-gray-200'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${quiz.is_published ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Tier Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    🎯 Tier Thresholds
                  </h3>
                  <QuizTierSettings
                    initialThresholds={quiz.tier_thresholds || undefined}
                    onSave={handleTierThresholdsSave}
                    className="bg-gray-50 rounded-lg border border-gray-200"
                  />
                </div>

                {/* Company Associations */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center mb-2 sm:mb-0">
                      🏢 Company Associations
                    </h3>
                    <Button
                      onClick={handleSaveCompanyAssociations}
                      disabled={isSaving}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                  
                  {companies.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No companies available for association.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {companies.map((company) => (
                        <label
                          key={company.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={associatedCompanies.includes(company.id)}
                            onChange={() => handleCompanyToggle(company.id)}
                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {company.name}
                              </p>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium tier-${company.tier}`}>
                                Tier {company.tier}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">
                              {company.industry}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  {associatedCompanies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Selected: {associatedCompanies.length} compan{associatedCompanies.length === 1 ? 'y' : 'ies'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions Tab */}
            {activeTab === 'questions' && (
              <div className="space-y-6">
                {/* Add Question Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 flex items-center mb-2 sm:mb-0">
                      ➕ Add New Question
                    </h3>
                    <Button
                      onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                      variant={isAddingQuestion ? "outline" : "primary"}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isAddingQuestion ? 'Cancel' : 'Add Question'}
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isAddingQuestion && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 pt-4 border-t border-gray-200"
                      >
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text
                          </label>
                          <textarea
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                            rows={3}
                            placeholder="Enter your question here..."
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Question Type
                            </label>
                            <select
                              value={questionType}
                              onChange={(e) => setQuestionType(e.target.value as 'multiple_choice' | 'text')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                            >
                              <option value="multiple_choice">Multiple Choice</option>
                              <option value="text">Text Answer</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Points
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={points}
                              onChange={(e) => setPoints(parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                              placeholder="1"
                            />
                          </div>
                        </div>

                        {questionType === 'multiple_choice' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Answer Options
                            </label>
                            <div className="space-y-2">
                              {options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-3">
                                  <input
                                    type="radio"
                                    name="correct_option"
                                    checked={option.isCorrect}
                                    onChange={() => {
                                      setOptions(prev => prev.map((opt, i) => ({
                                        ...opt,
                                        isCorrect: i === index
                                      })));
                                    }}
                                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                  />
                                  <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => {
                                      setOptions(prev => prev.map((opt, i) => 
                                        i === index ? { ...opt, text: e.target.value } : opt
                                      ));
                                    }}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 placeholder-gray-500"
                                    placeholder={`Option ${index + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Select the radio button next to the correct option
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                          <Button
                            onClick={handleAddQuestion}
                            disabled={isSaving || !questionText.trim()}
                            className="flex-1 sm:flex-initial"
                          >
                            {isSaving ? 'Adding...' : 'Add Question'}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsAddingQuestion(false);
                              setQuestionText('');
                              setOptions([
                                {text: '', isCorrect: false},
                                {text: '', isCorrect: false},
                                {text: '', isCorrect: false},
                                {text: '', isCorrect: false}
                              ]);
                              setPoints(1);
                            }}
                            variant="outline"
                            className="flex-1 sm:flex-initial"
                          >
                            Cancel
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Questions List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    ❓ Quiz Questions ({questions.length})
                  </h3>
                  
                  {questions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 text-6xl mb-4">❓</div>
                      <p className="text-gray-500 text-lg mb-2">No questions yet</p>
                      <p className="text-gray-400 text-sm">Click "Add Question" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {questions.map((question, index) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center mb-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-100 text-purple-800 text-xs font-bold rounded-full mr-3">
                                  {index + 1}
                                </span>
                                <div className="flex flex-wrap gap-2">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    question.question_type === 'multiple_choice' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {question.question_type === 'multiple_choice' ? 'Multiple Choice' : 'Text Answer'}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {question.points} point{question.points !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                              <p className="text-gray-800 font-medium break-words">{question.question}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                onClick={() => handleDeleteQuestion(question.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                                disabled={isSaving}
                              >
                                🗑️ Delete
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <StudentResultsTab quizId={quizId} />
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <QuestionAnalytics quizId={quizId} />
            )}

          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 