import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Diagnosing payment RLS policy issues...');

    // Test current RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'payment_verifications' })
      .select('*');

    console.log('Current RLS policies:', policies, policiesError);

    const fixSQL = `
-- Fix payment_verifications RLS policies for Razorpay integration

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can update own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;

-- Create more flexible policies for payment operations
-- Policy for users to view their own payments
CREATE POLICY "payment_verifications_user_select" ON payment_verifications
FOR SELECT USING (
  auth.uid() = user_id
);

-- Policy for users to insert their own payment records
CREATE POLICY "payment_verifications_user_insert" ON payment_verifications
FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Policy for users to update their own payment records (needed for manual payments)
CREATE POLICY "payment_verifications_user_update" ON payment_verifications
FOR UPDATE USING (
  auth.uid() = user_id AND verification_status = 'pending'
) WITH CHECK (
  auth.uid() = user_id
);

-- Policy for admin full access
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

-- Policy for system/service operations (when auth.uid() might be null in some edge cases)
-- This allows authenticated users to create payment records during the payment flow
CREATE POLICY "payment_verifications_authenticated_insert" ON payment_verifications
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Ensure RLS is enabled
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON payment_verifications TO authenticated;
GRANT USAGE ON SEQUENCE payment_verifications_id_seq TO authenticated;
    `;

    return NextResponse.json({
      success: true,
      message: 'Payment RLS policy fix required',
      diagnosis: {
        issue: 'Row Level Security policies are preventing payment record creation',
        cause: 'Current RLS policies are too restrictive for the payment flow',
        solution: 'Updated RLS policies needed to allow proper payment operations'
      },
      fixInstructions: {
        title: 'Fix Payment RLS Policies',
        description: 'Run the following SQL in your Supabase SQL Editor to fix payment permissions:',
        sql: fixSQL.trim(),
        steps: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL above',
          '4. Click "Run" to execute the policy fixes',
          '5. Test the payment flow again'
        ]
      },
      currentPolicies: policies || 'Could not retrieve current policies',
      policiesError: policiesError?.message || null
    });

  } catch (error) {
    console.error('RLS diagnosis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 