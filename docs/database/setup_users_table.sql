-- Add missing columns to users table if needed
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Ensure role is one of the valid values
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_role'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT check_role CHECK (role IN ('user', 'creator', 'admin'));
    END IF;
END
$$;

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add RLS policies if they don't already exist
DO $$
BEGIN
    -- Users can view other users profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view other users profiles'
    ) THEN
        CREATE POLICY "Users can view other users profiles" 
        ON users FOR SELECT 
        TO authenticated 
        USING (true);
    END IF;

    -- Users can update their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON users FOR UPDATE 
        TO authenticated 
        USING (id = auth.uid());
    END IF;

    -- Users can insert their own profile
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON users FOR INSERT 
        TO authenticated 
        WITH CHECK (id = auth.uid());
    END IF;

    -- Service role can insert any user profile (for admin/signup functions)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Service role can manage all users'
    ) THEN
        CREATE POLICY "Service role can manage all users" 
        ON users 
        TO service_role
        USING (true);
    END IF;
    
    -- Allow public (unauthenticated) access to insert initial user records
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public insert for signup'
    ) THEN
        CREATE POLICY "Allow public insert for signup" 
        ON users FOR INSERT 
        TO anon
        WITH CHECK (true);
    END IF;
END
$$;

-- Update user roles for testing
-- Uncomment and modify these statements for your test users
-- UPDATE users SET role = 'creator' WHERE id = 'your-creator-user-id';
-- UPDATE users SET role = 'admin' WHERE id = 'your-admin-user-id'; 