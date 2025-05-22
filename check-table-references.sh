#!/bin/bash

# Script to check for any remaining references to the deprecated 'results' table
echo "🔍 Checking for references to deprecated 'results' table in codebase..."
echo "==============================================================="

# Define color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Search for .from('results') in TypeScript/JavaScript files
echo -e "${YELLOW}Searching for .from('results') in TS/JS files...${NC}"
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" ".from('results')" src/ || echo -e "${GREEN}No .from('results') found in TS/JS files.${NC}"

echo ""

# Search for other references to 'results' table that might be problematic
echo -e "${YELLOW}Searching for potential database references to 'results'...${NC}"
grep -r --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "table: 'results'" src/ || echo -e "${GREEN}No table: 'results' references found in code.${NC}"

echo ""

# Search for Result type definitions that might need updating
echo -e "${YELLOW}Searching for Result type definitions that might need updating...${NC}"
grep -r --include="*.ts" --include="*.tsx" "type Result" src/ || echo -e "${GREEN}No Result type definitions found.${NC}"

echo ""

# Check for references to the results table in SQL files
echo -e "${YELLOW}Checking SQL files for 'results' table references...${NC}"
grep -r --include="*.sql" "results" sql/ || echo -e "${GREEN}No 'results' table references found in SQL files.${NC}"

echo ""
echo -e "${GREEN}✅ Check complete!${NC}"
echo "If any results were found above, consider updating them to use 'quiz_attempts' instead."
echo "===============================================================" 