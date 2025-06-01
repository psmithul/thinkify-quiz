'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase, Quiz, Course, User } from '@/lib/supabaseClient';
import { formatErrorMessage } from '@/utils/errorHandler';
import { motion, AnimatePresence } from 'framer-motion';

type QuizWithCreator = Quiz & {
  creator?: User;
  question_count?: number;
};

type CourseWithCreator = Course & {
  creator?: User;
  lesson_count?: number;
};

const categories = [
  { id: 'all', label: 'All', icon: '🌟', color: 'from-purple-500 to-pink-500' },
  { id: 'technology', label: 'Technology', icon: '💻', color: 'from-blue-500 to-cyan-500' },
  { id: 'science', label: 'Science', icon: '🔬', color: 'from-green-500 to-blue-500' },
  { id: 'business', label: 'Business', icon: '💼', color: 'from-orange-500 to-red-500' },
  { id: 'language', label: 'Language', icon: '🗣️', color: 'from-pink-500 to-purple-500' },
  { id: 'arts', label: 'Arts', icon: '🎨', color: 'from-indigo-500 to-purple-500' },
];

const sortOptions = [
  { id: 'newest', label: 'Newest First', icon: '🆕' },
  { id: 'oldest', label: 'Oldest First', icon: '📅' },
  { id: 'popular', label: 'Most Popular', icon: '🔥' },
  { id: 'alphabetical', label: 'A-Z', icon: '🔤' },
];

export default function BrowsePage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizWithCreator[]>([]);
  const [courses, setCourses] = useState<CourseWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'quizzes' | 'courses'>('quizzes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchContent() {
      try {
        // Fetch published quizzes with creator info and question count
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('quizzes')
          .select(`
            *,
            creator:users(*),
            questions:questions(count)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (!quizzesError && quizzesData) {
          const processedQuizzes = quizzesData.map(quiz => ({
            ...quiz,
            question_count: quiz.questions?.length || 0
          }));
          setQuizzes(processedQuizzes);
        }

        // Fetch published courses with creator info
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            creator:users(*)
          `)
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (!coursesError && coursesData) {
          setCourses(coursesData);
        }
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, []);

  const handleCourseClick = (course: CourseWithCreator) => {
    if (course.youtube_url) {
      window.open(course.youtube_url, '_blank');
    } else {
      router.push(`/course/${course.id}`);
    }
  };

  const filterContent = (items: any[]) => {
    let filtered = items;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.creator?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter (basic implementation - would need category field in database)
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => 
        item.description?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        item.title.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popular':
        // Would need view count or rating in database
        break;
    }

    return filtered;
  };

  const filteredQuizzes = filterContent(quizzes);
  const filteredCourses = filterContent(courses);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex justify-center items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-purple-300 border-t-transparent mx-auto animate-ping"></div>
            </div>
            <p className="text-slate-600 text-lg font-medium">Discovering amazing content...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-8 lg:p-12 shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-xl"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-300 rounded-full mix-blend-overlay filter blur-xl"></div>
                <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-pink-300 rounded-full mix-blend-overlay filter blur-xl"></div>
              </div>
              
              <div className="relative text-center text-white">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="text-6xl mb-6"
                >
                  🚀
                </motion.div>
                <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                  Explore & Learn
                </h1>
                <p className="text-blue-100 text-xl lg:text-2xl max-w-3xl mx-auto mb-8">
                  Discover curated quizzes and courses designed to accelerate your learning journey
                </p>
                
                {/* Quick Stats */}
                <div className="flex flex-wrap justify-center gap-6 text-sm lg:text-base">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="font-semibold">{quizzes.length}</span> Quizzes
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="font-semibold">{courses.length}</span> Courses
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <span className="font-semibold">Free</span> Access
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              {/* Search Bar */}
              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-xl">🔍</span>
                </div>
                <input
                  type="text"
                  placeholder="Search for anything..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-500"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.id
                          ? `bg-gradient-to-r ${category.color} text-white shadow-lg transform scale-105`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('quizzes')}
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === 'quizzes'
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🧠 Quizzes ({filteredQuizzes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === 'courses'
                        ? 'bg-white text-purple-600 shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📚 Courses ({filteredCourses.length})
                  </button>
                </div>

                {/* Sort and View Controls */}
                <div className="flex items-center gap-3">
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>

                  {/* View Mode Toggle */}
                  <div className="flex bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded text-sm ${
                        viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      <span className="text-lg">⊞</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded text-sm ${
                        viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      <span className="text-lg">☰</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'quizzes' && (
                <QuizGrid 
                  quizzes={filteredQuizzes} 
                  viewMode={viewMode} 
                  router={router}
                />
              )}
              {activeTab === 'courses' && (
                <CourseGrid 
                  courses={filteredCourses} 
                  viewMode={viewMode} 
                  handleCourseClick={handleCourseClick}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

// Quiz Grid Component
function QuizGrid({ 
  quizzes, 
  viewMode, 
  router 
}: { 
  quizzes: QuizWithCreator[]; 
  viewMode: 'grid' | 'list'; 
  router: any;
}) {
  if (quizzes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No quizzes found</h3>
        <p className="text-slate-500">Try adjusting your search or filters</p>
      </motion.div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {quizzes.map((quiz, index) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 10 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => router.push(`/user/quiz/${quiz.id}`)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">Q</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{quiz.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-1">{quiz.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>👤 {quiz.creator?.full_name || 'Unknown'}</span>
                    <span>❓ {quiz.question_count || 0} questions</span>
                    <span>📅 {new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {quizzes.map((quiz, index) => (
        <motion.div
          key={quiz.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
          onClick={() => router.push(`/user/quiz/${quiz.id}`)}
        >
          {/* Header */}
          <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">Quiz</span>
            </div>
            <div className="absolute bottom-4 left-4">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">🧠</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
              {quiz.title}
            </h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {quiz.description || 'Test your knowledge with this engaging quiz!'}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <span>❓</span>
                  {quiz.question_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span>⏱️</span>
                  ~{(quiz.question_count || 0) * 2}min
                </span>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 text-xs font-medium">
                    {quiz.creator?.full_name?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm text-slate-600">{quiz.creator?.full_name || 'Unknown'}</span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(quiz.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Course Grid Component
function CourseGrid({ 
  courses, 
  viewMode, 
  handleCourseClick 
}: { 
  courses: CourseWithCreator[]; 
  viewMode: 'grid' | 'list'; 
  handleCourseClick: (course: CourseWithCreator) => void;
}) {
  if (courses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">No courses found</h3>
        <p className="text-slate-500">Try adjusting your search or filters</p>
      </motion.div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {courses.map((course, index) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 10 }}
            className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => handleCourseClick(course)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📚</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">{course.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-1">{course.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>👤 {course.creator?.full_name || 'Unknown'}</span>
                    <span>📅 {new Date(course.created_at).toLocaleDateString()}</span>
                    {course.youtube_url && <span>🎥 Video Course</span>}
                  </div>
                </div>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
      {courses.map((course, index) => (
        <motion.div
          key={course.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="group bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer"
          onClick={() => handleCourseClick(course)}
        >
          {/* Header */}
          <div className="h-32 bg-gradient-to-r from-green-500 via-blue-500 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
              <span className="text-white text-sm font-medium">
                {course.youtube_url ? 'Video' : 'Course'}
              </span>
            </div>
            <div className="absolute bottom-4 left-4">
              <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-white text-2xl">📚</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
              {course.description || 'Comprehensive course to enhance your skills!'}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                {course.youtube_url && (
                  <span className="flex items-center gap-1">
                    <span>🎥</span>
                    Video
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span>📖</span>
                  Course
                </span>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✓</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-slate-600 text-xs font-medium">
                    {course.creator?.full_name?.[0] || 'U'}
                  </span>
                </div>
                <span className="text-sm text-slate-600">{course.creator?.full_name || 'Unknown'}</span>
              </div>
              <span className="text-xs text-slate-400">
                {new Date(course.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
} 