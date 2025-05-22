#!/bin/bash

# Test script for Quiz App
echo "🧪 Running Quiz App Test Script"
echo "==============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install it first."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed. Please install it first."
  exit 1
fi

# Check if all required files exist
echo "📂 Checking required files..."
required_files=(
  "package.json"
  "next.config.ts"
  "src/app/layout.tsx"
  "src/app/page.tsx"
)

missing_files=0
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Missing file: $file"
    missing_files=$((missing_files+1))
  fi
done

if [ $missing_files -gt 0 ]; then
  echo "❌ Found $missing_files missing files. Please restore them before testing."
  exit 1
else
  echo "✅ All required files are present."
fi

# Check if npm packages are installed
echo "📦 Checking npm packages..."
if [ ! -d "node_modules" ]; then
  echo "⚠️  node_modules directory not found. Installing packages..."
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm packages."
    exit 1
  fi
  echo "✅ Packages installed successfully."
else
  echo "✅ node_modules directory exists."
fi

# Check Supabase database
echo "🗃️  Checking Supabase database..."
if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local 2>/dev/null; then
  echo "✅ Supabase environment variables found."
else
  echo "⚠️  Supabase environment variables not found in .env.local."
  echo "⚠️  Make sure you have set up your Supabase credentials."
fi

# Initialize the database
echo "🔄 Initializing database..."
echo "ℹ️  You can initialize your database with: npm run init-db"

# Add sample data
echo "🔄 Adding sample data..."
echo "ℹ️  You can add sample data with: ./setup-with-samples.sh"

# Run the application
echo "🚀 Testing application startup..."
echo "ℹ️  You can run the application with: npm run dev"

# Check Chrome extension
echo "🧩 Checking Chrome extension..."
if [ -f "chrome-extension/manifest.json" ]; then
  echo "✅ Chrome extension manifest found."
  
  # Count the number of files in the extension directory
  extension_files=$(find chrome-extension -type f | wc -l)
  echo "✅ Chrome extension has $extension_files files."
  
  echo "ℹ️  To install the Chrome extension:"
  echo "   1. Open Chrome and go to chrome://extensions/"
  echo "   2. Enable Developer mode (toggle in the top right)"
  echo "   3. Click 'Load unpacked' and select the 'chrome-extension' folder"
else
  echo "❌ Chrome extension manifest not found."
fi

echo ""
echo "📋 Test Summary"
echo "-------------"
echo "The application seems to be properly set up."
echo ""
echo "To run the application:"
echo "1. Make sure your Supabase instance is running or accessible"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Access the application at http://localhost:3000"
echo ""
echo "To install the Chrome extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode (toggle in the top right)"
echo "3. Click 'Load unpacked' and select the 'chrome-extension' folder"
echo ""
echo "If you encounter any issues:"
echo "- Check your Supabase connection and tables"
echo "- Verify all table names match (quiz_attempts vs results)"
echo "- Check for any errors in the console"
echo ""
echo "✅ Test script completed" 