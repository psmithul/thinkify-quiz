'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user, userData, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const [dbTablesExist, setDbTablesExist] = useState<boolean>(true);

  useEffect(() => {
    // Check if essential tables exist
    async function checkDatabaseTables() {
      try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error && error.code === '42P01') {
          setDbTablesExist(false);
        }
      } catch (error) {
        console.error('Error checking database tables:', error);
      }
    }

    checkDatabaseTables();
  }, []);

  // Determine if user is a creator
  const isCreator = userData?.role === 'creator';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex-shrink-0 flex items-center">
                <span className="text-purple-600 text-lg font-medium">Thinkify Quiz</span>
              </Link>
              
              <Link href="/creators" className={`px-3 py-2 rounded-md text-sm ${
                pathname?.startsWith('/creators') 
                  ? 'bg-purple-100 text-purple-700' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
                View Creators
              </Link>
            </div>
            {user ? (
              <div className="flex items-center gap-4">
                {isAdmin ? (
                  <>
                    <Link href="/admin/dashboard" className={`px-3 py-2 rounded-md text-sm ${
                      pathname?.startsWith('/admin') 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      Admin Dashboard
                    </Link>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                      Admin
                    </span>
                  </>
                ) : isCreator ? (
                  <>
                    <Link href="/creator/dashboard" className={`px-3 py-2 rounded-md text-sm ${
                      pathname?.startsWith('/creator') && !pathname?.startsWith('/creator/profile')
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      Creator Dashboard
                    </Link>
                    <Link href="/creator/profile" className={`px-3 py-2 rounded-md text-sm ${
                      pathname?.startsWith('/creator/profile') 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      My Creator Profile
                    </Link>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      Creator
                    </span>
                  </>
                ) : (
                  <>
                    <Link href="/user/dashboard" className={`px-3 py-2 rounded-md text-sm ${
                      pathname?.startsWith('/user') && !pathname?.startsWith('/user/profile')
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      My Quizzes
                    </Link>
                    <Link href="/user/profile" className={`px-3 py-2 rounded-md text-sm ${
                      pathname?.startsWith('/user/profile') 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}>
                      My Profile
                    </Link>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                      User
                    </span>
                  </>
                )}
                <div className="relative ml-3 group">
                  <div className="cursor-pointer flex items-center">
                    {userData?.profile_image ? (
                      <img
                        className="h-8 w-8 rounded-full object-cover border-2 border-purple-200"
                        src={userData.profile_image}
                        alt={userData.full_name || 'User'}
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold border-2 border-purple-200">
                        {(userData?.full_name?.[0] || userData?.email?.[0] || '?').toUpperCase()}
                      </div>
                    )}
                    <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                      {userData?.full_name || userData?.email?.split('@')[0] || 'User'}
                    </span>
                  </div>
                  
                  <div className="hidden group-hover:block absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-900 border-b border-gray-100">
                      <p className="font-semibold truncate">{userData?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{userData?.role}</p>
                    </div>
                    {isAdmin && (
                      <a href="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Admin Dashboard
                      </a>
                    )}
                    {isCreator && (
                      <a href="/creator/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Edit Creator Profile
                      </a>
                    )}
                    {!isAdmin && !isCreator && (
                      <a href="/user/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        Profile Settings
                      </a>
                    )}
                    <a href="/" onClick={(e) => {e.preventDefault(); signOut();}} 
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                      Sign Out
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/auth/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm">
                  Login
                </Link>
                <Link href="/auth/creator-login" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm">
                  Creator Login
                </Link>
                <Link href="/auth/signup" className="bg-purple-600 text-white hover:bg-purple-700 px-3 py-2 rounded-md text-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {!dbTablesExist && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Database tables are not set up yet. Please run <code className="bg-yellow-100 px-1 py-0.5 rounded">npm run init-db</code> to initialize the database.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Thinkify Labs. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 