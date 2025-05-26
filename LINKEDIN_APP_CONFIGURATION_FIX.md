# LinkedIn App Configuration Fix 🔧

## 🚨 CRITICAL: You MUST update your LinkedIn Developer App Settings

The error you're getting is due to a **redirect URI mismatch**. Here's how to fix it:

## Step 1: Update LinkedIn App Redirect URIs

1. Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
2. Select your app (Client ID: 865iwdnmx2n4fy)
3. Go to **Auth** tab
4. In the **Redirect URLs** section, add **BOTH** URLs:

```
http://localhost:3001/auth/linkedin/callback
http://localhost:3001/test-linkedin
```

**IMPORTANT**: 
- URLs must match EXACTLY (no trailing slashes, correct port)
- Include BOTH URLs for testing and production use
- The URLs are case-sensitive

## Step 2: Verify Product Configuration

Ensure you have the correct LinkedIn product:
- ✅ **"Sign in with LinkedIn using OpenID Connect"** 
- ❌ NOT "Sign In with LinkedIn" (legacy)

## Step 3: Verify OAuth Settings

In your LinkedIn app settings:
- **Scopes**: `openid`, `profile`, `email` 
- **OAuth 2.0 scopes**: All three must be enabled

## Step 4: Test the Fix

### Option A: Test with Debug Page (Recommended)
1. Visit: `http://localhost:3001/test-linkedin`
2. Click "Start LinkedIn OAuth Test"
3. Complete LinkedIn authorization
4. Should automatically return with code
5. Click "Test Token Exchange"
6. Should show "success: true"

### Option B: Test Normal Login Flow  
1. Visit: `http://localhost:3001/auth/login`
2. Click "Continue with LinkedIn"
3. Complete LinkedIn authorization
4. Should create account and redirect

## 🔍 What Was Fixed

The issue was a **redirect URI mismatch**:

- **Before**: Test page used `http://localhost:3001/test-linkedin` but API used `http://localhost:3001/auth/linkedin/callback`
- **After**: API now uses the correct redirect URI that matches where the code was obtained

## 🧪 Verification Commands

```bash
# Check server is running
curl -s http://localhost:3001/api/test-linkedin

# Test configuration
node debug-linkedin.mjs

# Check environment variables
cat .env.local | grep LINKEDIN
```

## 📋 LinkedIn App Settings Checklist

- [ ] Product: "Sign in with LinkedIn using OpenID Connect" enabled
- [ ] Redirect URLs include: `http://localhost:3001/auth/linkedin/callback`
- [ ] Redirect URLs include: `http://localhost:3001/test-linkedin` 
- [ ] Scopes enabled: `openid`, `profile`, `email`
- [ ] App is in development/testing mode (if needed)

## 🚀 Expected Results After Fix

When everything is configured correctly:

1. **Authorization** → Redirects to LinkedIn ✅
2. **User grants permission** → Returns to your app ✅  
3. **Token exchange** → Gets access token ✅
4. **Profile fetch** → Gets user data ✅
5. **Account creation** → User logged in ✅

## ⚠️ Common LinkedIn App Configuration Mistakes

1. **Wrong redirect URI**: Must match exactly where code was obtained
2. **Wrong product**: Using legacy "Sign In with LinkedIn" instead of OpenID Connect
3. **Missing scopes**: Need `openid`, `profile`, `email`
4. **Trailing slashes**: `http://localhost:3001/callback/` ≠ `http://localhost:3001/callback`
5. **Port mismatch**: Make sure it's port 3001, not 3000

## 🔗 Quick Test Links

After updating LinkedIn app settings:
- Test page: http://localhost:3001/test-linkedin
- Login page: http://localhost:3001/auth/login
- API test: http://localhost:3001/api/test-linkedin

---

**Next Steps**: 
1. Update LinkedIn app redirect URLs (most important!)
2. Test with debug page
3. Verify normal login flow works
4. Check server console for any remaining errors 