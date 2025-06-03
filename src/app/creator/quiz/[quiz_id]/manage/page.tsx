'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';
import { QuizTierSettings, TierThresholds } from '@/components/QuizTierSettings';

type Quiz = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_published: boolean;
  time_limit_minutes: number | null;
  tier_thresholds: TierThresholds | null;
  creator_id: string;
};

type Company = {
  id: string;
  name: string;
  tier: number;
  industry: string;
};

export default function QuizManagePage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quiz_id as string;
  const { user, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [associatedCompanies, setAssociatedCompanies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load quiz and company data
  useEffect(() => {
    async function loadData() {
      if (!user || (!isCreator && !isAdmin)) return;

      try {
        setIsLoading(true);

        // Load quiz details
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (quizError) throw quizError;

        // Check if user owns this quiz or is admin
        if (quizData.creator_id !== user.id && !isAdmin) {
          throw new Error('You do not have permission to manage this quiz');
        }

        setQuiz(quizData);

        // Load all companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, tier, industry')
          .order('tier', { ascending: false })
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies(companiesData || []);

        // Load current associations
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
  }, [user, isCreator, isAdmin, quizId]);

  const handleTierThresholdsSave = async (thresholds: TierThresholds) => {
    if (!quiz) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('quizzes')
        .update({ tier_thresholds: thresholds })
        .eq('id', quizId);

      if (error) throw error;

      setQuiz(prev => prev ? { ...prev, tier_thresholds: thresholds } : null);
      setSuccessMessage('Tier thresholds updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

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

      // Remove all existing associations
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

  const handleUpdateBasicInfo = async (updatedData: Partial<Quiz>) => {
    if (!quiz) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('quizzes')
        .update(updatedData)
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

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (!user || (!isCreator && !isAdmin)) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h1>
          <p className="text-red-600">You don't have permission to manage quizzes.</p>
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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Quiz Settings 🛠️</h1>
                <p className="text-gray-600 mt-2">{quiz.title}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => router.push(`/creator/quiz/${quizId}/edit`)}
                  variant="outline"
                >
                  Edit Questions
                </Button>
                <Button
                  onClick={() => router.push('/creator/dashboard')}
                  variant="outline"
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Status Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-red-50 p-4 rounded-md border border-red-200"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 bg-green-50 p-4 rounded-md border border-green-200"
            >
              <p className="text-sm text-green-600">{successMessage}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">📝 Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) => setQuiz(prev => prev ? { ...prev, title: e.target.value } : null)}
                    onBlur={() => handleUpdateBasicInfo({ title: quiz.title })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Technical, Professional, Expert"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={quiz.time_limit_minutes || ''}
                      onChange={(e) => setQuiz(prev => prev ? { 
                        ...prev, 
                        time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                      } : null)}
                      onBlur={() => handleUpdateBasicInfo({ time_limit_minutes: quiz.time_limit_minutes })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="1"
                      max="300"
                      placeholder="30"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for no time limit
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={quiz.is_published}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setQuiz(prev => prev ? { ...prev, is_published: newValue } : null);
                        handleUpdateBasicInfo({ is_published: newValue });
                      }}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      Published
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500 ml-6">
                    {quiz.is_published ? 'Quiz is visible to users' : 'Quiz is hidden from users'}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Tier Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Tier Passing Settings</h2>
              <QuizTierSettings
                initialThresholds={quiz.tier_thresholds || undefined}
                onSave={handleTierThresholdsSave}
                className="border-0 shadow-none p-0"
              />
            </motion.div>
          </div>

          {/* Company Associations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">🏢 Company Associations</h2>
              <Button
                onClick={handleSaveCompanyAssociations}
                disabled={isSaving}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            
            {companies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No companies available for association.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {companies.map((company) => (
                  <label
                    key={company.id}
                    className="flex items-start space-x-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={associatedCompanies.includes(company.id)}
                      onChange={() => handleCompanyToggle(company.id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
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
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Selected: {associatedCompanies.length} compan{associatedCompanies.length === 1 ? 'y' : 'ies'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Quiz takers will only see these companies in their results.
                </p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex gap-4 justify-center"
          >
            <Button
              onClick={() => router.push(`/creator/quiz/${quizId}/edit`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              📝 Edit Questions
            </Button>
            <Button
              onClick={() => router.push(`/user/quiz/${quizId}`)}
              variant="outline"
            >
              👀 Preview Quiz
            </Button>
            <Button
              onClick={() => router.push(`/creator/quiz/${quizId}/analytics`)}
              variant="outline"
            >
              📊 View Analytics
            </Button>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 