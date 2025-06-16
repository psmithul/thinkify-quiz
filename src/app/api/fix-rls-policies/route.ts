import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Fixing RLS policies for payment_verifications...');

    // First check if the user is authenticated and is an admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      });
    }

    // Check user role
    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (roleError || userData?.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin privileges required' 
      });
    }

    const fixRLSSQL = `
-- Fix RLS policies for payment_verifications table

-- First, ensure RLS is enabled
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins full access" ON payment_verifications;

-- Create comprehensive admin policy
CREATE POLICY "Admins full access" ON payment_verifications
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create user policies for regular users
CREATE POLICY "Users can view own payment verifications" ON payment_verifications
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment verifications" ON payment_verifications
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT ON payment_verifications TO authenticated;
GRANT UPDATE, DELETE ON payment_verifications TO authenticated;
    `;

    return NextResponse.json({ 
      success: false, 
      error: 'Cannot execute SQL directly',
      fixRLSSQL: fixRLSSQL.trim(),
      instruction: 'Please run this SQL in your Supabase SQL Editor to fix RLS policies'
    });

  } catch (error) {
    console.error('RLS fix error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
} 