#!/bin/bash

# Setup Sample Framework Quizzes for Thinkify Quiz Platform
# This script provides instructions for adding sample quizzes to your database

echo "🎯 Sample Framework Quizzes Setup"
echo "================================="
echo ""
echo "This script will help you add sample quizzes for popular frameworks to your Thinkify Quiz Platform."
echo "Each quiz contains 10 questions designed to take approximately 10 minutes to complete."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${BLUE}📚 Quizzes included:${NC}"
echo "   1. React.js Fundamentals"
echo "   2. Vue.js Essentials"
echo "   3. Angular Framework Mastery"
echo "   4. Node.js Backend Development"
echo "   5. Django Web Framework"
echo "   6. Spring Boot Framework"
echo ""

echo -e "${YELLOW}📋 Prerequisites:${NC}"
echo "   • Supabase database properly set up"
echo "   • Admin access to your Supabase SQL Editor"
echo "   • A test creator account (will be created if needed)"
echo ""

echo -e "${PURPLE}🔧 Installation Steps:${NC}"
echo ""
echo "1. First, create a test creator account (if you don't have one):"
echo "   Go to your Supabase SQL Editor and run:"
echo ""
echo -e "${GREEN}   INSERT INTO users (id, email, role, full_name, created_at, updated_at)"
echo "   VALUES (gen_random_uuid(), 'test@thinkify.com', 'creator', 'Framework Test Creator', NOW(), NOW())"
echo -e "   ON CONFLICT (email) DO NOTHING;${NC}"
echo ""

echo "2. Then, run the sample quizzes SQL script:"
echo "   • Go to your Supabase project dashboard"
echo "   • Click on 'SQL Editor' in the left sidebar"
echo "   • Create a new query"
echo "   • Copy and paste the contents of 'sample-framework-quizzes.sql'"
echo "   • Click 'Run' to execute the script"
echo ""

if [ -f "sample-framework-quizzes.sql" ]; then
    echo -e "${GREEN}✓ Sample quizzes SQL file found!${NC}"
    echo ""
    
    echo -e "${BLUE}📊 Quiz Statistics:${NC}"
    
    # Count quizzes
    quiz_count=$(grep -c "INSERT INTO quizzes" sample-framework-quizzes.sql)
    echo "   • Total Quizzes: $quiz_count"
    
    # Count questions  
    question_count=$(grep -c "INSERT INTO quiz_questions" sample-framework-quizzes.sql)
    echo "   • Total Questions: $question_count"
    
    # Count options
    option_count=$(grep -c "('.*-q[0-9]'" sample-framework-quizzes.sql)
    echo "   • Total Options: $option_count"
    
    echo ""
    echo -e "${BLUE}🎯 Framework Coverage:${NC}"
    echo "   • Frontend: React.js, Vue.js, Angular"
    echo "   • Backend: Node.js, Django, Spring Boot"
    echo "   • Languages: JavaScript, TypeScript, Python, Java"
    echo ""
    
    echo -e "${GREEN}📄 Preview of sample-framework-quizzes.sql:${NC}"
    echo "----------------------------------------"
    head -30 sample-framework-quizzes.sql
    echo "... (truncated, see full file for complete content)"
    echo ""
    
else
    echo -e "${RED}❌ Sample quizzes SQL file not found!${NC}"
    echo "   Expected: sample-framework-quizzes.sql"
    echo "   Please ensure you're running this from the project root directory."
    echo ""
    exit 1
fi

echo -e "${YELLOW}🧪 Testing Your Setup:${NC}"
echo ""
echo "After running the SQL script, you can test by:"
echo "1. Logging into your quiz platform as a regular user"
echo "2. Browsing to the quiz catalog"
echo "3. Looking for quizzes by 'Framework Test Creator'"
echo "4. Taking a sample quiz to verify everything works"
echo ""

echo -e "${BLUE}👤 Accessing Test Creator Dashboard:${NC}"
echo ""
echo "To access the test creator dashboard:"
echo "1. Sign in with email: test@thinkify.com"
echo "2. Use password: (set your own secure password)"
echo "3. Or manually update the user role in your database"
echo ""

echo -e "${PURPLE}⚙️  Database Verification Query:${NC}"
echo ""
echo "To verify the quizzes were created successfully, run:"
echo ""
echo -e "${GREEN}SELECT "
echo "    q.title as quiz_title,"
echo "    u.full_name as creator_name,"
echo "    COUNT(qq.id) as question_count,"
echo "    q.is_published"
echo "FROM quizzes q"
echo "LEFT JOIN users u ON q.creator_id = u.id"
echo "LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id"
echo "WHERE u.email = 'test@thinkify.com'"
echo -e "GROUP BY q.id, q.title, u.full_name, q.is_published;${NC}"
echo ""

echo -e "${YELLOW}💡 Tips:${NC}"
echo ""
echo "• Each quiz has exactly 10 questions (designed for ~10 minutes)"
echo "• All quizzes are published and ready for users"
echo "• Questions cover fundamental to intermediate concepts"
echo "• Great for developer skill assessment or learning"
echo "• You can modify the questions/options to suit your needs"
echo ""

echo -e "${GREEN}✅ Ready to proceed!${NC}"
echo "   Copy the SQL from sample-framework-quizzes.sql to your Supabase SQL Editor."
echo ""

echo -e "${BLUE}🔗 Need Help?${NC}"
echo "   • Check the ADMIN_FIX_SUMMARY.md for troubleshooting"
echo "   • Ensure admin policies are applied (sql/admin_policies.sql)"
echo "   • Verify your database schema matches the expected structure"
echo "" 