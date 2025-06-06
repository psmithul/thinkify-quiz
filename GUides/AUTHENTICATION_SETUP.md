# Authentication Setup Guide

This guide will help you set up authentication for the Thinkify Quiz app, including both regular email/password signup and LinkedIn OAuth.

## Recent Fixes & Improvements ✨

### ✅ What's Been Fixed
- **LinkedIn OAuth Integration**: Full working implementation with proper user profile creation
- **Enhanced Error Handling**: Better error messages and debugging capabilities
- **User Profile Management**: Automatic profile creation and updates from LinkedIn data
- **Role-based Redirects**: Users are redirected to appropriate dashboards based on their role
- **Form Validation**: Comprehensive client-side validation with helpful error messages
- **Debug Utilities**: Built-in debugging tools for development (visible in development mode)
- **Authentication Middleware**: Automatic route protection and session management

### 🔧 New Features
- **Debug Mode**: In development, you'll see a debug panel with real-time authentication status
- **Enhanced Logging**: Detailed console logs help identify issues during signup/login
- **Validation Helpers**: Better form validation with specific error messages
- **Middleware Protection**: Automatic redirection for protected routes

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Optional: For production deployments
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

## Supabase Setup

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key from Settings > API

### 2. Database Setup
Run the database migration script in your Supabase SQL editor:
```sql
-- This should already be done if you've run the setup scripts
-- Check docs/database/complete_setup.sql for the full schema
```

### 3. Configure Authentication

#### Enable Email Authentication
1. Go to Authentication > Settings in your Supabase dashboard
2. Enable email authentication
3. Configure email templates if needed
4. **Important**: Set "Enable email confirmations" based on your preference:
   - **Disabled**: Users can sign in immediately (better for development)
   - **Enabled**: Users must verify email before signing in (better for production)

#### Enable LinkedIn OAuth (Optional but Recommended)
1. Create a LinkedIn app at [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. In your LinkedIn app settings:
   - **Product**: Select "Sign In with LinkedIn using OpenID Connect"
   - **Auth 2.0 settings**: 
     - Add redirect URL: `http://localhost:3001/auth/linkedin/callback` (for development)
     - Add redirect URL: `https://yourdomain.com/auth/linkedin/callback` (for production)
   - **OpenID Connect**: Request scopes: `openid`, `profile`, `email`

3. In Supabase dashboard:
   - Go to Authentication > Providers
   - Enable LinkedIn provider
   - Add your LinkedIn Client ID and Client Secret
   - **Important**: Set redirect URL to: `https://yourproject.supabase.co/auth/v1/callback`

### 4. Row Level Security (RLS)
The app includes RLS policies for secure data access. These should be automatically applied:

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to read other users' profiles
CREATE POLICY "Users can view other users profiles" 
ON users FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (id = auth.uid());

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (id = auth.uid());

-- Allow public insert for signup (important!)
CREATE POLICY "Allow public insert for signup" 
ON users FOR INSERT 
TO anon 
WITH CHECK (true);
```

## Testing Authentication

### 1. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3001`

### 2. Test Email Signup
1. Navigate to `/auth/signup`
2. Fill out the form with valid details:
   - **Email**: Use a real email address
   - **Password**: At least 6 characters
   - **Full Name**: At least 2 characters
   - **Accept Terms**: Must be checked
3. Submit the form
4. **If email confirmation is enabled**: Check your email and click the verification link
5. **If email confirmation is disabled**: You'll be automatically signed in
6. Verify user is created in Supabase dashboard under Authentication > Users

### 3. Test LinkedIn OAuth
1. Ensure LinkedIn provider is configured in Supabase
2. Navigate to `/auth/login` or `/auth/signup`
3. Click "Continue with LinkedIn"
4. **Important**: Make sure you're using the correct domain in your LinkedIn app settings
5. Complete LinkedIn authorization
6. Verify user profile is created/updated in Supabase dashboard

### 4. Test Authentication Flow
1. Try accessing protected routes like `/user/dashboard` without being logged in
2. You should be redirected to `/auth/login`
3. After successful login, you should be redirected back to the intended page
4. Test logout and ensure you can't access protected routes

## Debugging Features

### Development Debug Panel
When running in development mode (`npm run dev`), you'll see a debug panel at the top of auth pages that shows:
- Real-time authentication status
- Button to download detailed debug logs
- Console logging for all authentication events

### Console Logging
Open browser developer tools to see detailed logs:
- ✅ Success events (green checkmarks)
- ❌ Error events (red X marks)
- Detailed authentication flow information
- Environment variable validation
- Database connection tests

### Debug Log Download
Click "Download Debug Log" in the debug panel to get a JSON file with:
- All authentication events
- Error details
- User agent and URL information
- Timestamps for debugging

## Troubleshooting

### Common Issues

**Issue**: "Invalid API key" or environment variable errors
**Solution**: 
1. Check that `.env.local` exists and has correct values
2. Restart the development server after changing environment variables
3. Check Supabase dashboard for correct URL and keys

**Issue**: LinkedIn OAuth fails with "redirect_uri_mismatch"
**Solution**: 
1. Verify LinkedIn app redirect URLs match exactly (no trailing slashes)
2. For local development: `http://localhost:3001/auth/linkedin/callback`
3. For production: `https://yourdomain.com/auth/linkedin/callback`
4. Check Supabase auth provider redirect URL

**Issue**: User profile not created after signup
**Solution**: 
1. Check Supabase dashboard for RLS policy errors
2. Ensure "Allow public insert for signup" policy exists
3. Look at browser console for detailed error messages
4. Download debug log for analysis

**Issue**: Email confirmation not working
**Solution**: 
1. Check email spam/junk folder
2. Verify email templates in Supabase dashboard
3. Test with email confirmation disabled first
4. Check Supabase logs for email delivery issues

**Issue**: Redirect fails after authentication
**Solution**: 
1. Verify dashboard pages exist (`/user/dashboard`, `/creator/dashboard`, `/admin/dashboard`)
2. Check that user role is properly set in database
3. Look for middleware errors in console

### Advanced Debugging

**Check Environment Variables:**
```javascript
// In browser console
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Supabase Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 10) + '...')
```

**Test Supabase Connection:**
```javascript
// In browser console on auth pages
authDebugger.testSupabaseConnection()
authDebugger.testDatabaseConnection()
```

**Manual User Creation Test:**
```sql
-- In Supabase SQL editor
INSERT INTO users (id, email, full_name, role) 
VALUES ('test-id', 'test@example.com', 'Test User', 'user');
```

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique passwords for Supabase service keys
- Regularly rotate API keys in production
- Monitor authentication logs in Supabase dashboard
- Ensure RLS policies are properly configured
- Test authentication flows in incognito/private browsing mode

## Production Deployment

When deploying to production:

1. **Environment Variables**: Update all environment variables in your hosting platform
2. **LinkedIn Configuration**: Update LinkedIn app redirect URLs to production domains
3. **Supabase Settings**: Update auth settings for production domain
4. **Email Settings**: Configure proper email templates and SMTP settings
5. **Rate Limiting**: Enable authentication rate limiting in Supabase
6. **SSL/HTTPS**: Ensure all URLs use HTTPS in production
7. **Testing**: Test all authentication flows thoroughly in production environment

## Next Steps

After authentication is working:
1. Test user roles and permissions
2. Set up proper email templates in Supabase
3. Configure additional OAuth providers if needed
4. Set up user profile management features
5. Implement proper error boundaries for authentication errors

## Getting Help

If you're still experiencing issues:
1. Check the debug logs and console output
2. Download the debug report for detailed analysis
3. Review Supabase dashboard logs
4. Check this guide for similar issues
5. Ensure all environment variables are correctly set 