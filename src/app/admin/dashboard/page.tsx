'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

type ViewMode = 'admin' | 'creator' | 'user';

export default function AdminDashboard() {
  const { userData, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('admin');

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  if (!userData || userData.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </Layout>
    );
  }

  const handleViewModeSwitch = (mode: ViewMode) => {
    setViewMode(mode);
    switch (mode) {
      case 'user':
        router.push('/user/dashboard');
        break;
      case 'creator':
        router.push('/creator/dashboard');
        break;
      case 'admin':
        // Stay on admin dashboard
        break;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back, {userData.full_name || userData.email}! You have full access to all features.
            </p>
          </div>
        </div>

        {/* View Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Choose Your Interface</h2>
          <p className="text-gray-600 mb-6">
            As an admin, you can access all user interfaces. Choose the view you'd like to work with:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Admin Interface */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                viewMode === 'admin'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
              onClick={() => handleViewModeSwitch('admin')}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">👑</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Interface</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Full system administration, user management, and analytics
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">• User Management</div>
                  <div className="text-xs text-gray-500">• System Analytics</div>
                  <div className="text-xs text-gray-500">• Platform Settings</div>
                </div>
              </div>
            </motion.div>

            {/* Creator Interface */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                viewMode === 'creator'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
              onClick={() => handleViewModeSwitch('creator')}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">🎨</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Creator Interface</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Create and manage quizzes, track student performance
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">• Quiz Creation</div>
                  <div className="text-xs text-gray-500">• Student Analytics</div>
                  <div className="text-xs text-gray-500">• Content Management</div>
                </div>
              </div>
            </motion.div>

            {/* User Interface */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className={`p-6 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                viewMode === 'user'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-green-300'
              }`}
              onClick={() => handleViewModeSwitch('user')}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Interface</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Take quizzes, view results, and track your learning progress
                </p>
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">• Take Quizzes</div>
                  <div className="text-xs text-gray-500">• View Results</div>
                  <div className="text-xs text-gray-500">• Get Certificates</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">∞</div>
            <div className="text-sm text-gray-600">Admin Access</div>
            <div className="text-xs text-gray-500 mt-1">Full Platform Control</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">All</div>
            <div className="text-sm text-gray-600">Quiz Access</div>
            <div className="text-xs text-gray-500 mt-1">View & Manage All Quizzes</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">All</div>
            <div className="text-sm text-gray-600">User Data</div>
            <div className="text-xs text-gray-500 mt-1">Complete Analytics Access</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-2xl font-bold text-orange-600">All</div>
            <div className="text-sm text-gray-600">Features</div>
            <div className="text-xs text-gray-500 mt-1">Every Platform Feature</div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => router.push('/admin/companies')}
              variant="outline"
              className="w-full"
            >
              🏢 Manage Companies
            </Button>
            <Button
              onClick={() => router.push('/admin/interviewers')}
              variant="outline"
              className="w-full"
            >
              👨‍💼 Manage Interviewers
            </Button>
            <Button
              onClick={() => router.push('/admin/recruiters')}
              variant="outline"
              className="w-full"
            >
              🎯 Manage Recruiters
            </Button>
            <Button
              onClick={() => router.push('/creator/dashboard')}
              variant="outline"
              className="w-full"
            >
              🎨 Switch to Creator
            </Button>
            <Button
              onClick={() => router.push('/user/dashboard')}
              variant="outline"
              className="w-full"
            >
              📚 Switch to User
            </Button>
            <Button
              onClick={() => router.push('/admin/setup-database')}
              variant="outline"
              className="w-full"
            >
              ⚙️ Database Setup
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
} 