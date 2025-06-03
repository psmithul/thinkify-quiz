'use client';

import React, { useState, useEffect } from 'react';
import { useLoadingTimeout } from '@/hooks/useLoadingTimeout';
import { useNetworkMonitor } from '@/hooks/useNetworkMonitor';

interface LoadingSpinnerProps {
  isLoading: boolean;
  message?: string;
  showTimeout?: boolean;
  timeoutDuration?: number;
  onTimeout?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  isLoading,
  message = 'Loading...',
  showTimeout = true,
  timeoutDuration = 10000,
  onTimeout,
  size = 'md',
  className = ''
}: LoadingSpinnerProps) {
  const [mounted, setMounted] = useState(false);
  
  // Only use hooks when mounted
  const timeoutState = useLoadingTimeout(isLoading, {
    timeout: timeoutDuration,
    onTimeout,
    enabled: showTimeout && mounted
  });
  
  const networkState = useNetworkMonitor();
  
  const { timeRemaining, hasTimedOut } = mounted ? timeoutState : { timeRemaining: 0, hasTimedOut: false };
  const { isOnline, isSlowConnection, hasConnectionIssues, retryConnection } = mounted ? networkState : {
    isOnline: true,
    isSlowConnection: false,
    hasConnectionIssues: false,
    retryConnection: async () => false
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isLoading && !hasTimedOut) return null;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const containerSizeClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  if (mounted && hasTimedOut) {
    return (
      <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]} ${className}`}>
        <div className="bg-white rounded-lg shadow-lg border border-orange-200 p-6 max-w-md w-full text-center">
          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏱️</span>
          </div>
          <h3 className="text-lg font-semibold text-orange-900 mb-2">Taking longer than expected</h3>
          <p className="text-orange-700 text-sm mb-4">
            This is taking longer than usual. You'll be redirected to the homepage in a moment.
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Go to Homepage Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center ${containerSizeClasses[size]} ${className}`}>
      {/* Spinner */}
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 mb-3`} />
      
      {/* Loading message */}
      <p className="text-gray-600 text-sm mb-2">{message}</p>
      
      {/* Network status warnings - only show when mounted */}
      {mounted && !isOnline && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-2 max-w-sm">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">🔌</span>
            <div>
              <p className="text-red-800 text-xs font-medium">No internet connection</p>
              <button
                onClick={retryConnection}
                className="text-red-600 text-xs underline mt-1"
              >
                Retry connection
              </button>
            </div>
          </div>
        </div>
      )}
      
      {mounted && isOnline && isSlowConnection && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-2 max-w-sm">
          <div className="flex items-center">
            <span className="text-yellow-500 mr-2">🐌</span>
            <p className="text-yellow-800 text-xs">Slow connection detected</p>
          </div>
        </div>
      )}

      {mounted && isOnline && hasConnectionIssues && (
        <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-2 max-w-sm">
          <div className="flex items-center">
            <span className="text-orange-500 mr-2">⚠️</span>
            <div>
              <p className="text-orange-800 text-xs font-medium">Connection issues detected</p>
              <button
                onClick={retryConnection}
                className="text-orange-600 text-xs underline mt-1"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Timeout countdown - only show when mounted */}
      {mounted && showTimeout && timeRemaining > 0 && timeRemaining <= 5 && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-2 max-w-sm">
          <p className="text-gray-600 text-xs text-center">
            Redirecting to homepage in {timeRemaining} second{timeRemaining !== 1 ? 's' : ''}...
          </p>
        </div>
      )}
    </div>
  );
} 