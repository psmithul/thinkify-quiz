-- URGENT: Run this SQL in Supabase SQL Editor to fix payment system
-- Go to: https://shmnqswfxezpgpbscmke.supabase.co
-- Navigate to: SQL Editor (left sidebar)
-- Copy and paste this entire file and click "Run"

ALTER TABLE payment_verifications 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2);

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

-- Test the migration by checking table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payment_verifications' 
ORDER BY ordinal_position; 