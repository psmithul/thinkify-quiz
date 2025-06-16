import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Checking payment verification table status...');

    // First, test if we can access the table
    const { data: testData, error: testError } = await supabase
      .from('payment_verifications')
      .select('count(*)', { count: 'exact', head: true });

    if (!testError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verification table already exists and is accessible',
        tableExists: true
      });
    }

    // If table doesn't exist, provide instructions
    console.error('Table access error:', testError);
    
    const setupInstructions = `
To fix the database issue, please run this SQL in your Supabase SQL Editor:

-- Create payment_verifications table
CREATE TABLE IF NOT EXISTS payment_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 30.00,
  payment_screenshot_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_verifications_user_quiz ON payment_verifications(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON payment_verifications(verification_status);

-- Enable RLS
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own payment verifications" ON payment_verifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment verifications" ON payment_verifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update payment verifications" ON payment_verifications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can view all payment verifications" ON payment_verifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
    `;

    return NextResponse.json({ 
      success: false, 
      error: 'Payment verification table does not exist',
      tableExists: false,
      setupInstructions: setupInstructions.trim(),
      details: {
        message: testError.message,
        code: testError.code,
        hint: testError.hint
      }
    });

  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    });
  }
} 