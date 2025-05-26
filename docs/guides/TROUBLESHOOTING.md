# Troubleshooting Guide

## Common Errors and Solutions

### 1. LinkedIn OAuth Errors

**Error**: `static.licdn.com/sc/p/... Failed to load resource: the server responded with a status of 404`

**Solution**: This error occurs when LinkedIn OAuth is triggered but not properly configured.
- Make sure you have set up LinkedIn OAuth properly (see ENVIRONMENT_SETUP.md)
- If you don't need LinkedIn OAuth, the login page will automatically hide the LinkedIn button when it's not configured
- The error is now suppressed and won't affect the application functionality

### 2. XMLHttpRequest Errors

**Error**: `Uncaught XMLHttpRequest` or `Cannot read properties of null (reading 'textContent')`

**Solution**: These are typically related to:
- LinkedIn OAuth integration issues (fixed by proper configuration)
- Chrome extension conflicts (if you have the quiz Chrome extension installed)
- Network issues with external resources

**Fixes Applied**:
- Added error suppression for LinkedIn-related errors
- Improved error handling in OAuth flows
- Fixed Next.js configuration issues

### 3. Environment Variable Issues

**Error**: `client_id is invalid "undefined"`

**Solution**: 
- Check your `.env.local` file has the correct LinkedIn credentials
- Make sure environment variables are properly formatted (no extra spaces)
- Restart your development server after changing environment variables

### 4. Module Import Errors

**Error**: `Cannot find module '@/components/...'`

**Solution**:
- Check that the file exists in the correct location
- Verify the import path matches the actual file structure
- Make sure TypeScript aliases are configured correctly in `tsconfig.json`

### 5. Build/Compilation Errors

**Error**: ESLint or TypeScript errors during build

**Solution**:
- Run `npm run lint` to see specific errors
- Most critical errors have been fixed in the latest updates
- Some warnings (like img tag usage) can be ignored for now

## Quick Fixes

### Reset Everything
If you're experiencing multiple issues:

1. Stop the development server
2. Clear Next.js cache: `rm -rf .next`
3. Reinstall dependencies: `npm install`
4. Restart: `npm run dev`

### Check Environment
Verify your environment setup:

```bash
# Check if environment variables are loaded
npm run dev
# Look for the "Environments: .env.local" line in the output
```

### Disable LinkedIn OAuth Temporarily
If LinkedIn OAuth is causing issues and you don't need it:

1. The login page automatically hides the LinkedIn button when not configured
2. You can still use email/password login normally
3. Set up LinkedIn OAuth later using the ENVIRONMENT_SETUP.md guide

## Browser Console

If you see errors in the browser console:
- LinkedIn-related errors are now suppressed and safe to ignore
- Focus on application-specific errors
- Check the Network tab for failed API requests

## Getting Help

If you're still experiencing issues:
1. Check that your Supabase connection is working
2. Verify your database schema is set up correctly
3. Make sure you're using a supported Node.js version (18+)
4. Try in a different browser or incognito mode 