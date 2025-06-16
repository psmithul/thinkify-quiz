import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 Running EMERGENCY RLS FIX for payment system...');

    // Emergency RLS bypass policies for service role
    const queries = [
      // Drop existing policies
      `DROP POLICY IF EXISTS "service_role_bypass_payment_verifications" ON payment_verifications;`,
      
      // Create service role bypass policy
      `CREATE POLICY "service_role_bypass_payment_verifications" ON payment_verifications
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);`,
      
      // Grant permissions
      `GRANT ALL ON payment_verifications TO service_role;`,
      
      // Alternative full access policy
      `DROP POLICY IF EXISTS "service_role_full_access" ON payment_verifications;`,
      `CREATE POLICY "service_role_full_access" ON payment_verifications
        FOR ALL
        TO service_role  
        USING (true)
        WITH CHECK (true);`,
      
      // Grant schema permissions
      `GRANT USAGE ON SCHEMA public TO service_role;`,
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;`,
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;`,
    ];

    const results = [];
    
    for (const query of queries) {
      try {
        console.log(`Executing: ${query.substring(0, 50)}...`);
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: query });
        
        if (error) {
          console.log(`Query failed: ${error.message}`);
          // Continue with other queries even if one fails
          results.push({ query: query.substring(0, 50), success: false, error: error.message });
        } else {
          console.log(`Query succeeded`);
          results.push({ query: query.substring(0, 50), success: true });
        }
      } catch (err: any) {
        console.log(`Query error: ${err.message}`);
        results.push({ query: query.substring(0, 50), success: false, error: err.message });
      }
    }

    // Test payment creation after fix
    console.log('🧪 Testing payment creation after RLS fix...');
    
    const testPayment = {
      id: crypto.randomUUID(),
      user_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Test user ID
      quiz_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // Test quiz ID
      verification_status: 'pending',
      payment_method: 'razorpay',
      amount_paid: 30,
      created_at: new Date().toISOString(),
      razorpay_order_id: 'test_order_' + Date.now(),
    };

    const { data: testData, error: testError } = await supabaseAdmin
      .from('payment_verifications')
      .insert([testPayment])
      .select()
      .single();

    if (testError) {
      console.error('❌ Test payment creation failed:', testError);
      return NextResponse.json({
        success: false,
        message: 'RLS fix applied but test payment creation still failed',
        error: testError.message,
        results,
        testError: testError,
      }, { status: 500 });
    } else {
      console.log('✅ Test payment creation succeeded!');
      
      // Clean up test payment
      await supabaseAdmin
        .from('payment_verifications')
        .delete()
        .eq('id', testPayment.id);
      
      return NextResponse.json({
        success: true,
        message: 'Emergency RLS fix applied successfully! Payment system should work now.',
        results,
        testPayment: testData,
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error: any) {
    console.error('❌ Emergency RLS fix failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Emergency RLS fix failed',
      error: error.message,
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to run emergency RLS fix',
    endpoint: '/api/emergency-rls-fix',
    method: 'POST',
  });
} 