export interface AsyncResult<T> {
  data?: T;
  error?: Error;
  isLoading: boolean;
}

export interface AsyncOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
}

/**
 * Wraps an async operation with timeout, retry logic, and error handling
 */
export async function withAsyncHandling<T>(
  operation: () => Promise<T>,
  options: AsyncOptions = {}
): Promise<AsyncResult<T>> {
  const {
    timeout = 10000,
    retries = 3,
    retryDelay = 1000,
    onError,
    onRetry
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
      });

      // Race between operation and timeout
      const data = await Promise.race([operation(), timeoutPromise]);
      
      return { data, isLoading: false };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (onError) {
        onError(lastError);
      }

      // Don't retry on the last attempt
      if (attempt < retries) {
        if (onRetry) {
          onRetry(attempt + 1);
        }
        
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return { error: lastError!, isLoading: false };
}

/**
 * Creates a debounced version of an async function
 */
export function debounceAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout;
  let resolvePromise: (value: R) => void;
  let rejectPromise: (reason: any) => void;

  return (...args: T): Promise<R> => {
    return new Promise<R>((resolve, reject) => {
      clearTimeout(timeoutId);
      resolvePromise = resolve;
      rejectPromise = reject;

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolvePromise(result);
        } catch (error) {
          rejectPromise(error);
        }
      }, delay);
    });
  };
}

/**
 * Handles common API errors and provides user-friendly messages
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection error. Please check your internet connection and try again.';
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'Request timed out. Please try again.';
    }
    
    // Auth errors
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'You are not authorized to perform this action. Please sign in and try again.';
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource was not found.';
    }
    
    // Database errors
    if (message.includes('database') || message.includes('supabase')) {
      return 'Database error. Please try again later.';
    }
    
    // Rate limiting
    if (message.includes('rate') || message.includes('429')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    
    // Server errors
    if (message.includes('500') || message.includes('internal server')) {
      return 'Server error. Please try again later.';
    }
    
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Logs errors with additional context for debugging
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined
  };

  console.error('Error logged:', errorInfo);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
    console.log('Error would be sent to monitoring service:', errorInfo);
  }
}

/**
 * Creates a safe async function that won't throw
 */
export function safeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<AsyncResult<R>> {
  return async (...args: T): Promise<AsyncResult<R>> => {
    try {
      const data = await fn(...args);
      return { data, isLoading: false };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logError(errorObj, { functionName: fn.name, args });
      return { error: errorObj, isLoading: false };
    }
  };
} 