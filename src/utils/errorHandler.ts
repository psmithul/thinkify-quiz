import { AuthError, PostgrestError } from '@supabase/supabase-js';

// Custom error types
export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

export type FormError = {
  field: string;
  message: string;
};

// Function to handle API errors
export function handleApiError(error: unknown): ApiError {
  if (error instanceof AuthError) {
    return {
      status: 401,
      message: error.message,
    };
  }
  
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
    };
  }
  
  return {
    status: 500,
    message: 'An unexpected error occurred',
    details: error,
  };
}

// Function to validate form input
export function validateFormInput(input: Record<string, unknown>): FormError[] {
  const errors: FormError[] = [];
  
  // Example validation - expand as needed
  Object.entries(input).forEach(([field, value]) => {
    if (value === undefined || value === null || value === '') {
      errors.push({
        field,
        message: `${field} is required`,
      });
    }
  });
  
  return errors;
}

// Create user-friendly error message
export function formatErrorMessage(error: unknown): string {
  // Handle Supabase authentication errors
  if (error instanceof AuthError) {
    if (error.message.includes('Email already registered')) {
      return 'This email is already registered. Please try logging in or use a different email.';
    }
    
    if (error.message.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment before trying again.';
    }
    
    return `Authentication error: ${error.message}`;
  }
  
  // Handle Supabase database errors
  if (typeof error === 'object' && error !== null) {
    const pgError = error as PostgrestError;
    
    if (pgError.code === '23505') {
      return 'This record already exists. Please try again with different information.';
    }
    
    if (pgError.code === '42P01') {
      return 'Database tables do not exist yet. Please run the setup command.';
    }
    
    if (pgError.message) {
      return `Database error: ${pgError.message}`;
    }
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  // Default case
  return 'An unexpected error occurred';
} 