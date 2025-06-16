'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabaseClient';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useAuth } from '@/lib/authContext';

// Animation variants for smooth scroll reveals
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

// Animated Counter Component
function AnimatedCounter({ end, duration = 2, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime = Date.now();
      let animationFrame: number;

      const updateCount = () => {
        const now = Date.now();
        const elapsed = (now - startTime) / 1000;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(end * easeOut));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateCount);
        } else {
          setCount(end);
        }
      };

      animationFrame = requestAnimationFrame(updateCount);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [isInView, end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Scroll-triggered section component
function ScrollSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, userData, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalCourses: 0,
    totalCreators: 0,
    totalAttempts: 0,
  });

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, -30]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  useEffect(() => {
    // Redirect authenticated users to their dashboard
    if (user && userData && !authLoading) {
      const redirectUrl = userData.role === 'admin' ? '/admin/dashboard' : 
                         userData.role === 'creator' ? '/creator/dashboard' : 
                         '/user/dashboard';
      
      console.log('Redirecting authenticated user to:', redirectUrl);
      router.push(redirectUrl);
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [quizzesRes, coursesRes, creatorsRes, attemptsRes] = await Promise.all([
          supabase.from('quizzes').select('id', { count: 'exact' }),
          supabase.from('courses').select('id', { count: 'exact' }),
          supabase.from('users').select('id', { count: 'exact' }).eq('role', 'creator'),
          supabase.from('quiz_attempts').select('id', { count: 'exact' }),
        ]);

        setStats({
          totalQuizzes: quizzesRes.count || 0,
          totalCourses: coursesRes.count || 0,
          totalCreators: creatorsRes.count || 0,
          totalAttempts: attemptsRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    // Only fetch stats if user is not authenticated (to avoid unnecessary API calls)
    if (!user || authLoading) {
      fetchStats();
    }
  }, [user, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect authenticated users (this will trigger the useEffect redirect)
  if (user && userData) {
    return (
      <Layout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleSignupClick = () => {
    router.push('/auth/signup');
  };

  return (
    <Layout>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <motion.section 
          style={{ y: heroY }}
          className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50"
        >
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-8"
              >
                🧠
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Master Skills.
                </span>
                <br />
                <span className="text-slate-800">
                  Unlock Potential.
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-lg sm:text-xl md:text-2xl text-slate-600 max-w-4xl mx-auto mb-10 leading-relaxed px-4"
              >
                Transform your learning journey with interactive quizzes and expert-crafted courses 
                designed to help you achieve your goals.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-16 px-4"
              >
                <Button
                  onClick={handleSignupClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
                  size="lg"
                >
                  🚀 Start Learning
                </Button>
                <Button
                  onClick={() => router.push('/browse')}
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-xl font-semibold transition-all duration-300"
                  size="lg"
                >
                  📚 Browse Content
                </Button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-slate-600 text-sm sm:text-base px-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🎓</span>
                  <span className="font-medium">Learn at Your Pace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">✨</span>
                  <span className="font-medium">Expert Content</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🏆</span>
                  <span className="font-medium">Track Progress</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>

        {/* Live Statistics Section */}
        <ScrollSection className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6">
                Growing <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Community</span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
                Join learners and creators building skills together
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            >
              {[
                { 
                  number: stats.totalQuizzes, 
                  label: "Quizzes", 
                  icon: "🧠",
                  color: "blue"
                },
                { 
                  number: stats.totalCourses, 
                  label: "Courses", 
                  icon: "📚",
                  color: "purple"
                },
                { 
                  number: stats.totalCreators, 
                  label: "Creators", 
                  icon: "👨‍🏫",
                  color: "green"
                },
                { 
                  number: stats.totalAttempts, 
                  label: "Attempts", 
                  icon: "🎯",
                  color: "orange"
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl p-6 sm:p-8 text-center shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">{stat.icon}</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-1 sm:mb-2">
                    <AnimatedCounter end={Math.max(stat.number, 1)} />
                  </div>
                  <div className="text-slate-600 font-medium text-sm sm:text-base">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollSection>

        {/* Features Section */}
        <ScrollSection className="py-16 sm:py-20 lg:py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6">
                Why Choose <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Our Platform?</span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
                Experience modern learning with intuitive tools and engaging content
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12"
            >
              {[
                {
                  icon: "⚡",
                  title: "Interactive Learning",
                  description: "Engage with dynamic quizzes and interactive content that makes learning enjoyable and effective.",
                  highlights: ["Real-time Feedback", "Progress Tracking", "Adaptive Content"]
                },
                {
                  icon: "🎯",
                  title: "Goal-Oriented",
                  description: "Set learning objectives and track your progress with clear milestones and achievements.",
                  highlights: ["Personal Goals", "Achievement System", "Progress Analytics"]
                },
                {
                  icon: "🌟",
                  title: "Quality Content",
                  description: "Access carefully curated courses and quizzes created by experienced educators and professionals.",
                  highlights: ["Expert Creators", "Quality Assurance", "Regular Updates"]
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">{feature.icon}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">{feature.title}</h3>
                  <p className="text-slate-600 mb-4 sm:mb-6 leading-relaxed">{feature.description}</p>
                  <div className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-green-500 text-sm">✓</span>
                        <span className="text-slate-600 font-medium text-sm">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollSection>

        {/* How It Works Section */}
        <ScrollSection className="py-16 sm:py-20 lg:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-800 mb-4 sm:mb-6">
                How It <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Works</span>
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
                Get started in three simple steps
              </p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12"
            >
              {[
                {
                  step: "1",
                  title: "Sign Up",
                  description: "Create your free account and set up your learning profile in minutes.",
                  icon: "🚀"
                },
                {
                  step: "2",
                  title: "Explore Content",
                  description: "Browse our library of quizzes and courses to find topics that interest you.",
                  icon: "🔍"
                },
                {
                  step: "3",
                  title: "Start Learning",
                  description: "Take quizzes, enroll in courses, and track your progress as you learn.",
                  icon: "📈"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="text-center"
                >
                  <div className="relative mb-6 sm:mb-8">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <div className="text-3xl sm:text-4xl">{item.icon}</div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3 sm:mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </ScrollSection>

        {/* CTA Section */}
        <ScrollSection className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <motion.div variants={fadeInUp}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Ready to Start <span className="text-blue-200">Learning?</span>
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                Join our community of learners and start building the skills you need to succeed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 sm:mb-12">
                <Button
                  onClick={handleSignupClick}
                  className="bg-white text-blue-600 hover:bg-blue-50 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-xl shadow-lg font-bold transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  🎯 Get Started Free
                </Button>
                <Button
                  onClick={() => router.push('/browse')}
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-xl font-bold transition-all duration-300"
                  size="lg"
                >
                  📚 Explore Content
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-blue-100 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-300">✓</span>
                  <span>Join anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </ScrollSection>

        {/* Footer CTA */}
        <ScrollSection className="py-12 sm:py-16 bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-slate-600 mb-6 sm:mb-8 text-sm sm:text-base">
                Want to create and share your expertise? 
                <Link href="/make-me-creator" className="text-blue-600 hover:text-blue-700 font-semibold ml-2 transition-colors">
                  Become a Creator →
                </Link>
              </p>
              
              <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-xs sm:text-sm text-slate-500">
                <Link href="/terms" className="hover:text-slate-700 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-slate-700 transition-colors">Privacy Policy</Link>
                <Link href="/cancellation-refund" className="hover:text-slate-700 transition-colors">Cancellation & Refund</Link>
                <Link 
                  href="https://connect.thinkify.io" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-700 transition-colors"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </ScrollSection>
      </div>
    </Layout>
  );
}
