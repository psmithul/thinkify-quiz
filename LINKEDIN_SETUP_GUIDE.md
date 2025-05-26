# LinkedIn OAuth Setup Guide 🔗

## 🚨 **Common LinkedIn Issues & Fixes**

### Issue 1: "client_id is invalid 'undefined'"
**Cause**: Missing or incorrect LinkedIn environment variables
**Fix**: Follow the complete setup below

### Issue 2: LinkedIn OAuth 500 Errors
**Cause**: Incorrect redirect URLs or missing permissions
**Fix**: Verify LinkedIn app configuration

### Issue 3: LinkedIn Login Button Not Working
**Cause**: Missing client-side environment variables
**Fix**: Ensure `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` is set

---

## 🔧 **Complete LinkedIn Setup**

### Step 1: Create LinkedIn Application

1. **Go to LinkedIn Developers**:
   - Visit: https://www.linkedin.com/developers/apps
   - Click "Create App"

2. **Fill Application Details**:
   ```
   App name: Thinkify Quiz Platform
   LinkedIn Page: (Your company/personal page)
   App logo: (Upload a logo)
   ```

3. **Save and Continue**

### Step 2: Configure OAuth Settings

1. **Go to "Auth" Tab**:
   - In your LinkedIn app dashboard, click "Auth"

2. **Add Redirect URLs**:
   ```
   Development: http://localhost:3001/auth/linkedin/callback
   Development Alt: http://localhost:3000/auth/linkedin/callback
   Production: https://your-domain.com/auth/linkedin/callback
   ```

3. **Request OAuth Permissions**:
   - `r_liteprofile` - Basic profile information
   - `r_emailaddress` - Email address
   - Click "Update" after selecting

4. **Copy Credentials**:
   - Client ID: Copy this for `NEXT_PUBLIC_LINKEDIN_CLIENT_ID`
   - Client Secret: Copy this for `LINKEDIN_CLIENT_SECRET`

### Step 3: Environment Variables Setup

Create/update your `.env.local` file:

```env
# LinkedIn OAuth Configuration
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_actual_client_id_here
LINKEDIN_CLIENT_SECRET=your_actual_client_secret_here

# App Configuration (UPDATE PORT TO 3001)
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Authentication Secret
NEXTAUTH_SECRET=your_random_secret_here
```

### Step 4: LinkedIn App Review (If Needed)

If you need additional permissions:
1. Go to "Products" tab in LinkedIn app
2. Request "Sign In with LinkedIn"
3. Submit for review if required

---

## 🧪 **Testing LinkedIn Integration**

### Test Checklist:
- [ ] Environment variables are set
- [ ] LinkedIn app has correct redirect URLs
- [ ] Required permissions are granted
- [ ] Dev server is running on port 3001
- [ ] LinkedIn login button appears
- [ ] Login flow completes successfully

### Test URLs:
```
Login page: http://localhost:3001/auth/login
LinkedIn OAuth: http://localhost:3001/auth/linkedin/callback
```

---

## 🔍 **Common Error Messages & Fixes**

### Error: "client_id is invalid 'undefined'"
```bash
# Check your .env.local file
cat .env.local | grep LINKEDIN

# Should show:
# NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_actual_id
# LINKEDIN_CLIENT_SECRET=your_actual_secret
```

### Error: "redirect_uri_mismatch"
- Go to LinkedIn app > Auth tab
- Add exact URL: `http://localhost:3001/auth/linkedin/callback`
- Save changes

### Error: "invalid_scope"
- Go to LinkedIn app > Products tab
- Ensure "Sign In with LinkedIn" is added
- Wait for approval if needed

### Error: LinkedIn button not showing
- Check browser console for JavaScript errors
- Verify `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` is set
- Restart dev server after adding env vars

---

## 🚀 **Production Deployment**

### Update Environment Variables:
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXTAUTH_URL=https://your-domain.com
```

### Update LinkedIn App:
1. Add production redirect URL: `https://your-domain.com/auth/linkedin/callback`
2. Update app URL to your domain
3. Submit for review if using additional permissions

---

## 🆘 **Troubleshooting Steps**

1. **Restart Dev Server**: After changing `.env.local`
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Clear Browser Cache**: LinkedIn OAuth can be cached

3. **Check Network Tab**: Look for failed API calls

4. **Verify Environment**: 
   ```bash
   echo $NEXT_PUBLIC_LINKEDIN_CLIENT_ID
   ```

5. **Check LinkedIn App Status**: Ensure app is not restricted

---

## ✅ **Working Configuration Example**

Your `.env.local` should look like this:
```env
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=86xyz123abc456
LINKEDIN_CLIENT_SECRET=AbC123XyZ789
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=random-32-character-string-here
```

LinkedIn app settings:
- Redirect URL: `http://localhost:3001/auth/linkedin/callback`
- Permissions: `r_liteprofile`, `r_emailaddress`
- Status: Active

---

## 🎯 **Quick Fix Summary**

1. **Create LinkedIn app** at linkedin.com/developers
2. **Set redirect URL** to `http://localhost:3001/auth/linkedin/callback`
3. **Copy Client ID & Secret** to `.env.local`
4. **Restart dev server**
5. **Test login flow**

That's it! LinkedIn OAuth should now work properly. 🎉 