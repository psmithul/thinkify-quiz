# Role-Based Access System

This document outlines the role-based access system implemented in the Thinkify Quiz application, including separate login paths for creators and users, profile management, and role-specific features.

## Features Implemented

### 1. Separate Creator Login & Registration

We've implemented dedicated authentication flows for creators:

- **Creator Login**: `/auth/creator-login`
  - Specialized login page for creators
  - Validates that the user has creator role before granting access
  - Redirects directly to creator dashboard

- **Creator Signup**: `/auth/creator-signup`
  - Dedicated registration form for creators
  - Collects additional information including bio
  - Sets role to 'creator' in the database
  - Includes fields for profile image and full name

### 2. User Profile Management

- **User Profile Page**: `/user/profile`
  - Allows regular users to update their basic information
  - Includes full name and profile image fields
  - Simple, focused interface for users

- **Creator Profile Management**: `/creator/profile`
  - Enhanced profile page for creators
  - Includes bio field for creators to describe their expertise
  - Profile information is displayed on creator listings

### 3. Role-Based Navigation

The application now features role-specific navigation in the header:

- **User Navigation**:
  - My Quizzes (Dashboard)
  - My Profile
  - Sign Out

- **Creator Navigation**:
  - Creator Dashboard
  - My Creator Profile
  - Sign Out

- **Admin Navigation**:
  - Admin Dashboard
  - Sign Out

### 4. Role-Based Access Control

- **Route Protection**: 
  - Users cannot access creator or admin pages
  - Creators cannot access admin pages
  - Automatic redirects to appropriate dashboards

- **Smart Redirects**:
  - After login, users are directed to the appropriate dashboard based on role
  - Unauthorized access attempts are redirected to the proper area

## Database Structure

The user role is stored in the `users` table with the following possible values:
- `user`: Regular quiz taker
- `creator`: Quiz creator with publishing abilities
- `admin`: Administrator with full system access

## Authentication Flow

1. User selects the appropriate login/signup path (regular or creator)
2. Authentication is performed via Supabase
3. User role is checked and stored in the application context
4. User is redirected to the appropriate dashboard
5. Navigation and accessible features are determined by the user's role

## How to Test

1. Create a regular user account at `/auth/signup`
2. Create a creator account at `/auth/creator-signup`
3. Login with each account type to observe different experiences
4. Try accessing `/creator/dashboard` as a regular user (should redirect)
5. Update profiles for both user types 

# Role-Based Access Setup

This document explains how to set up the role-based access control for the quiz application.

## Database Structure

The application uses two primary roles:
- **user**: Regular users who can take quizzes
- **creator**: Users who can create and manage quizzes

## Required Database Setup

To ensure the application works correctly, the following database setup is required:

### 1. Users Table Structure

The `users` table needs the following columns:
- `id` (UUID, primary key) - This links to Supabase Auth
- `email` (text)
- `role` (text) - Can be 'user' or 'creator'
- `full_name` (text) - User's full name
- `bio` (text) - Creator's biography
- `profile_image` (text) - URL to the profile image

### 2. Quizzes Table Structure

The `quizzes` table needs the following columns:
- `id` (UUID, primary key)
- `title` (text)
- `description` (text)
- `creator_id` (UUID, foreign key to users.id)
- `is_published` (boolean)
- `price` (numeric) - Optional
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Setup Steps

1. **Run SQL Scripts**:
   Execute the SQL script in `sql/add_creator_id.sql` to add the creator_id column to the quizzes table and set up the RLS policies.

2. **Create Additional Columns**:
   If your users table doesn't have the necessary columns, run the following SQL:

   ```sql
   -- Add missing columns to users table if needed
   ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS full_name TEXT,
   ADD COLUMN IF NOT EXISTS bio TEXT,
   ADD COLUMN IF NOT EXISTS profile_image TEXT,
   ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
   
   -- Ensure role is one of the valid values
   ALTER TABLE users 
   ADD CONSTRAINT check_role CHECK (role IN ('user', 'creator', 'admin'));
   
   -- Add RLS policies for users
   CREATE POLICY "Users can view other users profiles" 
   ON users FOR SELECT 
   TO authenticated 
   USING (true);
   
   CREATE POLICY "Users can update their own profile" 
   ON users FOR UPDATE 
   TO authenticated 
   USING (id = auth.uid());
   ```

3. **Environment Variables**:
   Ensure your `.env.local` file contains the Supabase URL and API key:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Troubleshooting

If you encounter 400 Bad Request errors when accessing quizzes, check:

1. The `creator_id` column exists in the `quizzes` table
2. Row Level Security (RLS) policies are correctly set up
3. The Supabase client is correctly authenticated
4. The user has the correct role ('creator' or 'admin') to access creator features

## Development Notes

- New quizzes should automatically set the `creator_id` to the current user's ID
- The creator dashboard only shows quizzes created by the current user
- Public creator profiles show only published quizzes 