'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  children?: React.ReactNode;
  showDetails?: boolean;
  autoRetry?: boolean;
  redirectDelay?: number; // Auto redirect after X seconds
}

export function ErrorFallback({
  error,
  resetError,
  children,
  showDetails = false,
  autoRetry = true,
  redirectDelay = 15000 // 15 seconds
}: ErrorFallbackProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(Math.ceil(redirectDelay / 1000));
  const [mounted, setMounted] = useState(false);
  
  // Only use network monitor when mounted (client-side)
  const networkState = useNetworkMonitor();
  const { isOnline, hasConnectionIssues, retryConnection } = mounted ? networkState : {
    isOnline: true,
    hasConnectionIssues: false,
    retryConnection: async () => false
  };

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto redirect countdown - only run when mounted
  useEffect(() => {
    if (!mounted || redirectDelay <= 0) return;
    
    const interval = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [redirectDelay, router, mounted]);

  // Auto retry mechanism - only run when mounted
  useEffect(() => {
    if (!mounted || !autoRetry || retryCount >= 3 || !hasConnectionIssues) return;
    
    const timeout = setTimeout(async () => {
      setIsRetrying(true);
      try {
        const connected = await retryConnection();
        if (connected && resetError) {
          resetError();
        } else {
          setRetryCount(prev => prev + 1);
        }
      } catch (retryError) {
        console.error('Auto retry failed:', retryError);
        setRetryCount(prev => prev + 1);
      } finally {
        setIsRetrying(false);
      }
    }, Math.pow(2, retryCount) * 2000); // Exponential backoff: 2s, 4s, 8s

    return () => clearTimeout(timeout);
  }, [autoRetry, retryCount, hasConnectionIssues, retryConnection, resetError, mounted]);

  const handleManualRetry = async () => {
    if (!mounted) return;
    
    setIsRetrying(true);
    try {
      // Check network first
      if (!isOnline) {
        const connected = await retryConnection();
        if (!connected) {
          throw new Error('Network connection failed');
        }
      }

      // Try to reset the error
      if (resetError) {
        resetError();
      } else {
        // Fallback: reload the page
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (retryError) {
      console.error('Manual retry failed:', retryError);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    if (mounted) {
      router.push('/');
    }
  };

  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const getErrorType = (error?: Error) => {
    if (!error) return 'unknown';
    
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('database') || message.includes('supabase')) {
      return 'database';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'auth';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'notfound';
    }
    
    return 'unknown';
  };

  const errorType = getErrorType(error);

  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: '🔌',
          title: 'Connection Problem',
          description: 'There seems to be a network connectivity issue. Please check your internet connection and try again.',
          color: 'red'
        };
      case 'timeout':
        return {
          icon: '⏱️',
          title: 'Request Timeout',
          description: 'The request took too long to complete. This might be due to a slow connection or server issues.',
          color: 'orange'
        };
      case 'database':
        return {
          icon: '🗄️',
          title: 'Database Error',
          description: 'There was an issue connecting to our database. Our team has been notified.',
          color: 'purple'
        };
      case 'auth':
        return {
          icon: '🔐',
          title: 'Authentication Error',
          description: 'There was an issue with your login session. Please sign in again.',
          color: 'blue'
        };
      case 'notfound':
        return {
          icon: '🔍',
          title: 'Page Not Found',
          description: 'The page you\'re looking for doesn\'t exist or has been moved.',
          color: 'gray'
        };
      default:
        return {
          icon: '⚠️',
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. We\'re sorry for the inconvenience.',
          color: 'red'
        };
    }
  };

  const errorConfig = getErrorConfig();

  if (children && !error) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className={`h-16 w-16 bg-${errorConfig.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-3xl">{errorConfig.icon}</span>
          </div>
          <h2 className={`text-2xl font-bold text-${errorConfig.color}-900 mb-2`}>
            {errorConfig.title}
          </h2>
          <p className={`text-${errorConfig.color}-600 mb-4`}>
            {errorConfig.description}
          </p>

          {/* Network status - only show when mounted */}
          {mounted && !isOnline && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm">
                🔌 No internet connection detected
              </p>
            </div>
          )}

          {mounted && hasConnectionIssues && isOnline && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
              <p className="text-orange-800 text-sm">
                ⚠️ Connection issues detected
              </p>
            </div>
          )}

          {/* Auto retry indicator - only show when mounted */}
          {mounted && isRetrying && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-600 mr-2"></div>
                <p className="text-blue-800 text-sm">
                  Automatically retrying... (Attempt {retryCount + 1}/3)
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          {/* Manual retry button */}
          <button
            onClick={handleManualRetry}
            disabled={isRetrying}
            className={`px-6 py-3 bg-${errorConfig.color}-600 text-white rounded-lg hover:bg-${errorConfig.color}-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Retrying...
              </>
            ) : (
              'Try Again'
            )}
          </button>
          
          {/* Go home button */}
          <button
            onClick={handleGoHome}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Go to Homepage
          </button>
          
          {/* Reload page button */}
          <button
            onClick={handleReload}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reload Page
          </button>
        </div>

        {/* Auto redirect countdown - only show when mounted */}
        {mounted && redirectDelay > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Automatically redirecting to homepage in {redirectCountdown} seconds
            </p>
          </div>
        )}

        {/* Error details (development mode) - only show when mounted */}
        {mounted && showDetails && error && process.env.NODE_ENV === 'development' && (
          <details className="mt-6 p-4 bg-gray-100 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
              Error Details (Development)
            </summary>
            <pre className="text-xs text-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
              {error.message}
              {error.stack && '\n\n' + error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
} 