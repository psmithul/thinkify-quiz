# LinkedIn OAuth OpenID Connect Fix

## 🚨 Issue Resolved

The error `Failed to exchange code for token` was caused by using incorrect environment variable names and not properly following the new LinkedIn OpenID Connect specification.

## 📋 Changes Made

### 1. Fixed Environment Variable Names

**Updated API route** (`src/app/api/auth/linkedin/userinfo/route.ts`):
```typescript
// OLD (incorrect)
const clientId = process.env.LINKEDIN_CLIENT_ID;

// NEW (correct)
const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
```

### 2. Improved Error Handling and Logging

Added detailed logging for debugging:
- Token request/response details
- Profile request/response details  
- Better error message parsing
- Environment variable validation

### 3. Updated to OpenID Connect Specification

Based on [Microsoft's LinkedIn OpenID Connect documentation](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2?context=linkedin%2Fconsumer%2Fcontext):

#### Required Scopes:
- `openid` - Required to indicate OIDC authentication
- `profile` - Required for lite profile (id, name, picture)  
- `email` - Required to retrieve email address

#### API Endpoints:
- **Authorization**: `https://www.linkedin.com/oauth/v2/authorization`
- **Token**: `https://www.linkedin.com/oauth/v2/accessToken`
- **User Info**: `https://api.linkedin.com/v2/userinfo`

### 4. Removed Legacy Profile API Fallback

The old implementation tried to fall back to legacy endpoints. The new version uses only the OpenID Connect `userinfo` endpoint as specified in the documentation.

## 🔧 Environment Setup Required

Create/update your `.env.local` file:

```env
# LinkedIn OAuth - OpenID Connect
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_actual_client_id_here
LINKEDIN_CLIENT_SECRET=your_actual_client_secret_here

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Supabase (if not already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

## 🔧 LinkedIn App Configuration

In your LinkedIn Developer App:

### 1. Enable OpenID Connect Product
- Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
- Select your app
- Go to **Products** tab
- Request **"Sign in with LinkedIn using OpenID Connect"** (NOT the legacy "Sign In with LinkedIn")

### 2. Configure OAuth Settings
- **Redirect URLs**: `http://localhost:3001/auth/linkedin/callback`
- **Scopes**: `openid`, `profile`, `email`

### 3. Important Notes
- Must use **"OpenID Connect"** product, not legacy product
- Redirect URL must match exactly (no trailing slash)
- All three scopes are required for the implementation to work

## 🧪 Testing the Fix

### 1. Verify Environment Variables
```bash
# Check if variables are set
echo "Client ID: $NEXT_PUBLIC_LINKEDIN_CLIENT_ID"
echo "Client Secret: $LINKEDIN_CLIENT_SECRET"
```

### 2. Restart Development Server
```bash
npm run dev -- --port 3001
```

### 3. Test OAuth Flow
1. Go to `http://localhost:3001/auth/login`
2. LinkedIn button should be visible
3. Click "Continue with LinkedIn"
4. Should redirect to LinkedIn authorization
5. After authorization, should return and create account

### 4. Check Browser Console
The updated implementation provides detailed logging:
```
LinkedIn OAuth starting with: {clientId: "78....", redirectUri: "...", scope: "openid profile email"}
Token response status: 200
Token data received: {access_token: "[PRESENT]", token_type: "Bearer", ...}
Profile response status: 200  
Profile data received: {sub: "...", email: "...", name: "..."}
Successfully fetched LinkedIn profile via OpenID Connect
```

## 🎯 Expected Response Format

The `/v2/userinfo` endpoint returns:

```json
{
  "sub": "782bbtaQ",
  "name": "John Doe", 
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://media.licdn-ei.com/dms/image/...",
  "locale": "en-US",
  "email": "doe@email.com",
  "email_verified": true
}
```

## 🐛 Troubleshooting

### Still Getting 400 Error?

1. **Check Environment Variables**:
   ```bash
   # These should return actual values, not "your_..._here"
   echo $NEXT_PUBLIC_LINKEDIN_CLIENT_ID
   echo $LINKEDIN_CLIENT_SECRET
   ```

2. **Verify LinkedIn App Configuration**:
   - Product: "Sign in with LinkedIn using OpenID Connect" ✅
   - NOT: "Sign In with LinkedIn" (legacy) ❌
   - Redirect URL: `http://localhost:3001/auth/linkedin/callback` (exact match)
   - Scopes: `openid profile email`

3. **Check Browser Network Tab**:
   - Look for POST to `/api/auth/linkedin/userinfo`
   - Check request/response details
   - Verify authorization code is being sent

4. **Common Issues**:
   - **Redirect URI mismatch**: Must match exactly in LinkedIn app
   - **Wrong product**: Must use OpenID Connect, not legacy
   - **Missing scopes**: All three scopes (`openid profile email`) required
   - **Environment variables**: Must be actual values, not placeholders

## 🎉 Success Indicators

When working correctly, you should see:

1. **LinkedIn Button Visible** on login page
2. **Successful Redirect** to LinkedIn authorization
3. **Clean Return** to callback URL  
4. **Console Logs** showing successful token exchange and profile fetch
5. **User Account Created** in your database
6. **Redirect to Dashboard** or email verification

The LinkedIn OAuth is now properly implemented using OpenID Connect specification! 🚀

## 📚 Reference

- [LinkedIn OpenID Connect Documentation](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2?context=linkedin%2Fconsumer%2Fcontext)
- LinkedIn Developer Console: https://www.linkedin.com/developers/apps 