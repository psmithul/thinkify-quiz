-- Database Migration: Add phone field to users table
-- This ensures the phone field exists for the enhanced profile completion system

-- Add phone column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add profile_image column if it doesn't exist (for LinkedIn profile pictures)
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Verify the schema includes all required fields for profile completion
DO $$
BEGIN
    -- Check if all required fields exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name IN ('full_name', 'bio', 'job_title', 'location', 'company', 'linkedin_url', 'phone', 'profile_image')
        GROUP BY table_name
        HAVING COUNT(*) = 8
    ) THEN
        RAISE NOTICE 'Warning: Not all required profile fields exist in users table. Please check schema.';
    ELSE
        RAISE NOTICE 'Success: All required profile fields exist in users table.';
    END IF;
END $$;

-- Optional: Add constraints for data quality (uncomment if desired)
-- ALTER TABLE users ADD CONSTRAINT check_full_name_length CHECK (full_name IS NULL OR length(trim(full_name)) >= 2);
-- ALTER TABLE users ADD CONSTRAINT check_job_title_length CHECK (job_title IS NULL OR length(trim(job_title)) >= 2);
-- ALTER TABLE users ADD CONSTRAINT check_location_length CHECK (location IS NULL OR length(trim(location)) >= 2);
-- ALTER TABLE users ADD CONSTRAINT check_bio_length CHECK (bio IS NULL OR length(trim(bio)) >= 10);
-- ALTER TABLE users ADD CONSTRAINT check_company_length CHECK (company IS NULL OR length(trim(company)) >= 2);
-- ALTER TABLE users ADD CONSTRAINT check_linkedin_format CHECK (linkedin_url IS NULL OR linkedin_url ~* '^https://(www\.)?linkedin\.com/in/[a-zA-Z0-9-]+/?$');
-- ALTER TABLE users ADD CONSTRAINT check_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$'); 