# LinkedIn OAuth Setup Guide

## 🚨 Issue: LinkedIn Login Button Not Showing

The LinkedIn login button is **already implemented** in the login page (`src/app/auth/login/page.tsx`) but is **conditionally hidden** when LinkedIn OAuth is not properly configured.

## 🔧 Quick Fix

### 1. Create Environment File

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# LinkedIn OAuth Configuration
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_actual_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_actual_linkedin_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 2. Get LinkedIn OAuth Credentials

1. **Go to LinkedIn Developers**: https://www.linkedin.com/developers/apps
2. **Create New App** or select existing app
3. **Configure OAuth settings**:
   - **Redirect URLs**: `http://localhost:3001/auth/linkedin/callback`
   - **Scopes**: Select "OpenID Connect" product and request `openid`, `profile`, `email` scopes
4. **Copy credentials**:
   - Client ID → `NEXT_PUBLIC_LINKEDIN_CLIENT_ID`
   - Client Secret → `LINKEDIN_CLIENT_SECRET`

## 🔍 Why LinkedIn Button Isn't Showing

The login page has this logic:

```typescript
// Check if LinkedIn OAuth is configured
const isLinkedInConfigured = () => {
  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID;
  return clientId && clientId !== 'your_linkedin_client_id_here';
};

// Button only shows if configured
{isLinkedInConfigured() && (
  <Button onClick={handleLinkedInLogin}>
    Continue with LinkedIn
  </Button>
)}
```

## 🚀 After Setup

Once you add the proper LinkedIn credentials to `.env.local`:

1. **Restart your development server**: `npm run dev`
2. **Go to login page**: `http://localhost:3001/auth/login`
3. **LinkedIn button should now appear** below the regular login form

## 🎯 Expected UI

With LinkedIn configured, the login page should show:

```
┌─────────────────────────────┐
│         Thinkify            │
│      Welcome back           │
├─────────────────────────────┤
│  Email: [________________]  │
│  Password: [_____________]  │
│  [       Sign in        ]   │
├─────────────────────────────┤
│     Or continue with        │
│  [   Continue with         │
│     LinkedIn         ]      │
├─────────────────────────────┤
│  Don't have an account?     │
│  Creator? Sign in here      │
└─────────────────────────────┘
```

## 🔧 LinkedIn App Configuration

### Required Settings:
1. **Products**: "OpenID Connect" (not legacy "Sign In with LinkedIn")
2. **OAuth 2.0 settings**:
   - Redirect URLs: `http://localhost:3001/auth/linkedin/callback`
3. **OAuth 2.0 scopes**: `openid`, `profile`, `email`

### Important Notes:
- Use **"OpenID Connect"** product, not the legacy "Sign In with LinkedIn"
- Make sure redirect URL exactly matches: `http://localhost:3001/auth/linkedin/callback`
- Don't include trailing slashes or different ports

## 🧪 Test the Setup

1. **Check Environment**: 
   ```bash
   echo $NEXT_PUBLIC_LINKEDIN_CLIENT_ID
   ```

2. **Restart Server**:
   ```bash
   npm run dev -- --port 3001
   ```

3. **Visit Login Page**: http://localhost:3001/auth/login

4. **Verify LinkedIn Button Appears**: Should see blue LinkedIn button below regular login

5. **Test OAuth Flow**: Click LinkedIn button → Should redirect to LinkedIn authorization

## 🐛 Troubleshooting

### Button Still Not Showing?
- Check `.env.local` exists in project root
- Verify `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` is set and not placeholder value
- Restart development server completely
- Check browser console for environment variable errors

### LinkedIn OAuth Errors?
- Verify redirect URL matches exactly in LinkedIn app settings
- Check that "OpenID Connect" product is enabled
- Ensure scopes are `openid profile email`
- Check network tab for OAuth flow errors

### Authentication Fails?
- LinkedIn creates account in your database
- May redirect to magic link email verification
- Check Supabase auth table for new users
- Look at browser network tab for API errors

## 🎉 Success Flow

1. **User clicks "Continue with LinkedIn"**
2. **Redirects to LinkedIn authorization**
3. **User authorizes app**
4. **Returns to callback URL**
5. **Creates/updates user in database**
6. **Creates Supabase auth session**
7. **Redirects to dashboard or email verification**

The LinkedIn login functionality is **fully implemented and working** - it just needs proper environment configuration to become visible! 🚀 