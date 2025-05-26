'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

type QuizFormData = {
  title: string;
  description: string;
  is_published: boolean;
  time_limit_minutes: number | null;
};

export default function NewQuizPage() {
  const router = useRouter();
  const { user, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<QuizFormData>({
    title: '',
    description: '',
    is_published: false,
    time_limit_minutes: null,
  });

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
      
      const { data, error } = await supabase
        .from('quizzes')
        .insert([
          {
            ...formData,
            creator_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/creator/quiz/${data.id}/edit`);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
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
                  disabled={isLoading || !formData.title.trim()}
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