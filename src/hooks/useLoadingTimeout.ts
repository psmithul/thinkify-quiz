'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseLoadingTimeoutOptions {
  timeout?: number; // Default 10 seconds
  redirectPath?: string; // Default to homepage
  onTimeout?: () => void;
  enabled?: boolean; // Allow disabling the timeout
}

export function useLoadingTimeout(
  isLoading: boolean,
  options: UseLoadingTimeoutOptions = {}
) {
  const {
    timeout = 10000, // 10 seconds
    redirectPath = '/',
    onTimeout,
    enabled = true
  } = options;

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    if (isLoading && !hasTimedOut) {
      // Start countdown
      setTimeRemaining(timeout / 1000);
      
      // Update countdown every second
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set timeout for redirect
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
        
        if (onTimeout) {
          onTimeout();
        } else {
          console.warn('Loading timeout reached, redirecting to homepage');
          router.push(redirectPath);
        }
      }, timeout);
    } else {
      // Clear timeouts when loading stops
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      setTimeRemaining(0);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isLoading, enabled, timeout, redirectPath, onTimeout, router, hasTimedOut]);

  return {
    hasTimedOut,
    timeRemaining: Math.ceil(timeRemaining),
    resetTimeout: () => {
      setHasTimedOut(false);
      setTimeRemaining(0);
    }
  };
} 