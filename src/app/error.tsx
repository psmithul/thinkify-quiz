'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (e.g., Sentry)
      console.log('Error would be sent to monitoring service:', {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      resetError={reset}
      showDetails={process.env.NODE_ENV === 'development'}
      autoRetry={true}
      redirectDelay={30000} // 30 seconds for global errors
    />
  );
} 