# Production Deployment Guide

## 🚀 Production URL
**Live App**: https://thinkify-quiz.vercel.app/

## 📋 LinkedIn OAuth Configuration

### 1. LinkedIn Developer Console Setup
You need to update your LinkedIn app configuration in the [LinkedIn Developer Console](https://www.linkedin.com/developers/apps):

#### Required Redirect URIs:
- **Local Development**: `http://localhost:3001/auth/linkedin/callback`
- **Production**: `https://thinkify-quiz.vercel.app/auth/linkedin/callback`

### 2. Environment Variables

#### Vercel Environment Variables
Set these in your Vercel project settings:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://thinkify-quiz.vercel.app
NEXT_PUBLIC_APP_NAME=Thinkify

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=865iwdnmx2n4fy
LINKEDIN_CLIENT_SECRET=WPL_AP1.Zbs0nWg0clHhyAzC.t0scVw==
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=865iwdnmx2n4fy

# Supabase (update with your production values)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Database
DATABASE_URL=your_production_database_url

# NextAuth
NEXTAUTH_SECRET=your_production_nextauth_secret
NEXTAUTH_URL=https://thinkify-quiz.vercel.app
```

### 3. LinkedIn App Configuration Steps

1. **Go to LinkedIn Developer Console**
   - Navigate to: https://www.linkedin.com/developers/apps
   - Select your app: `865iwdnmx2n4fy`

2. **Update Redirect URLs**
   - Go to "Auth" tab
   - In "Authorized redirect URLs for your app", add:
     - `http://localhost:3001/auth/linkedin/callback` (for local development)
     - `https://thinkify-quiz.vercel.app/auth/linkedin/callback` (for production)

3. **Verify OAuth 2.0 scopes**
   - Ensure these scopes are enabled:
     - `openid`
     - `profile`
     - `email`

### 4. Testing LinkedIn OAuth

#### Test Production Environment:
```bash
# Set environment for production testing
NODE_ENV=production node test-linkedin-debug.js
```

#### Test Local Environment:
```bash
# Default (local) environment
node test-linkedin-debug.js
```

### 5. Common Issues & Solutions

#### Issue: `invalid_redirect_uri`
**Solution**: Make sure the redirect URI in LinkedIn Developer Console exactly matches:
- Local: `http://localhost:3001/auth/linkedin/callback`
- Production: `https://thinkify-quiz.vercel.app/auth/linkedin/callback`

#### Issue: `invalid_client`
**Solution**: Verify the LinkedIn Client ID and Secret are correctly set in Vercel environment variables.

#### Issue: OAuth state mismatch
**Solution**: This is handled automatically by the updated code, but ensure cookies/sessionStorage are working properly.

### 6. Deployment Checklist

- [ ] LinkedIn app has both redirect URIs configured
- [ ] Vercel environment variables are set
- [ ] `NEXT_PUBLIC_APP_URL` is set to production URL
- [ ] Supabase project is configured for production
- [ ] Database migrations are applied to production
- [ ] SSL certificate is valid for production domain

### 7. Testing LinkedIn OAuth Flow

1. **Production Test**:
   - Go to: https://thinkify-quiz.vercel.app/auth/login
   - Click "Continue with LinkedIn"
   - Complete OAuth flow
   - Should redirect back to production app

2. **Debug Production Issues**:
   ```bash
   # Generate production OAuth URL
   NODE_ENV=production node test-linkedin-debug.js
   
   # Test with authorization code
   NODE_ENV=production node test-linkedin-debug.js YOUR_AUTH_CODE
   ```

### 8. Monitoring & Logs

- **Vercel Functions**: Check Vercel dashboard for API route logs
- **Browser Console**: Enable debug logging for OAuth flow
- **LinkedIn Developer Console**: Monitor API usage and errors

### 9. Security Considerations

- **Environment Variables**: Never commit production secrets to git
- **HTTPS**: Production must use HTTPS for OAuth security
- **State Parameter**: OAuth state validation prevents CSRF attacks
- **Client Secret**: Keep LinkedIn client secret secure in server environment only

## 🔧 Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| Base URL | `http://localhost:3001` | `https://thinkify-quiz.vercel.app` |
| Redirect URI | `http://localhost:3001/auth/linkedin/callback` | `https://thinkify-quiz.vercel.app/auth/linkedin/callback` |
| SSL | Not required | Required |
| Environment | `.env.local` | Vercel environment variables |

## 📞 Support

If you encounter issues:
1. Check Vercel function logs
2. Verify LinkedIn Developer Console configuration
3. Test with debug script: `node test-linkedin-debug.js`
4. Ensure all environment variables are correctly set 