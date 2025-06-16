# Payment Verification System Setup Guide

## Overview
This guide will help you implement a payment verification system for your quiz platform where users need to pay ₹30 before accessing quizzes.

## Architecture
- **Frontend**: React components for QR code display and screenshot upload
- **Backend**: Supabase for database, storage, and authentication
- **Payment Flow**: UPI QR code → Screenshot upload → Admin verification

## Setup Steps

### 1. Database Schema Updates
Run the following SQL scripts in your Supabase SQL editor:

```sql
-- First, run payment_verification_schema.sql
-- Then, run setup_payment_storage.sql
```

### 2. Install Dependencies
```bash
cd thinkify-quiz
npm install qrcode react-qr-code
```

### 3. Configure Your UPI Payment ID
Edit `src/components/PaymentVerification.tsx` and update line 26:
```typescript
const upiPaymentString = `upi://pay?pa=YOUR_UPI_ID@bank&pn=Thinkify Quiz&am=30&cu=INR&tn=Quiz Payment`;
```

Replace `YOUR_UPI_ID@bank` with your actual UPI ID (e.g., `yourname@paytm`, `yourname@googlepe`, etc.)

### 4. Set Up Supabase Storage
1. Go to your Supabase dashboard
2. Navigate to Storage
3. Run the `setup_payment_storage.sql` script to create the bucket and policies

### 5. Admin Access
Access the payment verification admin panel at:
```
https://your-domain.com/admin/payments
```

## Payment Flow

### For Users:
1. User tries to access a quiz
2. System checks if payment is verified
3. If not paid: Shows QR code for ₹30 payment
4. User scans QR code and pays via any UPI app
5. User uploads payment screenshot
6. User waits for admin verification

### For Admins:
1. Go to `/admin/payments`
2. View all pending payment verifications
3. Check payment screenshots
4. Approve or reject payments with notes
5. Users get immediate access upon approval

## UPI Payment Setup Advice

### Option 1: Use Your Personal UPI ID
- Simplest option for testing/small scale
- Use your existing UPI ID like `yourname@paytm`
- Manual reconciliation needed

### Option 2: Business UPI ID
- Get a business UPI ID from your bank
- Better for professional setup
- Usually format: `businessname@bank`

### Option 3: Payment Gateway Integration (Future)
- For automated verification
- Consider Razorpay, PayU, or similar
- Requires additional development

## Security Features

### Built-in Security:
- Row Level Security (RLS) on all tables
- Users can only see their own payments
- Admins can see all payments
- File upload restrictions (5MB, images only)
- Secure file storage with proper permissions

### Additional Recommendations:
1. Set up proper admin role checks
2. Implement audit logging for payment approvals
3. Add email notifications for payment status changes
4. Consider adding payment expiry (auto-reject after 24-48 hours)

## Testing the System

### Test User Flow:
1. Create a test quiz
2. Try accessing it without payment
3. Complete the payment flow with a test screenshot
4. Test admin approval process

### Test Admin Flow:
1. Log in as admin
2. Go to `/admin/payments`
3. Test approving and rejecting payments
4. Verify user access changes accordingly

## Customization Options

### Payment Amount:
Change the amount in multiple places:
- `PaymentVerification.tsx` line 26 (UPI string)
- `payment_verification_schema.sql` (default amount)
- `PaymentVerification.tsx` line 78 (insert amount)

### UI Customization:
- Modify `PaymentVerification.tsx` for different QR code styles
- Update colors and branding in Tailwind classes
- Add your logo or additional payment instructions

## Common Issues & Solutions

### QR Code Not Working:
- Verify your UPI ID format
- Test the UPI string manually in a QR generator
- Check if amount format is correct (30, not 30.00)

### File Upload Issues:
- Ensure Supabase storage bucket is created
- Check RLS policies are set correctly
- Verify file size limits (5MB max)

### Payment Not Showing for Admin:
- Check user has admin role in database
- Verify RLS policies allow admin access
- Check if payment verification record was created

## Next Steps

### Immediate:
1. Update the UPI payment ID with your details
2. Run the database migrations
3. Test the complete flow

### Future Enhancements:
1. Email notifications for payment status
2. Automated payment verification via payment gateway
3. Bulk payment approval for admins
4. Payment analytics and reporting
5. Refund management system

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase logs
3. Ensure all SQL scripts ran successfully
4. Test with different browsers/devices

---

**Important**: Always test the complete payment flow in a staging environment before deploying to production! 