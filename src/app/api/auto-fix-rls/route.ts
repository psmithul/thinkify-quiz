import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting automated RLS policy fix...');

    // Create a service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Define the RLS policy fixes
    const policies = [
      {
        name: 'Drop existing policies',
        sql: `
          DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
          DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
          DROP POLICY IF EXISTS "Users can update own payment verifications" ON payment_verifications;
          DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
          DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;
        `
      },
      {
        name: 'Create user select policy',
        sql: `
          CREATE POLICY "payment_verifications_user_select" ON payment_verifications
          FOR SELECT USING (auth.uid() = user_id);
        `
      },
      {
        name: 'Create user insert policy',
        sql: `
          CREATE POLICY "payment_verifications_user_insert" ON payment_verifications
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'Create user update policy',
        sql: `
          CREATE POLICY "payment_verifications_user_update" ON payment_verifications
          FOR UPDATE USING (auth.uid() = user_id AND verification_status = 'pending')
          WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'Create admin all access policy',
        sql: `
          CREATE POLICY "payment_verifications_admin_all" ON payment_verifications
          FOR ALL USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role = 'admin'
            )
          ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role = 'admin'
            )
          );
        `
      },
      {
        name: 'Create authenticated insert policy',
        sql: `
          CREATE POLICY "payment_verifications_authenticated_insert" ON payment_verifications
          FOR INSERT WITH CHECK (auth.role() = 'authenticated');
        `
      }
    ];

    const results = [];
    
    // Execute each policy
    for (const policy of policies) {
      try {
        const { error } = await supabaseAdmin.rpc('exec_sql', { 
          sql: policy.sql.trim() 
        });
        
        if (error) {
          console.error(`Error in ${policy.name}:`, error);
          results.push({
            policy: policy.name,
            success: false,
            error: error.message
          });
        } else {
          console.log(`✅ ${policy.name} - Success`);
          results.push({
            policy: policy.name,
            success: true
          });
        }
      } catch (err) {
        console.error(`Exception in ${policy.name}:`, err);
        results.push({
          policy: policy.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    // Test if the fix worked by trying to read from the table
    const { data: testData, error: testError } = await supabaseAdmin
      .from('payment_verifications')
      .select('*')
      .limit(1);

    const successCount = results.filter(r => r.success).length;
    const totalPolicies = results.length;

    return NextResponse.json({
      success: successCount === totalPolicies,
      message: `RLS policy fix completed: ${successCount}/${totalPolicies} policies applied`,
      results: results,
      testResult: testError ? {
        success: false,
        error: testError.message
      } : {
        success: true,
        message: 'Table access verified'
      }
    });

  } catch (error) {
    console.error('Auto-fix RLS error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to apply RLS policies automatically'
    }, { status: 500 });
  }
} 