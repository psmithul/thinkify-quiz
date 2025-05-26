'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/Button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const { user, isAdmin, isCreator, isLoading } = useAuth();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalCourses: 0,
    totalCreators: 0,
    isLoading: true
  });

  useEffect(() => {
    if (!isLoading && user) {
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else if (isCreator) {
        router.push('/creator/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    }
  }, [user, isAdmin, isCreator, isLoading, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch quiz count
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id')
          .eq('is_published', true);

        // Fetch course count
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id')
          .eq('is_published', true);

        // Fetch creator count
        const { data: creators, error: creatorsError } = await supabase
          .from('users')
          .select('id')
          .in('role', ['creator', 'admin']);

        setStats({
          totalQuizzes: quizzes?.length || 0,
          totalCourses: courses?.length || 0,
          totalCreators: creators?.length || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-16 w-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
          />
        </div>
      </Layout>
    );
  }

  // If user is logged in, this will redirect, so don't show the home page
  if (user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-4 mb-6">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-6xl"
                  >
                    🧠
                  </motion.div>
                  <h1 className="text-6xl md:text-8xl font-bold">
                    <span className="text-gradient bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                      Thinkify
                    </span>
                  </h1>
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-6">
                  Quiz & Learning Platform
                </h2>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed"
              >
                Create, share, and discover engaging quizzes and comprehensive courses. 
                Build your knowledge and skills with interactive learning experiences.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-col sm:flex-row justify-center gap-6 mb-20"
              >
                <Button
                  size="lg"
                  onClick={() => router.push('/auth/signup')}
                  variant="primary"
                  className="text-lg px-10 py-4 shadow-xl"
                >
                  🚀 Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/auth/login')}
                  className="text-lg px-10 py-4"
                >
                  🔑 Sign In
                </Button>
              </motion.div>

              {/* Stats Cards */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
              >
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="card p-8 card-hover bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                >
                  <div className="text-4xl font-bold text-purple-600 mb-3">
                    {stats.isLoading ? (
                      <div className="skeleton h-8 w-16 mx-auto"></div>
                    ) : (
                      stats.totalQuizzes
                    )}
                  </div>
                  <div className="text-gray-700 font-semibold">Active Quizzes</div>
                  <div className="text-5xl mt-3">🧠</div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="card p-8 card-hover bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                >
                  <div className="text-4xl font-bold text-green-600 mb-3">
                    {stats.isLoading ? (
                      <div className="skeleton h-8 w-16 mx-auto"></div>
                    ) : (
                      stats.totalCourses
                    )}
                  </div>
                  <div className="text-gray-700 font-semibold">Learning Courses</div>
                  <div className="text-5xl mt-3">📚</div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Thinkify?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to create, learn, and grow in one platform
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎯',
                  title: 'Interactive Quizzes',
                  description: 'Create engaging quizzes with multiple question types and instant feedback'
                },
                {
                  icon: '📖',
                  title: 'Rich Courses',
                  description: 'Build comprehensive courses with lessons, videos, and progress tracking'
                },
                {
                  icon: '💡',
                  title: 'Smart Analytics',
                  description: 'Track performance, engagement, and learning outcomes with detailed insights'
                },
                {
                  icon: '🌐',
                  title: 'Global Community',
                  description: 'Connect with learners and creators from around the world'
                },
                {
                  icon: '🔒',
                  title: 'Secure & Reliable',
                  description: 'Built with security and scalability in mind using modern technologies'
                },
                {
                  icon: '🚀',
                  title: 'Easy to Use',
                  description: 'Intuitive interface that makes creating and learning content a breeze'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white"
            >
              <h2 className="text-4xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Join thousands of learners and creators who are already using Thinkify to expand their knowledge
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/auth/signup')}
                  className="bg-white text-purple-600 hover:bg-gray-100 text-lg px-8 py-4"
                >
                  Sign Up Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push('/auth/login')}
                  className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4"
                >
                  Sign In
                </Button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Thinkify</h3>
                <p className="text-gray-400">
                  Empowering learning through interactive quizzes and comprehensive courses.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={() => router.push('/auth/signup')} className="hover:text-white">Join Community</button></li>
                  <li><button onClick={() => router.push('/about')} className="hover:text-white">About Us</button></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Account</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><button onClick={() => router.push('/auth/login')} className="hover:text-white">Sign In</button></li>
                  <li><button onClick={() => router.push('/auth/signup')} className="hover:text-white">Sign Up</button></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Thinkify Quiz Platform. Built with ❤️ for learners everywhere.</p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}
