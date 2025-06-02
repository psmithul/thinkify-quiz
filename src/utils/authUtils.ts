import { supabase } from '@/lib/supabaseClient';

export interface AuthDebugInfo {
  timestamp: string;
  action: string;
  success: boolean;
  error?: string;
  details?: any;
}

class AuthDebugger {
  private logs: AuthDebugInfo[] = [];

  log(action: string, success: boolean, details?: any, error?: string) {
    const entry: AuthDebugInfo = {
      timestamp: new Date().toISOString(),
      action,
      success,
      details,
      error
    };
    
    this.logs.push(entry);
    
    // Also log to console for immediate debugging
    if (success) {
      console.log(`✅ Auth ${action}:`, details);
    } else {
      console.error(`❌ Auth ${action} failed:`, error, details);
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase.auth.getSession();
      this.log('Supabase Connection Test', !error, { hasSession: !!data.session }, error?.message);
      return !error;
    } catch (err) {
      this.log('Supabase Connection Test', false, null, err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }

  async testDatabaseConnection() {
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);
      this.log('Database Connection Test', !error, { rowCount: data?.length }, error?.message);
      return !error;
    } catch (err) {
      this.log('Database Connection Test', false, null, err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }

  async testUserCreation(userData: { email: string; full_name: string }) {
    try {
      // Test if we can create a test user profile (without auth)
      const testProfile = {
        id: 'test-user-id',
        email: userData.email,
        full_name: userData.full_name,
        role: 'user'
      };

      // This should fail due to RLS, but we can see the specific error
      const { error } = await supabase.from('users').insert([testProfile]);
      
      this.log('User Creation Test', !error, testProfile, error?.message);
      return !error;
    } catch (err) {
      this.log('User Creation Test', false, userData, err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }

  downloadDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      logs: this.logs,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const authDebugger = new AuthDebugger();

// Helper function to validate signup form data
export function validateSignupData(formData: {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  acceptTerms: boolean;
}) {
  const errors: string[] = [];

  if (!formData.email) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.push('Email format is invalid');
  }

  if (!formData.password) {
    errors.push('Password is required');
  } else if (formData.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (formData.password !== formData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!formData.fullName || formData.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (!formData.acceptTerms) {
    errors.push('You must accept the terms and conditions');
  }

  return errors;
}

// Helper function to check environment variables
export function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    authDebugger.log('Environment Check', false, { missing }, `Missing environment variables: ${missing.join(', ')}`);
    return false;
  }

  authDebugger.log('Environment Check', true, { vars: requiredVars });
  return true;
} 