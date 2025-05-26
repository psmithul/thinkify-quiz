'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase, Quiz, Course, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion } from 'framer-motion';

type ContentWithCreator = (Quiz | Course) & {
  creator?: User;
  type: 'quiz' | 'course';
};

export default function BrowsePage() {
  const router = useRouter();
  const [allContent, setAllContent] = useState<ContentWithCreator[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'all', 'general', 'technology', 'business', 'design', 'marketing', 
    'programming', 'data-science', 'health', 'language', 'arts'
  ];

  useEffect(() => {
    async function fetchContent() {
      try {
        // Fetch published quizzes with creators
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select(`
            *,
            creator:users(*)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (quizzesError && quizzesError.code !== 'PGRST116') {
          console.error('Error fetching quizzes:', quizzesError);
        }

        // Fetch published courses with creators
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            creator:users(*)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (coursesError && coursesError.code !== 'PGRST116') {
          console.error('Error fetching courses:', coursesError);
        }

        // Combine and format content
        const formattedQuizzes: ContentWithCreator[] = (quizzes || []).map(quiz => ({
          ...quiz,
          type: 'quiz' as const,
          category: 'general' // Quizzes don't have categories, so default to general
        }));

        const formattedCourses: ContentWithCreator[] = (courses || []).map(course => ({
          ...course,
          type: 'course' as const
        }));

        const combined = [...formattedQuizzes, ...formattedCourses];
        setAllContent(combined);
        setFilteredContent(combined);
      } catch (err) {
        setError(formatErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, []);

  useEffect(() => {
    let filtered = allContent;

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        (item as any).category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContent(filtered);
  }, [allContent, selectedCategory, selectedType, searchTerm]);

  const handleItemClick = (item: ContentWithCreator) => {
    if (item.type === 'quiz') {
      router.push(`/quiz/${item.id}`);
    } else {
      router.push(`/course/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browse Learning Content 📚🧠
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover courses and quizzes from talented creators worldwide. 
              Learn new skills and test your knowledge across various topics.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {allContent.filter(item => item.type === 'quiz').length}
              </div>
              <div className="text-gray-600">Quizzes Available</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-green-600">
                {allContent.filter(item => item.type === 'course').length}
              </div>
              <div className="text-gray-600">Courses Available</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {new Set(allContent.map(item => (item as any).creator?.id)).size}
              </div>
              <div className="text-gray-600">Expert Creators</div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Content
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search courses and quizzes..."
                />
              </div>

              {/* Content Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Content</option>
                  <option value="course">📚 Courses Only</option>
                  <option value="quiz">🧠 Quizzes Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedType !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {selectedType === 'quiz' ? '🧠 Quizzes' : '📚 Courses'}
                  <button
                    onClick={() => setSelectedType('all')}
                    className="ml-2 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1).replace('-', ' ')}
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="ml-2 hover:text-green-600"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                  "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 hover:text-purple-600"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </motion.div>

          {/* Content Grid */}
          {error && (
            <div className="bg-red-50 p-4 rounded-md mb-8">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {filteredContent.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Content Found</h3>
              <p className="text-gray-500">
                Try adjusting your filters or search terms to find more content.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredContent.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  {/* Thumbnail/Header */}
                  <div className={`h-48 relative overflow-hidden ${
                    item.type === 'quiz' 
                      ? 'bg-gradient-to-r from-purple-400 to-indigo-500' 
                      : 'bg-gradient-to-r from-green-400 to-teal-500'
                  }`}>
                    {item.type === 'course' && (item as any).thumbnail_url ? (
                      <img 
                        src={(item as any).thumbnail_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-6xl">
                          {item.type === 'quiz' ? '🧠' : '📚'}
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute top-4 right-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        item.type === 'quiz'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type === 'quiz' ? 'Quiz' : 'Course'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {item.description || 'No description available'}
                    </p>

                    {/* Creator Info */}
                    {(item as any).creator && (
                      <div className="flex items-center mb-4">
                        <div className="h-8 w-8 rounded-full overflow-hidden mr-3 bg-gray-100">
                          {(item as any).creator.profile_image ? (
                            <img 
                              src={(item as any).creator.profile_image} 
                              alt={(item as any).creator.full_name || 'Creator'} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-600 text-xs font-bold">
                              {((item as any).creator.full_name || (item as any).creator.email || 'C').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {(item as any).creator.full_name || (item as any).creator.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {item.type === 'course' && (item as any).duration_minutes 
                          ? `${(item as any).duration_minutes}min`
                          : 'Interactive'
                        }
                      </span>
                      <span className="font-semibold text-blue-600">
                        {item.type === 'quiz' ? 'Quiz' : 'Course'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Bottom CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
          >
            <h2 className="text-2xl font-bold mb-4">Ready to Share Your Knowledge?</h2>
            <p className="text-blue-100 mb-6">
              Join our community of creators and start building courses and quizzes today.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/make-me-creator')}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Become a Creator
              </Button>
              <Button
                onClick={() => router.push('/creators')}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                View All Creators
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 