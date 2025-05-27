#!/bin/bash

# Load environment variables
source .env.local

# Run the database migration
echo "Running database schema migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set."
    echo "Please make sure .env.local contains your Supabase database URL."
    exit 1
fi

# Run the SQL migration
psql "$DATABASE_URL" -f sql/fix-database-schema.sql

# Check if migration was successful
if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
    echo ""
    echo "The following changes have been applied:"
    echo "  • Added missing columns to quiz_attempts table"
    echo "  • Created follows table for user following functionality"
    echo "  • Added tier_thresholds column to quizzes table"
    echo "  • Created recruiters table with sample data"
    echo "  • Added appropriate RLS policies"
    echo ""
    echo "Next steps:"
    echo "1. Test the application to ensure everything works"
    echo "2. Check the admin recruiters page at /admin/recruiters"
    echo "3. Verify company shortlist shows recruiters correctly"
else
    echo "❌ Database migration failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi 