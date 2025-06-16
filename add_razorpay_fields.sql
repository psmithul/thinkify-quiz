-- Add Razorpay-specific fields to payment_verifications table
-- Run this in your Supabase SQL Editor

-- Add Razorpay fields to payment_verifications table
ALTER TABLE payment_verifications 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_verifications_razorpay_order 
ON payment_verifications(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_razorpay_payment 
ON payment_verifications(razorpay_payment_id);

-- Add check constraint to ensure either screenshot OR razorpay payment details exist
-- This allows both manual (screenshot) and automated (razorpay) payment methods
-- Comment: We'll allow both methods to coexist during transition period

-- Create a function to automatically approve Razorpay payments when signature is added
CREATE OR REPLACE FUNCTION auto_approve_razorpay_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- If razorpay_signature is being added and verification_status is still pending
  IF NEW.razorpay_signature IS NOT NULL 
     AND OLD.razorpay_signature IS NULL 
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

-- Update existing payment_verifications table to handle both payment methods
COMMENT ON COLUMN payment_verifications.payment_screenshot_url IS 'For manual UPI payments (legacy method)';
COMMENT ON COLUMN payment_verifications.razorpay_order_id IS 'Razorpay order ID for automated payments';
COMMENT ON COLUMN payment_verifications.razorpay_payment_id IS 'Razorpay payment ID for automated payments';
COMMENT ON COLUMN payment_verifications.razorpay_signature IS 'Razorpay signature for payment verification';
COMMENT ON COLUMN payment_verifications.payment_method IS 'Payment method used: razorpay or manual';

-- Show current table structure
\d payment_verifications; 