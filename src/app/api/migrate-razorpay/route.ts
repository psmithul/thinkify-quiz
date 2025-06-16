import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Checking Razorpay database migration status...');

    // Test if the new columns exist by trying to select them
    const { data: testData, error: testError } = await supabase
      .from('payment_verifications')
      .select('razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_method')
      .limit(1);

    if (!testError) {
      // Columns exist, migration already completed
      return NextResponse.json({
        success: true,
        message: 'Razorpay fields already exist in the database',
        migrationNeeded: false,
        status: 'completed'
      });
    }

    // If we get here, the columns don't exist and need to be added
    console.log('Missing Razorpay columns, migration needed:', testError);

    const migrationSQL = `
-- Add Razorpay fields to payment_verifications table
ALTER TABLE payment_verifications 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_verifications_razorpay_order 
ON payment_verifications(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_razorpay_payment 
ON payment_verifications(razorpay_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_payment_method 
ON payment_verifications(payment_method);

-- Update existing records to have payment_method = 'manual'
UPDATE payment_verifications 
SET payment_method = 'manual' 
WHERE payment_method IS NULL;

-- Create auto-approval function for Razorpay payments
CREATE OR REPLACE FUNCTION auto_approve_razorpay_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If razorpay_signature is being added and verification_status is still pending
  IF NEW.razorpay_signature IS NOT NULL 
     AND (OLD.razorpay_signature IS NULL OR OLD.razorpay_signature = '') 
     AND NEW.verification_status = 'pending' THEN
    
    NEW.verification_status = 'approved';
    NEW.verified_at = NOW();
    NEW.verification_notes = COALESCE(NEW.verification_notes, '') || ' [Auto-approved: Razorpay signature verified]';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-approval
DROP TRIGGER IF EXISTS trigger_auto_approve_razorpay ON payment_verifications;
CREATE TRIGGER trigger_auto_approve_razorpay
  BEFORE UPDATE ON payment_verifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_razorpay_payment();
    `;

    return NextResponse.json({
      success: false,
      message: 'Database migration required for Razorpay integration',
      migrationNeeded: true,
      status: 'pending',
      instructions: {
        title: 'Required Database Migration',
        description: 'Please run the following SQL in your Supabase SQL Editor to add Razorpay support:',
        sql: migrationSQL.trim(),
        steps: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the SQL above',
          '4. Click "Run" to execute the migration',
          '5. Refresh your application and try the payment again'
        ]
      },
      error: {
        code: testError.code,
        message: testError.message,
        details: testError.details
      }
    });

  } catch (error) {
    console.error('Migration check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
} 