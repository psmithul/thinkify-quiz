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
  youtube_url: string;
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
    youtube_url: '',
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
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex justify-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="loading-spinner h-16 w-16 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (!user || (!isCreator && !isAdmin)) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex justify-center items-center">
          <div className="card p-8 max-w-2xl mx-auto text-center">
            <div className="text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You need to be a creator to create courses.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/make-me-creator')} className="btn-primary">
                Become a Creator
              </Button>
              <Button onClick={() => router.push('/')} className="btn-outline">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        <div className="container-max py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-8 text-white shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Create New Course 📚</h1>
                  <p className="text-purple-100 text-xl">Create engaging educational content for your students</p>
                </div>
                <Button
                  onClick={() => router.push('/creator/dashboard')}
                  className="btn-outline border-white text-white hover:bg-white hover:text-purple-600"
                  size="lg"
                >
                  ← Back to Dashboard
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto"
          >
            <div className="form-container">
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Basic Information</h2>
                  </div>
                  
                  <div className="form-group">
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

                  <div className="form-group">
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

                  <div className="form-group">
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">⚙️</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Course Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
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

                    <div className="form-group">
                      <label htmlFor="youtube_url" className="form-label">
                        YouTube Video URL
                      </label>
                      <input
                        type="url"
                        id="youtube_url"
                        value={formData.youtube_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, youtube_url: e.target.value }))}
                        className="form-input"
                        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                      />
                    </div>

                    <div className="form-group">
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

                    <div className="form-group">
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

                    <div className="form-group md:col-span-2">
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🏷️</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Tags</h2>
                  </div>
                  
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
                      className="btn-secondary"
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚀</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900">Publishing Options</h2>
                  </div>
                  
                  <div className="card p-6 bg-gray-50">
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_published}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                          className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                          className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
                    className="flex-1 btn-primary"
                    isLoading={isLoading}
                  >
                    {isLoading ? 'Creating Course...' : '📚 Create Course'}
                  </Button>
                  <Button
                    type="button"
                    className="btn-outline"
                    size="lg"
                    onClick={() => router.push('/creator/dashboard')}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>

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
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 