-- Add payment verification tables to your existing schema

-- Update the payments table with verification fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create payment_verifications table for better tracking
CREATE TABLE IF NOT EXISTS payment_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    quiz_id UUID REFERENCES quizzes(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 30.00,
    payment_screenshot_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_verifications_user_quiz ON payment_verifications(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_status ON payment_verifications(verification_status);

-- Create RLS policies
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment verifications
CREATE POLICY "Users can view own payment verifications" ON payment_verifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own payment verifications
CREATE POLICY "Users can insert own payment verifications" ON payment_verifications
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only admins can update verification status
CREATE POLICY "Admins can update payment verifications" ON payment_verifications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Admins can view all payment verifications
CREATE POLICY "Admins can view all payment verifications" ON payment_verifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    ); 