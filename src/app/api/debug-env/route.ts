import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Check all required environment variables
    const envChecks = {
      'NEXT_PUBLIC_SUPABASE_URL': !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'SUPABASE_SERVICE_ROLE_KEY': !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      'RAZORPAY_KEY_ID': !!process.env.RAZORPAY_KEY_ID,
      'RAZORPAY_KEY_SECRET': !!process.env.RAZORPAY_KEY_SECRET,
      'NEXT_PUBLIC_RAZORPAY_KEY_ID': !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    };

    // Count missing variables
    const missingVars = Object.entries(envChecks)
      .filter(([key, exists]) => !exists)
      .map(([key]) => key);

    const allSet = missingVars.length === 0;

    // Test service role access
    let serviceRoleTest: { working: boolean; error: string | null } = { working: false, error: null };
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('count(*)')
          .limit(1);
        
        serviceRoleTest.working = !error;
        serviceRoleTest.error = error?.message || null;
      } catch (err: any) {
        serviceRoleTest.error = err.message;
      }
    }

    // Test payment table access specifically
    let paymentTableTest: { working: boolean; error: string | null } = { working: false, error: null };
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { data, error } = await supabaseAdmin
          .from('payment_verifications')
          .select('count(*)')
          .limit(1);
        
        paymentTableTest.working = !error;
        paymentTableTest.error = error?.message || null;
      } catch (err: any) {
        paymentTableTest.error = err.message;
      }
    }

    return NextResponse.json({
      status: allSet ? 'ok' : 'missing_environment_variables',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      variables: envChecks,
      missing: missingVars,
      serviceRole: serviceRoleTest,
      paymentTable: paymentTableTest,
      usingServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      message: allSet 
        ? 'All environment variables are configured correctly!'
        : `Missing ${missingVars.length} environment variable(s): ${missingVars.join(', ')}`,
      instructions: allSet 
        ? (paymentTableTest.working 
           ? 'Payment system should work correctly.' 
           : 'Environment variables set but service role cannot access payment table. RLS fix needed.')
        : 'Please configure missing environment variables in Vercel Dashboard → Settings → Environment Variables, then redeploy.',
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check environment variables',
      error: error.message,
    }, { status: 500 });
  }
} 