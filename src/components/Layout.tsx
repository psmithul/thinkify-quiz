'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

type LayoutProps = {
  children: ReactNode;
};

export function Layout({ children }: LayoutProps) {
  const { user, userData, isAdmin, signOut } = useAuth();
  const pathname = usePathname();
  const [dbTablesExist, setDbTablesExist] = useState<boolean>(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if user is a creator
  const isCreator = userData?.role === 'creator';

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setDropdownOpen(false);
      }
      if (!target.closest('.mobile-menu')) {
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const navigationLinks = [
    {
      href: '/browse',
      label: 'Browse Content',
      icon: '🔍',
      active: pathname === '/browse',
      className: 'text-blue-600 hover:bg-blue-50'
    },
    {
      href: '/creators',
      label: 'View Creators',
      icon: '👨‍🏫',
      active: pathname?.startsWith('/creators'),
      className: 'text-purple-600 hover:bg-purple-50'
    }
  ];

  const getUserLinks = () => {
    if (isAdmin) {
      return [
        {
          href: '/admin/dashboard',
          label: 'Admin Dashboard',
          icon: '⚙️',
          active: pathname?.startsWith('/admin'),
          badge: 'Admin',
          badgeClass: 'badge-primary'
        }
      ];
    } else if (isCreator) {
      return [
        {
          href: '/creator/dashboard',
          label: 'Creator Dashboard',
          icon: '📊',
          active: pathname?.startsWith('/creator') && !pathname?.startsWith('/creator/profile'),
          badge: 'Creator',
          badgeClass: 'badge-secondary'
        },
        {
          href: '/creator/profile',
          label: 'My Profile',
          icon: '👤',
          active: pathname?.startsWith('/creator/profile')
        }
      ];
    } else {
      return [
        {
          href: '/user/dashboard',
          label: 'My Quizzes',
          icon: '🧠',
          active: pathname?.startsWith('/user') && !pathname?.startsWith('/user/profile')
        },
        {
          href: '/user/profile',
          label: 'My Profile',
          icon: '👤',
          active: pathname?.startsWith('/user/profile'),
          badge: 'User',
          badgeClass: 'badge-outline'
        }
      ];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className={`bg-white/80 backdrop-blur-lg shadow-modern border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 shadow-lg' : ''
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 sm:gap-3"
              >
                <div className="text-xl sm:text-2xl">🧠</div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Thinkify
                </span>
              </motion.div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${link.active ? 'active' : ''} ${link.className || ''} text-sm xl:text-base px-3 xl:px-4 py-2`}
                >
                  <span className="mr-1.5 xl:mr-2">{link.icon}</span>
                  <span className="hidden xl:inline">{link.label}</span>
                  <span className="xl:hidden">{link.label.split(' ')[0]}</span>
                </Link>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  {/* Desktop User Links */}
                  <div className="hidden lg:flex items-center gap-1 xl:gap-2">
                    {getUserLinks().map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`nav-link ${link.active ? 'active' : ''} text-xs xl:text-sm px-2 xl:px-3 py-1.5 xl:py-2`}
                      >
                        <span className="mr-1 xl:mr-2">{link.icon}</span>
                        <span className="hidden xl:inline">{link.label}</span>
                        <span className="xl:hidden">{link.label.split(' ')[0]}</span>
                        {link.badge && (
                          <span className={`badge ${link.badgeClass} ml-1 xl:ml-2 text-xs`}>
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative profile-dropdown">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-xl hover:bg-gray-50 transition-all duration-200 focus-ring"
                      aria-label="User menu"
                    >
                      {userData?.profile_image ? (
                        <img
                          className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover ring-1 sm:ring-2 ring-purple-200 shadow-sm"
                          src={userData.profile_image}
                          alt={userData.full_name || 'User'}
                        />
                      ) : (
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold ring-1 sm:ring-2 ring-purple-200 shadow-sm text-sm sm:text-base">
                          {(userData?.full_name?.[0] || userData?.email?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <div className="hidden sm:block text-left">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-1 max-w-24 sm:max-w-none">
                          {userData?.full_name || userData?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{userData?.role}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: dropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-400 text-sm"
                      >
                        ▼
                      </motion.div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-56 sm:w-64 z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg"
                          style={{ 
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            position: 'absolute',
                            top: '100%',
                            right: 0
                          }}
                        >
                          <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            <p className="font-semibold text-gray-900 line-clamp-1 text-sm break-all">{userData?.email}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isAdmin ? 'bg-red-100 text-red-800' : isCreator ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                {userData?.role?.toUpperCase()}
                              </span>
                            </p>
                          </div>

                          {/* Mobile menu items */}
                          <div className="lg:hidden py-2 bg-white">
                            {navigationLinks.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <span className="mr-3 text-base">{link.icon}</span>
                                <span className="font-medium">{link.label}</span>
                              </Link>
                            ))}
                          </div>

                          <div className="py-2 bg-white">
                            {getUserLinks().map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-150"
                                onClick={() => setDropdownOpen(false)}
                              >
                                <div className="flex items-center">
                                  <span className="mr-3 text-base">{link.icon}</span>
                                  <span className="font-medium">{link.label}</span>
                                </div>
                                {link.badge && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${link.badgeClass === 'badge-primary' ? 'bg-blue-100 text-blue-800' : link.badgeClass === 'badge-secondary' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {link.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                            
                            <div className="border-t border-gray-100 mt-2 pt-2">
                              <button 
                                onClick={(e) => {
                                  e.preventDefault(); 
                                  setDropdownOpen(false);
                                  signOut();
                                }} 
                                className="flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                              >
                                <span className="mr-3 text-base">🚪</span>
                                <span className="font-medium">Sign Out</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link 
                    href="/auth/login" 
                    className="nav-link text-gray-600 hover:text-gray-900 text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="btn btn-primary text-xs sm:text-sm px-3 sm:px-6 py-1.5 sm:py-2"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 focus-ring mobile-menu"
                aria-label="Toggle mobile menu"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex flex-col justify-center items-center">
                  <span className={`block w-4 sm:w-5 h-0.5 bg-gray-600 transition-all duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block w-4 sm:w-5 h-0.5 bg-gray-600 transition-all duration-200 mt-1 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block w-4 sm:w-5 h-0.5 bg-gray-600 transition-all duration-200 mt-1 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-200 bg-white/95 backdrop-blur-lg mobile-menu"
            >
              <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1 sm:space-y-2">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block nav-link ${link.active ? 'active' : ''} ${link.className || ''} text-sm py-2.5 px-3 rounded-lg`}
                  >
                    <span className="mr-3">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
                
                {!user && (
                  <div className="pt-3 sm:pt-4 border-t border-gray-200 space-y-2">
                    <Link href="/auth/login" className="block nav-link text-sm py-2.5 px-3 rounded-lg">
                      🔑 Login
                    </Link>
                    <Link href="/auth/register" className="block btn btn-primary text-center text-sm py-2.5">
                      🚀 Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Database Warning */}
      {!dbTablesExist && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="status-warning mx-3 sm:mx-4 mt-3 sm:mt-4 flex items-start gap-2 sm:gap-3 p-3 sm:p-4"
        >
          <div className="text-lg sm:text-2xl">⚠️</div>
          <div>
            <p className="font-semibold text-sm sm:text-base">Database Setup Required</p>
            <p className="text-xs sm:text-sm mt-1">
              Database tables are not set up yet. Please run the SQL setup script in your Supabase dashboard.
            </p>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-lg border-t border-gray-200/50 mt-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="col-span-1 sm:col-span-2">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="text-xl sm:text-2xl">🧠</div>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">Thinkify</span>
                </div>
                <p className="text-gray-600 text-sm sm:text-base max-w-md">
                  Empowering learning through interactive quizzes and comprehensive courses. 
                  Join our community of learners and creators today.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Learn</h4>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link href="/browse" className="text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base">
                      Browse Content
                    </Link>
                  </li>
                  <li>
                    <Link href="/creators" className="text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base">
                      Find Creators
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Create</h4>
                <ul className="space-y-2 sm:space-y-3">
                  <li>
                    <Link href="/make-me-creator" className="text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base">
                      Become a Creator
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/creator-login" className="text-gray-600 hover:text-purple-600 transition-colors text-sm sm:text-base">
                      Creator Login
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-6 sm:mt-8 pt-4 sm:pt-6 text-center">
              <p className="text-gray-500 text-xs sm:text-sm">
                &copy; {new Date().getFullYear()} Thinkify Quiz Platform. Built with ❤️ for learners everywhere.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 