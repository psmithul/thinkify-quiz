# Database Schema Fix for LinkedIn OAuth

## 🚨 Issue: "Could not find the 'created_at' column of 'users' in the schema cache"

The LinkedIn OAuth integration is trying to insert `created_at` and `updated_at` fields into the users table, but these columns don't exist in the current database schema.

## ✅ Solution: Update Database Schema

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the Database Migration

Copy and paste the following SQL into the SQL Editor and click **Run**:

```sql
-- Fix users table by adding missing columns for LinkedIn OAuth integration

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Update existing users to have timestamps if they don't already
UPDATE users 
SET 
  created_at = COALESCE(created_at, now()),
  updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Make created_at and updated_at NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN created_at SET NOT NULL,
ALTER COLUMN updated_at SET NOT NULL;

-- Add a trigger to automatically update updated_at when records are modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add role constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_role'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT check_role CHECK (role IN ('user', 'creator', 'admin'));
    END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_linkedin_url ON users(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
```

### Step 3: Verify the Migration

After running the SQL, verify it worked by running this query:

```sql
-- Check the users table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
```

You should see these columns:
- `id` (uuid)
- `email` (character varying)
- `role` (text)
- `full_name` (text)
- `bio` (text)
- `profile_image` (text)
- `linkedin_url` (text)
- `created_at` (timestamp with time zone)
- `updated_at` (timestamp with time zone)

### Step 4: Test LinkedIn OAuth

1. Restart your development server:
   ```bash
   npm run dev -- --port 3001
   ```

2. Go to `http://localhost:3001/auth/login`
3. Click "Continue with LinkedIn"
4. Complete the LinkedIn OAuth flow

## 🔧 What This Fix Does

1. **Adds Missing Columns**: Creates `created_at`, `updated_at`, `full_name`, `bio`, `profile_image`, and `linkedin_url` columns
2. **Sets Default Values**: Existing users get current timestamp for created_at/updated_at
3. **Adds Auto-Update Trigger**: The `updated_at` field automatically updates when records are modified
4. **Improves Performance**: Adds database indexes for faster queries
5. **Adds Constraints**: Ensures role field only accepts valid values

## 🎯 Expected Result

After running this migration:
- LinkedIn OAuth will work without database errors
- Users will have proper timestamps and profile fields
- The database will automatically maintain updated_at timestamps
- Better performance for user-related queries

## 🚨 Troubleshooting

If you get permission errors:
1. Make sure you're logged into the correct Supabase project
2. Ensure your account has admin access to the project
3. Try running the SQL commands one section at a time

If the migration fails:
1. Check the Supabase logs for specific error details
2. Make sure no other applications are modifying the users table during migration
3. Contact support if you continue to have issues 