'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';
import { QuizTierSettings, TierThresholds } from '@/components/QuizTierSettings';

type QuizFormData = {
  title: string;
  description: string;
  category: string;
  is_published: boolean;
  time_limit_minutes: number | null;
  tier_thresholds?: TierThresholds;
  associated_companies?: string[];
};

type Company = {
  id: string;
  name: string;
  tier: number;
  industry: string;
};

export default function NewQuizPage() {
  const router = useRouter();
  const { user, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    category: '',
    is_published: false,
    time_limit_minutes: null,
    tier_thresholds: undefined,
    associated_companies: [],
  });

  // Load companies on component mount
  useEffect(() => {
    async function loadCompanies() {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id, name, tier, industry')
          .order('tier', { ascending: false })
          .order('name');
        
        if (error) throw error;
        setCompanies(data || []);
      } catch (err) {
        console.error('Error loading companies:', err);
        setError('Failed to load companies');
      } finally {
        setLoadingCompanies(false);
      }
    }

    loadCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (!isCreator && !isAdmin) {
        throw new Error('You must be a creator to create quizzes');
      }

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      if (!formData.category.trim()) {
        throw new Error('Category is required');
      }
      
      // Create the quiz with all settings
      const quizData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        is_published: formData.is_published,
        creator_id: user.id,
        time_limit_minutes: formData.time_limit_minutes || null,
        tier_thresholds: formData.tier_thresholds || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Creating quiz with data:', quizData);

      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert([quizData])
        .select()
        .single();

      if (quizError) {
        console.error('Quiz creation error:', quizError);
        throw quizError;
      }

      console.log('Quiz created successfully:', quiz.id);

      // Create company associations if any are selected
      if (formData.associated_companies && formData.associated_companies.length > 0) {
        try {
          const companyAssociations = formData.associated_companies.map(companyId => ({
            quiz_id: quiz.id,
            company_id: companyId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          console.log('Creating company associations:', companyAssociations);

          const { error: associationError } = await supabase
            .from('quiz_company_associations')
            .insert(companyAssociations);

          if (associationError) {
            console.error('Error creating company associations:', associationError);
            // Don't fail the entire creation, but show a warning
            setError(`Quiz created but company associations failed: ${associationError.message}`);
          } else {
            console.log('Company associations created successfully');
          }
        } catch (assocErr) {
          console.error('Company association error:', assocErr);
          // Don't fail if associations table doesn't exist
          console.warn('Company associations not created - table may not exist');
        }
      }

      // Redirect to quiz editing page
      router.push(`/creator/quiz/${quiz.id}/edit`);
    } catch (err) {
      console.error('Quiz creation error:', err);
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTierThresholdsSave = (thresholds: TierThresholds) => {
    setFormData(prev => ({ ...prev, tier_thresholds: thresholds }));
  };

  const handleCompanyToggle = (companyId: string) => {
    setFormData(prev => ({
      ...prev,
      associated_companies: prev.associated_companies?.includes(companyId)
        ? prev.associated_companies.filter(id => id !== companyId)
        : [...(prev.associated_companies || []), companyId]
    }));
  };

  if (authLoading) {
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
          <p className="text-red-600 mb-4">
            You don't have permission to create quizzes. You need to have a creator account.
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Quiz 🧠</h1>
                <p className="text-gray-600 mt-2">Create an engaging quiz to test knowledge and skills</p>
              </div>
              <Button
                onClick={() => router.push('/creator/dashboard')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 p-4 rounded-md border border-red-200"
                >
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your quiz title..."
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="Describe what this quiz is about..."
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Category *
                  </label>
                  <input
                    type="text"
                    id="category"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Expert, Beginner, Professional, Technical, etc."
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Create a custom category that describes the skill level or topic area of this quiz.
                  </p>
                </div>

                <div>
                  <label htmlFor="time_limit" className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      id="time_limit"
                      min="1"
                      max="180"
                      value={formData.time_limit_minutes || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        time_limit_minutes: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                      className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      placeholder="30"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Leave empty for no time limit. Recommended: 10-30 minutes for most quizzes.
                  </p>
                </div>

                {/* Quiz Image Upload */}

              </div>

              {/* Tier Settings */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  🎯 Tier Passing Settings
                  <span className="ml-2 text-sm font-normal text-gray-600">(Optional)</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set custom score thresholds for different achievement tiers. If not set, default tiers will be used.
                </p>
                <QuizTierSettings
                  initialThresholds={formData.tier_thresholds}
                  onSave={handleTierThresholdsSave}
                  className="bg-white rounded-lg border border-gray-200"
                />
              </div>

              {/* Company Associations */}
              <div className="space-y-4 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  🏢 Company Associations
                  <span className="ml-2 text-sm font-normal text-gray-600">(Optional)</span>
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Associate this quiz with companies. This helps categorize quizzes by industry and tier level.
                </p>
                
                {loadingCompanies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading companies...</span>
                  </div>
                ) : companies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No companies available for association.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                      {companies.map((company) => (
                        <label
                          key={company.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.associated_companies?.includes(company.id) || false}
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
                    {formData.associated_companies && formData.associated_companies.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Selected: {formData.associated_companies.length} compan{formData.associated_companies.length === 1 ? 'y' : 'ies'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Publishing Options */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900">Publishing Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Publish immediately</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim() || !formData.category.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating Quiz...
                    </>
                  ) : (
                    '🧠 Create Quiz'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/creator/dashboard')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-purple-50 rounded-xl border border-purple-200 p-6"
          >
            <h3 className="text-lg font-semibold text-purple-900 mb-3">💡 Quiz Creation Tips</h3>
            <ul className="text-sm text-purple-700 space-y-2">
              <li>• Choose a clear, descriptive title that tells users what they'll be tested on</li>
              <li>• Write a compelling description that explains the quiz purpose and difficulty</li>
              <li>• Start with a draft to test your questions before publishing to users</li>
              <li>• You can always edit questions and settings after creating the quiz</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 