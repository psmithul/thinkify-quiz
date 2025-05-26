'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

type CourseFormData = {
  title: string;
  description: string;
  content: string;
  thumbnail_url: string;
  duration_minutes: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  is_published: boolean;
  is_featured: boolean;
};

export default function CreateCoursePage() {
  const router = useRouter();
  const { user, isCreator, isAdmin, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    content: '',
    thumbnail_url: '',
    duration_minutes: 60,
    level: 'beginner',
    category: 'general',
    tags: [],
    is_published: false,
    is_featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([
          {
            ...formData,
            creator_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      router.push(`/creator/course/${data.id}/edit`);
    } catch (err) {
      setError(formatErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      </Layout>
    );
  }

  if (!user || (!isCreator && !isAdmin)) {
    return (
      <Layout>
        <div className="card p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need to be a creator to create courses.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/make-me-creator')} variant="primary">
                Become a Creator
              </Button>
              <Button onClick={() => router.push('/')} variant="outline">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Course 📚</h1>
                <p className="text-xl text-gray-600">Create engaging educational content for your students</p>
              </div>
              <Button
                onClick={() => router.push('/creator/dashboard')}
                variant="outline"
                size="lg"
              >
                ← Back to Dashboard
              </Button>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="status-error"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-xl">❌</div>
                    <div>
                      <p className="font-semibold">Error Creating Course</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Basic Information Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  📝 Basic Information
                </h2>
                
                <div>
                  <label htmlFor="title" className="form-label required">
                    Course Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="form-input"
                    placeholder="Enter an engaging course title..."
                  />
                </div>

                <div>
                  <label htmlFor="description" className="form-label">
                    Course Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="form-textarea"
                    placeholder="Describe what students will learn and achieve..."
                  />
                </div>

                <div>
                  <label htmlFor="content" className="form-label">
                    Course Content
                  </label>
                  <textarea
                    id="content"
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="form-textarea"
                    placeholder="Enter your course content using markdown formatting..."
                  />
                  <p className="text-sm text-gray-500 mt-2">💡 Tip: You can use Markdown formatting for rich text content</p>
                </div>
              </div>

              {/* Course Details Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  ⚙️ Course Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="thumbnail_url" className="form-label">
                      Thumbnail Image URL
                    </label>
                    <input
                      type="url"
                      id="thumbnail_url"
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                      className="form-input"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <label htmlFor="duration_minutes" className="form-label">
                      Estimated Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="duration_minutes"
                      min="1"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                      className="form-input"
                    />
                  </div>

                  <div>
                    <label htmlFor="level" className="form-label">
                      Difficulty Level
                    </label>
                    <select
                      id="level"
                      value={formData.level}
                      onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value as any }))}
                      className="form-select"
                    >
                      <option value="beginner">🟢 Beginner</option>
                      <option value="intermediate">🟡 Intermediate</option>
                      <option value="advanced">🔴 Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="category" className="form-label">
                      Category
                    </label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="form-select"
                    >
                      <option value="general">📋 General</option>
                      <option value="technology">💻 Technology</option>
                      <option value="business">💼 Business</option>
                      <option value="design">🎨 Design</option>
                      <option value="marketing">📈 Marketing</option>
                      <option value="programming">⌨️ Programming</option>
                      <option value="data-science">📊 Data Science</option>
                      <option value="health">🏥 Health</option>
                      <option value="language">🗣️ Language</option>
                      <option value="arts">🎭 Arts</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🏷️ Tags
                </h2>
                
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="form-input flex-1"
                    placeholder="Add tags to help students find your course..."
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="secondary"
                    disabled={!tagInput.trim()}
                  >
                    Add Tag
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full font-medium"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-green-600 hover:text-green-800 focus:outline-none"
                        aria-label={`Remove ${tag} tag`}
                      >
                        ✕
                      </button>
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Publishing Options Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  🚀 Publishing Options
                </h2>
                
                <div className="card p-6 bg-gray-50">
                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                        className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-900">📢 Publish immediately</span>
                        <p className="text-sm text-gray-600">Make this course available to students right away</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                        className="mt-1 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-900">⭐ Feature this course</span>
                        <p className="text-sm text-gray-600">Highlight this course in featured sections</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim()}
                  size="lg"
                  fullWidth
                  variant="primary"
                  isLoading={isLoading}
                >
                  {isLoading ? 'Creating Course...' : '📚 Create Course'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/creator/dashboard')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="card p-6 bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
              <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                💡 Course Creation Tips
              </h3>
              <ul className="text-green-800 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Choose a clear, descriptive title that tells students exactly what they'll learn</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Write a compelling description that explains the course value and outcomes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Use relevant tags to help students discover your course through search</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>Start with a draft to test your content before publishing to students</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>You can always edit and add lessons after creating the course</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 