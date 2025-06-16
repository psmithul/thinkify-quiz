# 🚨 EMERGENCY FIX - Disable RLS Temporarily for Payments

## Current Issue
The Razorpay payment creation is still failing with RLS policy errors, even with the admin client bypass attempt.

## Root Cause
- `SUPABASE_SERVICE_ROLE_KEY` is not configured in environment variables
- Admin client is falling back to anon key which still has RLS restrictions
- Payment records cannot be created due to Row Level Security policies

## ⚡ IMMEDIATE TEMPORARY FIX

**Run this SQL in your Supabase SQL Editor to temporarily disable RLS on payment_verifications:**

```sql
-- TEMPORARY FIX: Disable RLS on payment_verifications table
-- This allows payment creation to work while we fix the proper policies

ALTER TABLE payment_verifications DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users temporarily
GRANT ALL ON payment_verifications TO authenticated;

-- Optional: Add a comment to track this temporary change
COMMENT ON TABLE payment_verifications IS 'RLS temporarily disabled for Razorpay integration - TODO: Re-enable with proper policies';
```

## ✅ What This Does

- **Temporarily disables RLS** on the payment_verifications table
- **Allows all authenticated users** to create/read/update payment records
- **Enables Razorpay payments** to work immediately
- **Maintains basic authentication** (only logged-in users can access)

## ⚠️ Security Note

This is a **temporary solution** for development/testing. For production:

1. **Set up proper service role key** in environment variables
2. **Re-enable RLS** with proper policies
3. **Use admin client** for payment operations

## 🔄 To Re-enable RLS Later

When you have the service role key configured, run:

```sql
-- Re-enable RLS and set up proper policies
ALTER TABLE payment_verifications ENABLE ROW LEVEL SECURITY;

-- Then apply the proper policies from DATABASE_FIX_REQUIRED.md
```

## 📝 After Running This Fix

1. **Execute the SQL above** in Supabase SQL Editor
2. **Test the Razorpay payment** in your application
3. **Payment creation should work** without RLS errors
4. **Users can complete payments** and access quizzes immediately

---

**This temporary fix allows Razorpay payments to work while maintaining basic authentication security.** 