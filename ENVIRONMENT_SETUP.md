# Environment Setup Guide

## Required Environment Variables

To properly configure the Thinkify Quiz Platform, you need to set up the following environment variables in your `.env.local` file:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### LinkedIn OAuth Configuration
```
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_app_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_app_client_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Authentication
```
NEXTAUTH_SECRET=your_random_secret_string
NEXTAUTH_URL=http://localhost:3000
```

## How to Set Up LinkedIn OAuth

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new application
3. In the "Auth" tab, add redirect URL: `http://localhost:3000/auth/linkedin/callback`
4. Copy the Client ID and Client Secret to your `.env.local` file
5. Enable the following permissions:
   - `r_liteprofile` (for basic profile info)
   - `r_emailaddress` (for email access)

## How to Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Go to Settings > API to find your project URL and keys
3. Copy the values to your `.env.local` file
4. Run the SQL scripts in the `sql/` directory to set up the database schema

## Common Issues

### "client_id is invalid 'undefined'"
- This means `NEXT_PUBLIC_LINKEDIN_CLIENT_ID` is not set or is set to the placeholder value
- Make sure you've replaced `your_linkedin_client_id_here` with your actual LinkedIn Client ID

### LinkedIn Login Not Working
- Check that your redirect URI in LinkedIn app settings matches exactly: `http://localhost:3000/auth/linkedin/callback`
- Ensure all required LinkedIn permissions are enabled

### Supabase Connection Issues
- Verify your Supabase URL and keys are correct
- Check that your Supabase project is active and not paused

## Development vs Production

For production deployment, update the following:
- `NEXT_PUBLIC_APP_URL` should be your production domain
- `NEXTAUTH_URL` should be your production domain
- LinkedIn redirect URI should point to your production domain
- Use production Supabase keys if using a separate production project 