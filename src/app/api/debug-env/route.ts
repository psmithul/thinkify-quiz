import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({
      status: allSet ? 'ok' : 'missing_environment_variables',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      variables: envChecks,
      missing: missingVars,
      message: allSet 
        ? 'All environment variables are configured correctly!'
        : `Missing ${missingVars.length} environment variable(s): ${missingVars.join(', ')}`,
      instructions: allSet 
        ? 'Payment system should work correctly.'
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