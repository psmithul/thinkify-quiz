# 🚀 Vercel Deployment Guide - Thinkify Quiz Platform

## 🚨 **CRITICAL: Environment Variables Setup**

The **500 Internal Server Error** on production happens because **environment variables are not configured on Vercel**. Follow this guide to fix it.

---

## 📋 **Required Environment Variables**

### **1. Supabase Configuration**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://shmnqswfxezpgpbscmke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTY2OTAsImV4cCI6MjA2MzQ5MjY5MH0.eI-YYJCnYG0Yr1BVddbFz0zMa1qJrFf0mIp8u4bm_GQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4
```

### **2. Razorpay Configuration**
```bash
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### **3. Optional Authentication (if using)**
```bash
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://quiz.thinkify.io
```

---

## 🛠️ **Step-by-Step Vercel Setup**

### **Option 1: Vercel Dashboard (Recommended)**

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Find your `thinkify-quiz` project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables** in sidebar

3. **Add Variables One by One**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://shmnqswfxezpgpbscmke.supabase.co
   Environment: Production, Preview, Development
   ```

   ```
   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY  
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTY2OTAsImV4cCI6MjA2MzQ5MjY5MH0.eI-YYJCnYG0Yr1BVddbFz0zMa1qJrFf0mIp8u4bm_GQ
   Environment: Production, Preview, Development
   ```

   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4
   Environment: Production, Preview, Development
   ```

   ```
   Name: RAZORPAY_KEY_ID
   Value: [YOUR_RAZORPAY_KEY_ID]
   Environment: Production, Preview, Development
   ```

   ```
   Name: RAZORPAY_KEY_SECRET
   Value: [YOUR_RAZORPAY_KEY_SECRET]
   Environment: Production, Preview, Development
   ```

   ```
   Name: NEXT_PUBLIC_RAZORPAY_KEY_ID
   Value: [YOUR_RAZORPAY_KEY_ID]
   Environment: Production, Preview, Development
   ```

4. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** on latest deployment
   - Click **Redeploy**

### **Option 2: Vercel CLI**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   # Enter: https://shmnqswfxezpgpbscmke.supabase.co
   # Select: Production, Preview, Development

   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTY2OTAsImV4cCI6MjA2MzQ5MjY5MH0.eI-YYJCnYG0Yr1BVddbFz0zMa1qJrFf0mIp8u4bm_GQ

   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4

   vercel env add RAZORPAY_KEY_ID
   # Enter: [YOUR_RAZORPAY_KEY_ID]

   vercel env add RAZORPAY_KEY_SECRET  
   # Enter: [YOUR_RAZORPAY_KEY_SECRET]

   vercel env add NEXT_PUBLIC_RAZORPAY_KEY_ID
   # Enter: [YOUR_RAZORPAY_KEY_ID]
   ```

4. **Redeploy**
   ```bash
   vercel --prod
   ```

---

## 🔑 **Getting Your Razorpay Keys**

### **For Testing (Test Mode)**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Make sure you're in **Test Mode** (toggle in top-left)
3. Go to **Settings** → **API Keys**
4. Generate test keys:
   - `RAZORPAY_KEY_ID`: `rzp_test_xxxxxxxxxx`
   - `RAZORPAY_KEY_SECRET`: `xxxxxxxxxx`

### **For Production (Live Mode)**
1. Complete KYC verification on Razorpay
2. Switch to **Live Mode**
3. Generate live keys:
   - `RAZORPAY_KEY_ID`: `rzp_live_xxxxxxxxxx`
   - `RAZORPAY_KEY_SECRET`: `xxxxxxxxxx`

---

## 🧪 **Testing the Fix**

### **1. Check Environment Variables**
```bash
# Visit this URL after deployment
https://quiz.thinkify.io/api/health
```
Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "environment": "production"
}
```

### **2. Test Payment Creation**
1. Go to any quiz page
2. Click "Pay ₹30 Securely"
3. Check browser console for errors
4. Payment modal should open without 500 errors

### **3. Check Logs**
- Go to Vercel Dashboard → Project → Functions
- Check logs for `/api/payment/create-order`
- Should see successful 200 responses

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Missing SUPABASE_SERVICE_ROLE_KEY"**
**Solution:**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel environment variables
- Value should be the service role key (not anon key)
- Redeploy after adding

### **Issue 2: "Razorpay API keys are not configured"**
**Solution:**
- Add both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Use test keys for testing: `rzp_test_xxxxxxxxxx`
- Make sure keys are active in Razorpay dashboard

### **Issue 3: Payment still fails after env vars**
**Solution:**
```bash
# Check if variables are actually set
curl https://quiz.thinkify.io/api/health

# If still failing, try:
1. Clear Vercel build cache (Redeploy)
2. Check Supabase RLS policies
3. Verify database is accessible
```

### **Issue 4: RLS Policy Errors**
**Solution:**
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS
- If still getting RLS errors, check the key is correct
- Service role key format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 📊 **Environment Variables Checklist**

- [ ] `NEXT_PUBLIC_SUPABASE_URL` ✅ Set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ Set  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ❗ **CRITICAL** for payments
- [ ] `RAZORPAY_KEY_ID` ❗ **CRITICAL** for payments
- [ ] `RAZORPAY_KEY_SECRET` ❗ **CRITICAL** for payments
- [ ] `NEXT_PUBLIC_RAZORPAY_KEY_ID` ✅ Set
- [ ] Project redeployed after adding variables

---

## 🎯 **Expected Result After Fix**

### **Working Payment Flow**
1. User clicks "Pay ₹30 Securely" ✅
2. API call to `/api/payment/create-order` returns 200 ✅
3. Razorpay modal opens with payment options ✅
4. User completes payment ✅
5. Payment verified and quiz unlocked instantly ✅

### **Success Indicators**
- ✅ No 500 errors in browser console
- ✅ Payment modal opens properly
- ✅ API responses are 200 status
- ✅ Quiz access granted immediately after payment

---

## 🆘 **Still Having Issues?**

1. **Check Vercel Function Logs**
   - Vercel Dashboard → Your Project → Functions
   - Look for errors in `/api/payment/create-order`

2. **Verify Environment Variables**
   - Vercel Dashboard → Settings → Environment Variables
   - Make sure all 6 variables are set

3. **Test Locally First**
   ```bash
   npm run dev
   # Test payment flow on localhost:3000
   ```

4. **Contact Support**
   - Share specific error messages
   - Include Vercel function logs
   - Mention completion of this setup guide

**Your payment system will work perfectly once environment variables are configured on Vercel!** 🚀 