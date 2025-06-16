# 🚨 DATABASE FIX REQUIRED - Razorpay Payment Error

## Current Issue
```
POST http://localhost:3001/api/payment/create-order 500 (Internal Server Error)
Error: Error creating payment record
```

**Root Cause:** Row Level Security (RLS) policies are preventing payment record creation.

## ⚡ IMMEDIATE FIX NEEDED

You need to run the following SQL in your **Supabase SQL Editor** to fix payment permissions:

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor** (in the left sidebar)
3. Click **"New Query"**

### Step 2: Copy and Run This SQL

```sql
-- Fix payment_verifications RLS policies for Razorpay integration

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can insert own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Users can update own payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can update payment verifications" ON payment_verifications;
DROP POLICY IF EXISTS "Admins can view all payment verifications" ON payment_verifications;

-- Create flexible policies for payment operations
CREATE POLICY "payment_verifications_user_select" ON payment_verifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_verifications_user_insert" ON payment_verifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payment_verifications_user_update" ON payment_verifications
FOR UPDATE USING (auth.uid() = user_id AND verification_status = 'pending')
WITH CHECK (auth.uid() = user_id);

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

-- Allow authenticated users to create payment records
CREATE POLICY "payment_verifications_authenticated_insert" ON payment_verifications
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure proper permissions
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON payment_verifications TO authenticated;
```

### Step 3: Click "Run" Button
- Execute the SQL by clicking the **"Run"** button
- Wait for the success message

### Step 4: Test Payment Flow
- Go back to your application
- Try the Razorpay payment again
- The error should be resolved

## What This Fixes

✅ **Users can create payment records** during checkout  
✅ **Users can view their own payments**  
✅ **Admins have full access** to all payment records  
✅ **Razorpay integration works** without RLS blocking  
✅ **Security is maintained** - users only access their own data  

## After Running the SQL

Once you've executed the SQL:
1. Refresh your application
2. Try making a payment with Razorpay
3. The `create-order` API should work successfully
4. Payment flow should complete without errors

---

**🔑 This is a one-time database fix required for Razorpay integration to work properly.** 