'use client';

import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingSpinner } from './LoadingSpinner';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';

interface PageWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  loadingMessage?: string;
  title?: string;
  showNetworkStatus?: boolean;
  requiresAuth?: boolean;
  className?: string;
}

export function PageWrapper({
  children,
  isLoading = false,
  error = null,
  onRetry,
  loadingMessage = 'Loading...',
  title,
  showNetworkStatus = true,
  requiresAuth = false,
  className = ''
}: PageWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const { isOnline, hasConnectionIssues, retryConnection } = useNetworkMonitor();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <div className={`min-h-screen ${className}`}>
        {/* Page title if provided */}
        {title && (
          <head>
            <title>{title}</title>
          </head>
        )}

        {/* Network status warning */}
        {showNetworkStatus && !isOnline && (
          <div className="bg-red-600 text-white p-2 text-center text-sm">
            <span className="mr-2">🔌</span>
            No internet connection
            <button
              onClick={retryConnection}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {showNetworkStatus && isOnline && hasConnectionIssues && (
          <div className="bg-orange-600 text-white p-2 text-center text-sm">
            <span className="mr-2">⚠️</span>
            Connection issues detected
            <button
              onClick={retryConnection}
              className="ml-2 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg border border-red-200 p-6 max-w-md w-full text-center">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-red-700 text-sm mb-4">
                {error.message || 'An unexpected error occurred'}
              </p>
              <div className="flex gap-2 justify-center">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Go Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Reload
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && !error && (
          <div className="min-h-screen">
            <LoadingSpinner
              isLoading={true}
              message={loadingMessage}
              showTimeout={true}
              timeoutDuration={10000}
              size="lg"
              className="min-h-screen"
            />
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && children}
      </div>
    </ErrorBoundary>
  );
} 