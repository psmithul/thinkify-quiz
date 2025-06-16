#!/bin/bash

echo "🚀 Setting up Payment Verification System..."

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "📝 Running database migrations..."

# Run the complete payment setup
echo "1. Running complete payment setup..."
supabase db push --file ./complete_payment_setup.sql

# Run the payment verification schema
echo "2. Running payment verification schema..."
supabase db push --file ./payment_verification_schema.sql

# Run the comprehensive database fixes
echo "3. Running comprehensive database fixes..."
supabase db push --file ./fix_all_database_issues.sql

# Run the storage policies fix
echo "4. Running storage policies fix..."
supabase db push --file ./fix_storage_policies.sql

echo "✅ Database setup complete!"
echo ""
echo "🔍 To verify the setup worked, check your browser console for:"
echo "   - '✅ payment_verifications table exists'"
echo "   - '✅ users table exists'"
echo "   - '✅ quizzes table exists'"
echo "   - '✅ Join query works'"
echo ""
echo "If you still see errors, check the Supabase dashboard for any missing tables or permissions." 