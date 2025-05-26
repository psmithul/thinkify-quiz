# LinkedIn OAuth Test Guide 🔧

## 🚨 Critical Configuration Required

Before testing, you **MUST** update your LinkedIn app configuration:

### 1. Update LinkedIn App Redirect URIs

Go to [LinkedIn Developer Console](https://www.linkedin.com/developers/apps) → Your App → **Auth** tab

Add **BOTH** redirect URIs:
- `http://localhost:3001/auth/linkedin/callback` (for normal login)
- `http://localhost:3001/test-linkedin` (for testing)

**Important**: These URLs must match EXACTLY (no trailing slashes, correct port)

### 2. Verify Product Configuration

Ensure you have **"Sign in with LinkedIn using OpenID Connect"** product enabled (NOT the legacy "Sign In with LinkedIn")

## 🧪 Test Method 1: Debug Test Page

1. **Start the server:**
   ```bash
   npm run dev -- --port 3001
   ```

2. **Visit the test page:**
   ```
   http://localhost:3001/test-linkedin
   ```

3. **Follow the test steps:**
   - Click "Start LinkedIn OAuth Test"
   - Complete LinkedIn authorization
   - Automatically returns with auth code
   - Click "Test Token Exchange"
   - Review detailed results

## 🧪 Test Method 2: Normal Login Flow

1. **Visit login page:**
   ```
   http://localhost:3001/auth/login
   ```

2. **Check LinkedIn button visibility:**
   - Should show "Continue with LinkedIn" button
   - If not visible, check environment variables

3. **Test OAuth flow:**
   - Click LinkedIn button
   - Complete LinkedIn authorization
   - Should redirect back and process login

## 🔍 Debug Tools

### A. Configuration Check
Run this command to verify your configuration:
```bash
node debug-linkedin.mjs
```

### B. Test API Endpoint
Test the token exchange directly:
```bash
curl -X GET http://localhost:3001/api/test-linkedin
```

### C. Environment Variables Check
```bash
# Check if variables are loaded
echo "Client ID: $NEXT_PUBLIC_LINKEDIN_CLIENT_ID"
echo "Client Secret exists: $([ -n "$LINKEDIN_CLIENT_SECRET" ] && echo "YES" || echo "NO")"
```

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid redirect_uri"
**Solution**: Add exact redirect URI to LinkedIn app settings
- Login flow: `http://localhost:3001/auth/linkedin/callback`
- Test flow: `http://localhost:3001/test-linkedin`

### Issue 2: "Invalid client_id"
**Solution**: Verify your client ID is correct:
- Expected: `865iwdnmx2n4fy`
- Check `.env.local` file

### Issue 3: LinkedIn button not visible
**Solution**: Check environment variable:
```bash
# Should return your client ID
echo $NEXT_PUBLIC_LINKEDIN_CLIENT_ID
```

### Issue 4: "Failed to exchange code for token"
**Possible causes**:
- Wrong redirect URI in LinkedIn app
- Incorrect client secret
- Code expired (codes expire quickly)

### Issue 5: "Failed to fetch LinkedIn profile"
**Possible causes**:
- Wrong product (must use OpenID Connect)
- Missing scopes (`openid profile email`)
- Token request succeeded but wrong permissions

## 📊 Expected Success Flow

### 1. Authorization Request
```
URL: https://www.linkedin.com/oauth/v2/authorization
Parameters:
- response_type: code
- client_id: 865iwdnmx2n4fy
- redirect_uri: http://localhost:3001/auth/linkedin/callback
- scope: openid profile email
- state: [random string]
```

### 2. Token Exchange
```
POST https://www.linkedin.com/oauth/v2/accessToken
Body:
- grant_type: authorization_code
- code: [authorization code]
- redirect_uri: http://localhost:3001/auth/linkedin/callback
- client_id: 865iwdnmx2n4fy
- client_secret: WPL_AP1.Zbs0nWg0clHhyAzC.t0scVw==
```

### 3. Profile Fetch
```
GET https://api.linkedin.com/v2/userinfo
Headers:
- Authorization: Bearer [access_token]
```

### 4. Expected Response
```json
{
  "sub": "user_id",
  "name": "Full Name",
  "given_name": "First",
  "family_name": "Last",
  "email": "user@example.com",
  "picture": "https://...",
  "email_verified": true
}
```

## 🎯 Step-by-Step Testing

### Phase 1: Environment Check
```bash
# 1. Verify server is running
curl -s http://localhost:3001/auth/login | grep -i linkedin

# 2. Check configuration
node debug-linkedin.mjs

# 3. Test API endpoint exists
curl -X GET http://localhost:3001/api/test-linkedin
```

### Phase 2: OAuth Authorization
1. Visit test page: `http://localhost:3001/test-linkedin`
2. Click "Start LinkedIn OAuth Test"
3. Should redirect to LinkedIn
4. After authorization, should return with code
5. Check browser console for any errors

### Phase 3: Token Exchange
1. Authorization code should auto-fill
2. Click "Test Token Exchange"
3. Check results for detailed error information
4. Review server console logs

### Phase 4: Full Login Flow
1. Visit: `http://localhost:3001/auth/login`
2. Click "Continue with LinkedIn"
3. Complete authorization
4. Should create account and redirect to dashboard

## 📋 Troubleshooting Checklist

- [ ] LinkedIn app has OpenID Connect product enabled
- [ ] Both redirect URIs added to LinkedIn app
- [ ] Client ID matches: `865iwdnmx2n4fy`
- [ ] Client secret is properly set in `.env.local`
- [ ] Server is running on port 3001
- [ ] No firewall blocking localhost:3001
- [ ] Browser allows redirects (no ad blockers blocking)
- [ ] Environment variables loaded correctly

## 🚀 Quick Test Commands

```bash
# Start server
npm run dev -- --port 3001

# Open test page
open http://localhost:3001/test-linkedin

# Check logs
tail -f dev.log

# Verify environment
cat .env.local | grep LINKEDIN
```

## 📞 Need Help?

If LinkedIn OAuth still fails after following this guide:

1. **Check server console** for detailed error messages
2. **Check browser network tab** for failed requests
3. **Verify LinkedIn app configuration** matches exactly
4. **Test with different browser** to rule out cache issues
5. **Ensure no proxy/VPN** interfering with requests

The test page at `http://localhost:3001/test-linkedin` provides detailed debugging information to help identify the specific issue.

## ✅ Success Indicators

When LinkedIn OAuth is working correctly:

1. ✅ LinkedIn button visible on login page
2. ✅ Redirect to LinkedIn authorization works
3. ✅ Return from LinkedIn with authorization code
4. ✅ Token exchange succeeds (status 200)
5. ✅ Profile fetch succeeds (gets user data)
6. ✅ User account created in database
7. ✅ Redirect to dashboard or email verification

---

**Note**: LinkedIn authorization codes expire quickly (usually within 10 minutes), so test the complete flow promptly after getting the code.