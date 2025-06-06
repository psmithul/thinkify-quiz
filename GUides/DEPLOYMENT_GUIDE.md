# 🚀 Deployment Guide - Thinkify Quiz App

This guide covers multiple deployment options for your Thinkify Quiz application.

## 📋 Pre-Deployment Checklist

✅ **Application Status:**
- ✓ Build passes successfully (`npm run build`)
- ✓ All authentication flows working
- ✓ Homepage and navigation redirects fixed
- ✓ Next.js 15 compatibility ensured
- ✓ Code pushed to GitHub

✅ **Required Environment Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 🌐 Deployment Options

### 1. 🟢 Vercel (Recommended for Next.js)

**Why Vercel?**
- Built specifically for Next.js
- Zero-config deployment
- Automatic HTTPS and CDN
- Perfect for this React/Next.js app

**Steps:**
1. **Sign up at [vercel.com](https://vercel.com)**
2. **Connect GitHub repository:**
   - Click "Import Project"
   - Select your GitHub repo: `psmithul/thinkify-quiz`
3. **Configure environment variables:**
   - Add all environment variables from `.env.local`
   - Set `NEXT_PUBLIC_SITE_URL` to your Vercel domain
4. **Deploy:**
   - Click "Deploy"
   - Get your live URL (e.g., `thinkify-quiz.vercel.app`)

**Vercel Configuration (`vercel.json`):**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "functions": {
    "app/api/**": {
      "maxDuration": 30
    }
  }
}
```

### 2. 🟣 Netlify

**Steps:**
1. **Sign up at [netlify.com](https://netlify.com)**
2. **Connect GitHub:**
   - "New site from Git" → GitHub → Select repository
3. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
4. **Environment variables:**
   - Site settings → Environment variables
   - Add all your environment variables
5. **Deploy**

### 3. 🔵 Railway

**Why Railway?**
- Simple deployment
- Built-in database options
- Good for full-stack apps

**Steps:**
1. **Sign up at [railway.app](https://railway.app)**
2. **Create new project from GitHub**
3. **Configure:**
   - Add environment variables
   - Set `PORT=3000`
4. **Deploy automatically**

### 4. 🟠 Heroku

**Steps:**
1. **Install Heroku CLI**
2. **Login and create app:**
   ```bash
   heroku login
   heroku create your-app-name
   ```
3. **Add buildpack:**
   ```bash
   heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git
   ```
4. **Set environment variables:**
   ```bash
   heroku config:set NEXT_PUBLIC_SUPABASE_URL=your_url
   heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   # ... etc
   ```
5. **Deploy:**
   ```bash
   git push heroku main
   ```

### 5. ☁️ AWS/Google Cloud/Azure

**For cloud platforms:**
- Use containerized deployment with Docker
- Set up CI/CD pipeline
- Configure load balancer and CDN

## 🔧 Post-Deployment Configuration

### 1. **Update Supabase Settings**
```sql
-- Update allowed origins in Supabase dashboard
-- Authentication → Settings → Site URL
-- Add your production domain
```

### 2. **LinkedIn OAuth Update**
- Update LinkedIn app redirect URLs:
  - Add: `https://yourdomain.com/auth/linkedin/callback`
  - Remove localhost URLs for production

### 3. **Environment Variables Verification**
```bash
# Verify all variables are set correctly in production
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### 4. **Database Setup**
- Run database setup scripts in Supabase
- Verify RLS policies are working
- Test user creation and authentication

## 📊 Recommended: Vercel Deployment

**Quick Vercel Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/psmithul/thinkify-quiz)

**Manual Vercel Steps:**
1. Fork/clone the repository
2. Install Vercel CLI: `npm i -g vercel`
3. Login: `vercel login`
4. Deploy: `vercel --prod`
5. Add environment variables via Vercel dashboard
6. Redeploy: `vercel --prod`

## 🧪 Testing Deployment

### Essential Tests After Deployment:
1. **Homepage loads correctly** ✓
2. **Navigation signup buttons work** ✓  
3. **Authentication flow works** ✓
4. **LinkedIn OAuth works** ✓
5. **User dashboard accessible** ✓
6. **Database connections work** ✓

### Test URLs:
- `https://yourdomain.com` - Homepage
- `https://yourdomain.com/auth/signup` - Signup
- `https://yourdomain.com/auth/login` - Login
- `https://yourdomain.com/browse` - Browse content
- `https://yourdomain.com/user/dashboard` - User dashboard

## 🚨 Troubleshooting

### Common Issues:

**Build Failures:**
- Check Node.js version (use Node 18+)
- Verify all dependencies are installed
- Check environment variables are set

**Authentication Issues:**
- Verify Supabase URL and keys
- Check LinkedIn OAuth redirect URLs
- Ensure production domain matches

**Database Errors:**
- Run database setup scripts
- Check RLS policies
- Verify service key permissions

**CORS Errors:**
- Update Supabase allowed origins
- Check API endpoint configurations
- Verify authentication headers

## 🔒 Security Checklist

- ✅ Environment variables secured
- ✅ API keys not exposed in client code
- ✅ HTTPS enabled
- ✅ Supabase RLS policies configured
- ✅ Authentication flows tested
- ✅ Production domains whitelisted

## 📈 Monitoring & Analytics

### Recommended Tools:
- **Vercel Analytics** (if using Vercel)
- **Google Analytics** for user tracking
- **Sentry** for error monitoring
- **Supabase Dashboard** for database monitoring

## 🎯 Next Steps After Deployment

1. **Custom Domain** (if using Vercel/Netlify)
2. **SSL Certificate** (usually automatic)
3. **Performance Monitoring**
4. **User Feedback Collection**
5. **SEO Optimization**
6. **Content Management**

---

## 🚀 Quick Deploy Command

For immediate Vercel deployment:
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project directory)
vercel --prod

# Follow prompts to:
# 1. Link to existing project or create new
# 2. Configure build settings
# 3. Add environment variables
```

Your Thinkify Quiz app is ready for production! 🎉

**Repository:** https://github.com/psmithul/thinkify-quiz
**Framework:** Next.js 15.0.2
**Database:** Supabase
**Authentication:** Supabase Auth + LinkedIn OAuth 