# LinkedIn OAuth Setup with Supabase

This guide explains how to set up LinkedIn OAuth authentication using Supabase's built-in LinkedIn (OIDC) provider.

## Overview

We use Supabase's official LinkedIn (OIDC) provider which leverages OpenID Connect for secure authentication. This replaces the deprecated LinkedIn provider and provides better security and reliability.

## Prerequisites

- Supabase project with authentication enabled
- LinkedIn Developer account
- Production domain (for production deployment)

## Step 1: Configure LinkedIn Developer App

### 1.1 Create LinkedIn App
1. Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps)
2. Click "Create App"
3. Fill in your app details:
   - **App name**: Thinkify Quiz Platform
   - **LinkedIn Page**: Your company page
   - **App logo**: Upload your app logo

### 1.2 Add OAuth Product
1. In your LinkedIn app, go to **Products** tab
2. Find "Sign In with LinkedIn using OpenID Connect"
3. Click **Request Access**
4. Wait for approval (usually instant)

### 1.3 Configure OAuth Settings
1. Go to **Auth** tab in your LinkedIn app
2. Add redirect URIs:
   - **Development**: `http://localhost:3001/auth/linkedin/callback`
   - **Production**: `https://your-domain.vercel.app/auth/linkedin/callback`
   - **Supabase Callback**: `https://your-project-ref.supabase.co/auth/v1/callback`

### 1.4 Required OAuth Scopes
Ensure these scopes are enabled:
- `openid` (required)
- `profile` (required)  
- `email` (required)

### 1.5 Get Credentials
Copy and save:
- **Client ID**
- **Client Secret**

## Step 2: Configure Supabase

### 2.1 Enable LinkedIn (OIDC) Provider
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **LinkedIn (OIDC)** in the list
4. Toggle **Enabled** to ON
5. Enter your LinkedIn credentials:
   - **Client ID**: Your LinkedIn app client ID
   - **Client Secret**: Your LinkedIn app client secret
6. Click **Save**

### 2.2 Get Callback URL
1. In the LinkedIn (OIDC) provider settings
2. Copy the **Callback URL** (format: `https://your-project-ref.supabase.co/auth/v1/callback`)
3. Add this URL to your LinkedIn app's redirect URIs

## Step 3: Environment Configuration

Add these variables to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

For production, update `NEXT_PUBLIC_APP_URL` to your production domain.

## Step 4: Implementation Details

### 4.1 Login Implementation
```typescript
// Login with LinkedIn OIDC
async function handleLinkedInLogin() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin_oidc',
    options: {
      redirectTo: `${window.location.origin}/auth/linkedin/callback`,
      scopes: 'openid profile email'
    }
  });
}
```

### 4.2 Callback Handling
The app handles callbacks in two ways:
1. **Custom handler** at `/auth/linkedin/callback` for UI feedback
2. **Supabase handler** at `/auth/callback` for session management

### 4.3 User Profile Integration
After successful authentication, the app:
1. Exchanges code for session using `supabase.auth.exchangeCodeForSession()`
2. Updates user profile in the `users` table
3. Redirects to dashboard

## Step 5: Testing

### 5.1 Development Testing
1. Start development server: `npm run dev`
2. Navigate to `/auth/login`
3. Click "Continue with LinkedIn"
4. Authorize the app
5. Verify redirect to dashboard

### 5.2 Production Testing
1. Deploy to production
2. Update LinkedIn app redirect URIs
3. Test full authentication flow
4. Monitor logs for errors

## Troubleshooting

### Common Issues

**Error: "Invalid redirect URI"**
- Ensure redirect URI in LinkedIn app matches exactly
- Check both custom and Supabase callback URLs are added
- Verify protocol (http vs https)

**Error: "OAuth state mismatch"**
- Clear browser cache and cookies
- Ensure secure connection in production
- Check for URL encoding issues

**Error: "Missing scopes"**
- Verify required scopes are enabled in LinkedIn app
- Check if OpenID Connect product is approved
- Ensure scope string format is correct

**Error: "Code exchange failed"**
- Check Supabase configuration
- Verify environment variables
- Monitor Supabase auth logs

### Debug Steps
1. Check browser developer console for errors
2. Monitor Supabase auth logs
3. Verify LinkedIn app configuration
4. Test with different browsers/incognito mode

## Security Considerations

### PKCE Flow
Supabase automatically handles PKCE (Proof Key for Code Exchange) for enhanced security.

### State Parameter
Supabase manages state parameter validation automatically.

### Token Storage
Authentication tokens are securely stored in HTTP-only cookies managed by Supabase.

### HTTPS Requirement
Production deployments must use HTTPS for OAuth security.

## Migration from Custom Implementation

If migrating from a custom LinkedIn OAuth implementation:

1. Remove custom API routes (`/api/auth/linkedin/*`)
2. Update login components to use `signInWithOAuth`
3. Replace custom callback handling with Supabase's `exchangeCodeForSession`
4. Update environment variables
5. Test authentication flow

## Production Deployment

### Vercel Environment Variables
Set these in your Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### LinkedIn App Production Configuration
1. Add production redirect URIs
2. Update app verification if required
3. Test with production credentials

## Support

For issues with:
- **Supabase**: Check [Supabase Auth docs](https://supabase.com/docs/guides/auth)
- **LinkedIn**: Review [LinkedIn OAuth docs](https://docs.microsoft.com/en-us/linkedin/)
- **This implementation**: Check application logs and error messages

---

**Note**: This implementation uses Supabase's official LinkedIn (OIDC) provider, which is the recommended approach as of 2024. The old LinkedIn provider is deprecated and will be removed. 