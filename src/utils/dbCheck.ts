import { supabase } from '@/lib/supabaseClient';
import { setupPaymentDatabase } from './dbSetup';

export async function checkDatabaseStatus(autoFix: boolean = false) {
  console.log('🔍 Checking database status...');
  
  try {
    // First, try a simple select to see if we can access the table
    const { data: simpleData, error: simpleError } = await supabase
      .from('payment_verifications')
      .select('id')
      .limit(1);

    if (simpleError) {
      console.error('❌ payment_verifications table access error:', {
        message: simpleError.message,
        details: simpleError.details,
        hint: simpleError.hint,
        code: simpleError.code
      });

      // Check if it's an RLS policy issue (table exists but access denied)
      if (simpleError.code === 'PGRST301' || simpleError.message?.includes('policy')) {
        console.warn('⚠️  Table exists but RLS policies may be blocking access');
        return { 
          paymentVerifications: true, 
          accessBlocked: true, 
          error: simpleError,
          suggestion: 'RLS policies may need to be updated for admin access'
        };
      }

      // Check if it's a table doesn't exist error
      if (simpleError.code === 'PGRST116' || simpleError.message?.includes('relation') || simpleError.message?.includes('does not exist')) {
        if (autoFix) {
          console.log('🔧 Table not found, attempting automatic setup...');
          const setupResult = await setupPaymentDatabase();
          
          if (setupResult.success) {
            console.log('✅ Automatic setup completed, re-checking table...');
            // Re-check after setup
            const { data: retestData, error: retestError } = await supabase
              .from('payment_verifications')
              .select('id')
              .limit(1);
            
            if (!retestError) {
              console.log('✅ payment_verifications table now accessible');
              return { paymentVerifications: true, autoFixed: true, error: null };
            }
          }
          
          return { paymentVerifications: false, autoFixed: false, error: simpleError };
        }
        return { paymentVerifications: false, error: simpleError };
      }

      return { paymentVerifications: false, error: simpleError };
    }

    console.log('✅ payment_verifications table exists and is accessible');
    
    // Check users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      console.error('❌ users table error:', {
        message: usersError.message,
        details: usersError.details,
        hint: usersError.hint,
        code: usersError.code
      });
    } else {
      console.log('✅ users table exists and is accessible');
    }

    // Check quizzes table
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id')
      .limit(1);

    if (quizzesError) {
      console.error('❌ quizzes table error:', {
        message: quizzesError.message,
        details: quizzesError.details,
        hint: quizzesError.hint,
        code: quizzesError.code
      });
    } else {
      console.log('✅ quizzes table exists and is accessible');
    }

    // Test a simple join query only if both users and quizzes tables are accessible
    if (!usersError && !quizzesError) {
      const { data: joinData, error: joinError } = await supabase
        .from('payment_verifications')
        .select(`
          id,
          user:users!user_id(id, email),
          quiz:quizzes(title)
        `)
        .limit(1);

      if (joinError) {
        console.error('❌ Join query error:', {
          message: joinError.message,
          details: joinError.details,
          hint: joinError.hint,
          code: joinError.code
        });
        return { 
          paymentVerifications: true, 
          joinWorks: false, 
          error: joinError,
          suggestion: 'Foreign key relationships or RLS policies may need adjustment'
        };
      }

      console.log('✅ Join query works');
    }

    return { paymentVerifications: true, joinWorks: true, error: null };
    
  } catch (error) {
    console.error('❌ Database check failed:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { paymentVerifications: false, error };
  }
}

// Helper function to check and fix RLS policies
export async function checkAndFixRLSPolicies() {
  console.log('🔧 Checking RLS policies for payment_verifications...');
  
  try {
    // Try to get current user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('👤 Current user:', user.email);

    // Check user role in database
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError) {
      console.error('❌ Could not fetch user role:', roleError);
      return { success: false, error: 'Could not fetch user role' };
    }

    console.log('👑 User role:', userData?.role);

    if (userData?.role === 'admin') {
      console.log('✅ User has admin role, should have access');
    } else {
      console.warn('⚠️  User does not have admin role, access may be limited');
    }

    return { success: true, userRole: userData?.role, userId: user.id };

  } catch (error) {
    console.error('❌ RLS policy check failed:', error);
    return { success: false, error };
  }
}

// Helper function to run database migrations if needed
export async function runBasicDatabaseSetup() {
  console.log('🔧 Running basic database setup...');
  
  try {
    console.log('ℹ️  To fix database issues, run the SQL files in your project:');
    console.log('   - complete_payment_setup.sql');
    console.log('   - payment_verification_schema.sql');
    console.log('   - fix_all_database_issues.sql');
    console.log('');
    console.log('ℹ️  Or call setupPaymentDatabase() from dbSetup.ts');

    const setupResult = await setupPaymentDatabase();
    return setupResult;
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return { success: false, error };
  }
} 