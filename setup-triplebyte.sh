#!/bin/bash

# Triplebyte Quiz Setup Script
# This script helps you set up the Triplebyte Programming Assessment quickly

echo "🚀 Setting up Triplebyte Programming Assessment Quiz..."
echo "================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local file not found!"
    echo "📝 Creating sample .env.local file..."
    
    cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# LinkedIn OAuth (Optional)
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
EOL

    echo "📝 Sample .env.local created. Please fill in your actual values:"
    echo "   1. Get Supabase keys from your Supabase dashboard"
    echo "   2. Generate a secure NEXTAUTH_SECRET"
    echo "   3. Add LinkedIn OAuth credentials if needed"
    echo ""
    echo "📖 Read TRIPLEBYTE_SETUP_GUIDE.md for detailed instructions"
    exit 1
else
    echo "✅ .env.local file found"
fi

# Check if the key environment variables are set
source .env.local

if [[ "$NEXT_PUBLIC_SUPABASE_URL" == "your_supabase_project_url" ]] || 
   [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == "your_supabase_anon_key" ]] || 
   [[ "$SUPABASE_SERVICE_ROLE_KEY" == "your_supabase_service_role_key" ]]; then
    echo "⚠️  Please update your .env.local file with actual Supabase credentials"
    echo "📖 Check TRIPLEBYTE_SETUP_GUIDE.md for setup instructions"
    exit 1
fi

echo "✅ Environment variables configured"

# Start the development server
echo "🚀 Starting development server..."
echo ""
echo "🎯 What to do next:"
echo "   1. Visit http://localhost:3000"
echo "   2. Set up your database at /admin/setup-database"
echo "   3. Run the Triplebyte SQL script in your Supabase dashboard"
echo "   4. Check out the Triplebyte quiz at /browse"
echo ""
echo "📖 For detailed instructions, see: TRIPLEBYTE_SETUP_GUIDE.md"
echo ""

# Start the server
npm run dev 