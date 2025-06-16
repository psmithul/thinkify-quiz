# 🚀 Razorpay Integration Setup Guide

This guide will help you set up automated Razorpay payments for your Thinkify Quiz platform.

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [https://razorpay.com/](https://razorpay.com/)
2. **Business Registration**: For live payments, ensure your business is properly registered
3. **Supabase Project**: Your existing Supabase database

## 🔑 Step 1: Get Razorpay API Keys

### For Development (Test Mode)
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Account & Settings** → **API Keys**
3. Click **Generate Test Key**
4. Copy both **Key ID** and **Key Secret**

### For Production (Live Mode)
1. Complete KYC verification in Razorpay dashboard
2. Submit business documents
3. After approval, generate **Live API Keys**

## 🔧 Step 2: Environment Variables

Add these to your `.env.local` file:

```bash
# Existing Supabase config
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key_here
```

**⚠️ Important Security Notes:**
- Never commit `.env.local` to Git
- Keep `RAZORPAY_KEY_SECRET` absolutely secret
- Use test keys for development
- Only use live keys in production

## 🗃️ Step 3: Database Setup

Run this SQL script in your Supabase SQL Editor:

```sql
-- Add Razorpay fields to payment_verifications table
ALTER TABLE payment_verifications 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_verifications_razorpay_order 
ON payment_verifications(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_razorpay_payment 
ON payment_verifications(razorpay_payment_id);

-- Auto-approval function for verified Razorpay payments
CREATE OR REPLACE FUNCTION auto_approve_razorpay_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve when razorpay_signature is added
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

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_approve_razorpay ON payment_verifications;
CREATE TRIGGER trigger_auto_approve_razorpay
  BEFORE UPDATE ON payment_verifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_razorpay_payment();
```

## 🧪 Step 4: Testing the Integration

### Test Mode Setup
1. Use test API keys from Razorpay
2. Use test card numbers for payments:
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date

### Test Payment Flow
1. Go to any quiz page (while logged out)
2. Click "Pay ₹30 Securely (Recommended)"
3. Complete payment with test credentials
4. Verify immediate access to quiz

## 🔄 Payment Methods Supported

### Automatic (Razorpay) - Recommended
- ✅ **UPI**: PhonePe, GooglePay, Paytm, etc.
- ✅ **Cards**: Visa, Mastercard, RuPay, Amex
- ✅ **Net Banking**: 50+ banks supported
- ✅ **Wallets**: Paytm, Mobikwik, Freecharge, etc.
- ✅ **EMI**: Credit card EMI options
- ✅ **Buy Now Pay Later**: Simpl, LazyPay, etc.

### Manual (Legacy) - Still Available
- 📱 **UPI Screenshot**: QR code scanning + screenshot upload
- ⏳ **Admin Verification**: Requires manual approval

## 🚀 Step 5: Going Live

### Pre-Production Checklist
- [ ] Complete Razorpay KYC verification
- [ ] Test all payment methods in test mode
- [ ] Verify webhook endpoints (if needed)
- [ ] Update environment variables with live keys
- [ ] Test refund functionality
- [ ] Set up monitoring and alerts

### Production Deployment
1. **Update Environment Variables**:
   ```bash
   RAZORPAY_KEY_ID=rzp_live_your_live_key_id
   RAZORPAY_KEY_SECRET=your_live_secret_key
   ```

2. **Deploy to Production**:
   ```bash
   npm run build
   npm run start
   ```

3. **Monitor First Transactions**:
   - Check Razorpay dashboard for successful payments
   - Verify database records are created correctly
   - Test user access after payment

## 💰 Pricing & Fees

### Razorpay Transaction Fees
- **UPI**: 0% (free until certain limit)
- **Cards**: 1.95% + GST
- **Net Banking**: 0.90% + GST
- **Wallets**: 1.75% + GST

### Cost Calculation for ₹30 Quiz
- **UPI Payment**: ₹30.00 (no fees)
- **Card Payment**: ₹30.00 - ₹0.70 = ₹29.30 net
- **Net Banking**: ₹30.00 - ₹0.32 = ₹29.68 net

## 🛡️ Security Features

### Built-in Security
- ✅ **Payment Signature Verification**: Server-side validation
- ✅ **HTTPS Encryption**: All communications encrypted
- ✅ **PCI DSS Compliance**: Razorpay is PCI compliant
- ✅ **Fraud Detection**: Razorpay's AI-powered fraud detection
- ✅ **3D Secure**: For card payments

### Additional Security Measures
- ✅ **Rate Limiting**: Prevent abuse of payment APIs
- ✅ **User Authentication**: Only logged-in users can pay
- ✅ **Duplicate Payment Prevention**: Check for existing payments
- ✅ **Audit Logging**: All payment attempts logged

## 🔧 Troubleshooting

### Common Issues

#### 1. "Payment gateway not loaded"
- **Cause**: Network issues or script blocking
- **Solution**: Check internet connection, disable ad blockers

#### 2. "Invalid API keys"
- **Cause**: Wrong or missing environment variables
- **Solution**: Verify `.env.local` file and restart server

#### 3. "Payment verification failed"
- **Cause**: Network timeout or server error
- **Solution**: Check server logs, retry payment

#### 4. "Database error"
- **Cause**: Missing database fields or permissions
- **Solution**: Run the database setup SQL script

### Debug Mode
Enable detailed logging by adding to `.env.local`:
```bash
NODE_ENV=development
DEBUG=razorpay*
```

## 📊 Analytics & Monitoring

### Razorpay Dashboard
- Real-time payment analytics
- Success/failure rates
- Settlement reports
- Customer payment preferences

### Application Metrics
- Monitor via Supabase dashboard
- Track payment verification status
- User access patterns
- Revenue analytics

## 🆘 Support

### Razorpay Support
- **Documentation**: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- **Support Email**: support@razorpay.com
- **Developer Forum**: [https://community.razorpay.com/](https://community.razorpay.com/)

### Integration Support
- Check application logs for errors
- Verify Supabase database connectivity
- Test with different browsers/devices
- Contact development team if issues persist

## 🎯 Next Steps

After successful setup:
1. **Implement Webhooks** (optional): For real-time payment status updates
2. **Add Refund Management**: Automated refund processing
3. **Analytics Dashboard**: Payment analytics for admins
4. **Multi-currency Support**: If expanding internationally
5. **Subscription Payments**: For premium features

---

**🎉 Congratulations!** Your Razorpay integration is now complete. Users can make secure, automated payments and get instant access to quizzes! 