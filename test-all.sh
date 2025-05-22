#!/bin/bash

# Comprehensive test script for the Quiz App
echo "🧪 Running Comprehensive Quiz App Test"
echo "====================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install it first."
  exit 1
fi

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Check for required files and directories
echo -e "\n${BLUE}1. Checking required files and directories...${NC}"
required_files=(
  "package.json"
  "next.config.js"
  "src/app/layout.tsx"
  "src/app/page.tsx"
  ".env.local"
)

missing_files=0
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo -e "${RED}❌ Missing file: $file${NC}"
    missing_files=$((missing_files+1))
  else
    echo -e "${GREEN}✓ Found file: $file${NC}"
  fi
done

required_dirs=(
  "src/app"
  "src/components"
  "src/lib"
  "public"
)

for dir in "${required_dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    echo -e "${RED}❌ Missing directory: $dir${NC}"
    missing_files=$((missing_files+1))
  else
    echo -e "${GREEN}✓ Found directory: $dir${NC}"
  fi
done

if [ $missing_files -gt 0 ]; then
  echo -e "${RED}❌ Found $missing_files missing files or directories.${NC}"
else
  echo -e "${GREEN}✅ All required files and directories are present.${NC}"
fi

# 2. Check Next.js configuration
echo -e "\n${BLUE}2. Checking Next.js configuration...${NC}"
if grep -q "experimental" next.config.js; then
  echo -e "${GREEN}✓ Next.js experimental features are configured.${NC}"
else
  echo -e "${YELLOW}⚠️ Next.js experimental features might not be configured.${NC}"
fi

# 3. Check environmental variables
echo -e "\n${BLUE}3. Checking environmental variables...${NC}"
if [ -f ".env.local" ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
    echo -e "${GREEN}✓ Supabase URL is configured.${NC}"
  else
    echo -e "${RED}❌ Supabase URL is not configured in .env.local${NC}"
  fi
  
  if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo -e "${GREEN}✓ Supabase anon key is configured.${NC}"
  else
    echo -e "${RED}❌ Supabase anon key is not configured in .env.local${NC}"
  fi
else
  echo -e "${RED}❌ .env.local file is missing. Please create one with Supabase credentials.${NC}"
fi

# 4. Check for common issues in dynamic route files
echo -e "\n${BLUE}4. Checking for proper async usage in dynamic routes...${NC}"
dynamic_route_paths=$(find src/app -type d -name '\[*\]' -not -path "*/node_modules/*")

for path in $dynamic_route_paths; do
  page_file="$path/page.tsx"
  if [ -f "$page_file" ]; then
    echo -e "${YELLOW}Checking $page_file...${NC}"
    # Check if async is used in default export
    if grep -q "export default async function" "$page_file"; then
      echo -e "${GREEN}✓ Async function properly used in $page_file${NC}"
    else
      # Check if params are accessed directly in non-async function
      if grep -q "params\\." "$page_file" && ! grep -q "async" "$page_file"; then
        echo -e "${RED}❌ Dynamic route parameter accessed in non-async component: $page_file${NC}"
      else
        echo -e "${GREEN}✓ No direct params access or async function used in $page_file${NC}"
      fi
    fi
  fi
done

# 5. Check for table references
echo -e "\n${BLUE}5. Checking for deprecated table references...${NC}"
deprecated_refs=$(grep -r --include="*.ts" --include="*.tsx" ".from('results')" src/ | wc -l)

if [ "$deprecated_refs" -gt 0 ]; then
  echo -e "${RED}❌ Found $deprecated_refs references to deprecated 'results' table. These should be updated to 'quiz_attempts'.${NC}"
  grep -r --include="*.ts" --include="*.tsx" ".from('results')" src/
else
  echo -e "${GREEN}✓ No references to deprecated 'results' table found.${NC}"
fi

# 6. Check for TypeScript errors
echo -e "\n${BLUE}6. Checking for TypeScript errors...${NC}"
if command -v npx &> /dev/null; then
  echo "Running TypeScript check..."
  npx tsc --noEmit
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ No TypeScript errors found.${NC}"
  else
    echo -e "${RED}❌ TypeScript errors detected. Please fix them.${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ npx not found, skipping TypeScript check.${NC}"
fi

# 7. Check Chrome extension
echo -e "\n${BLUE}7. Checking Chrome extension...${NC}"
if [ -d "chrome-extension" ]; then
  if [ -f "chrome-extension/manifest.json" ]; then
    echo -e "${GREEN}✓ Chrome extension manifest found.${NC}"
    
    # Count the number of files in the extension directory
    extension_files=$(find chrome-extension -type f | wc -l)
    echo -e "${GREEN}✓ Chrome extension has $extension_files files.${NC}"
    
    echo -e "${YELLOW}To install the Chrome extension:${NC}"
    echo "   1. Open Chrome and go to chrome://extensions/"
    echo "   2. Enable Developer mode (toggle in the top right)"
    echo "   3. Click 'Load unpacked' and select the 'chrome-extension' folder"
  else
    echo -e "${RED}❌ Chrome extension manifest not found.${NC}"
  fi
else
  echo -e "${YELLOW}⚠️ Chrome extension directory not found.${NC}"
fi

# 8. Print summary and next steps
echo -e "\n${BLUE}📋 Test Summary${NC}"
echo -e "${BLUE}==============${NC}"
echo -e "The application setup has been checked for common issues."
echo -e "To run the application locally:"
echo "1. Make sure your Supabase instance is running and accessible"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Access the application at http://localhost:3000"
echo ""
echo -e "${YELLOW}If you encounter any issues:${NC}"
echo "- Check your Supabase connection and tables"
echo "- Verify all table names match (quiz_attempts vs results)"
echo "- Check browser console for any JavaScript errors"
echo "- Check that your dynamic route components correctly use async keyword if accessing params"
echo ""
echo -e "${GREEN}✅ Test script completed${NC}"
echo "=====================================" 