# 🔑 Environment Variables Reference

## 📋 **Copy these to Vercel Environment Variables**

### **Required for Production**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://shmnqswfxezpgpbscmke.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MTY2OTAsImV4cCI6MjA2MzQ5MjY5MH0.eI-YYJCnYG0Yr1BVddbFz0zMa1qJrFf0mIp8u4bm_GQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNobW5xc3dmeGV6cGdwYnNjbWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkxNjY5MCwiZXhwIjoyMDYzNDkyNjkwfQ.wnxsiebOyH6sKaJ9b0W9DGdqWutjP0yuVBgDImGdbp4

# Razorpay Configuration (Replace with your keys)
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

### **Optional**

```bash
# NextAuth (if using authentication)
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://quiz.thinkify.io
```

---

## 🚀 **Quick Setup Instructions**

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Find your `thinkify-quiz` project

2. **Add Environment Variables**
   - Settings → Environment Variables
   - Add each variable above (copy name and value)
   - Select "Production, Preview, Development"

3. **Get Razorpay Keys**
   - Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
   - Test Mode → Settings → API Keys
   - Replace `rzp_test_your_key_id_here` with your actual key

4. **Redeploy**
   - Deployments → Latest → Redeploy

---

## ✅ **Verification**

After setup, test:
- Visit: `https://quiz.thinkify.io/api/health`
- Should return: `{"status": "ok"}`
- Payment buttons should work without 500 errors

**The 500 Internal Server Error will be fixed once these environment variables are configured on Vercel!** 