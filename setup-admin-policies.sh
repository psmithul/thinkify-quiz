#!/bin/bash

# Setup Admin Policies for Thinkify Quiz Platform
# This script provides instructions for setting up admin access policies

echo "🔐 Admin Policies Setup for Thinkify Quiz Platform"
echo "=================================================="
echo ""
echo "This script will help you set up admin access policies in your Supabase database."
echo "Admin users will be able to view and manage all quizzes and quiz attempts."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  IMPORTANT: You need to run this in your Supabase SQL Editor${NC}"
echo ""
echo "Steps to apply admin policies:"
echo ""
echo "1. Go to your Supabase project dashboard"
echo "2. Click on 'SQL Editor' in the left sidebar"
echo "3. Create a new query"
echo "4. Copy and paste the contents of 'sql/admin_policies.sql'"
echo "5. Click 'Run' to execute the policies"
echo ""

echo -e "${BLUE}📁 Admin policies file location:${NC}"
echo "   sql/admin_policies.sql"
echo ""

if [ -f "sql/admin_policies.sql" ]; then
    echo -e "${GREEN}✓ Admin policies file found!${NC}"
    echo ""
    echo -e "${BLUE}📝 Quick preview of what will be created:${NC}"
    echo "   • Admin access to view all quiz attempts"
    echo "   • Admin access to manage any quiz"
    echo "   • Admin access to quiz questions and options"
    echo "   • Full CRUD permissions for admin users"
    echo ""
    
    echo -e "${YELLOW}💡 After running the SQL script:${NC}"
    echo "   1. Make sure your user account has role = 'admin' in the users table"
    echo "   2. Restart your development server (npm run dev)"
    echo "   3. Log in as admin and test the quiz results view"
    echo ""
    
    echo -e "${BLUE}🔍 To verify policies were created, run this query:${NC}"
    echo "   SELECT tablename, policyname FROM pg_policies WHERE policyname LIKE '%admin%' ORDER BY tablename, policyname;"
    echo ""
    
    echo -e "${GREEN}📄 Contents of admin_policies.sql:${NC}"
    echo "----------------------------------------"
    head -20 sql/admin_policies.sql
    echo "... (truncated, see full file for complete policies)"
    echo ""
    
else
    echo -e "${RED}❌ Admin policies file not found!${NC}"
    echo "   Expected: sql/admin_policies.sql"
    echo "   Please ensure you're running this from the project root directory."
    echo ""
    exit 1
fi

echo -e "${YELLOW}🔐 Security Note:${NC}"
echo "   These policies use role-based access control."
echo "   Only users with role = 'admin' will have access to all data."
echo "   Regular users and creators will still have restricted access."
echo ""

echo -e "${GREEN}✅ Ready to proceed!${NC}"
echo "   Copy the SQL from sql/admin_policies.sql to your Supabase SQL Editor."
echo "" 