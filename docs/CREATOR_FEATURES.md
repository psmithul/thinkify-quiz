# Creator Features Implementation Guide

This document explains the new creator features implemented in the quiz application.

## New Features

1. **Creator Role Registration**
   - Users can now sign up as creators through the login screen
   - Added a checkbox option on the signup page to register as a creator
   - Creator role is stored in the users table

2. **Creators Listing Page**
   - Updated the `/creators` page to display all quiz creators
   - Shows creator profiles with name, bio, and quiz count
   - Users can click to view each creator's profile and quizzes

3. **Dummy Quiz Data**
   - Created a script to generate test creators and quizzes
   - Each quiz comes with 5 sample questions
   - Includes various quiz categories and question types

## How to Use

### Setting Up Creator Account

1. Go to the signup page
2. Fill in your details including email and password
3. Check the "Sign up as a quiz creator" checkbox
4. Click "Sign up"
5. You'll be redirected to the creator dashboard

### Generating Dummy Data

1. Make sure your Supabase environment variables are set in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
   ```

2. Run the dummy data creation script:
   ```
   npm run create-dummy-data
   ```

3. This will create:
   - 3 creator accounts with profiles
   - 4 quiz templates with 5 questions each
   - Quiz categories: JavaScript, React, CSS, and Node.js

### Viewing Creators

1. Navigate to the `/creators` page
2. Browse through the list of creators
3. Click on a creator to view their profile and quizzes

## Implementation Details

1. Modified the signup form in `/src/app/auth/signup/page.tsx` to include:
   - Creator role option
   - Full name field
   - Direct Supabase authentication

2. The creators listing page at `/src/app/creators/page.tsx` shows:
   - Creator profiles
   - Quiz counts
   - Link to detailed profiles

3. Created a script at `/scripts/create-dummy-quizzes.js` to generate:
   - Test creator accounts
   - Sample quizzes with questions
   - Different quiz types and categories

4. Added a new npm script to package.json:
   ```
   "create-dummy-data": "node scripts/create-dummy-quizzes.js"
   ```

## Testing

To test the creator features:

1. Sign up as a creator
2. Create a quiz from the creator dashboard
3. View your creator profile
4. View the creators listing page to see your profile
5. Generate dummy data to populate the application with test content 