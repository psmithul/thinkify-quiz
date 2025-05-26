#!/bin/bash

# Thinkify Quiz Recommender - Chrome Extension Packaging Script

echo "🎯 Thinkify Quiz Recommender - Extension Packaging"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo -e "${RED}❌ Error: manifest.json not found!${NC}"
    echo "Please run this script from the chrome-extension directory."
    exit 1
fi

echo -e "${BLUE}📋 Pre-flight Checks${NC}"
echo ""

# Check required files
required_files=("manifest.json" "content.js" "background.js" "popup.html" "popup.js" "styles.css")
missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        missing_files+=("$file")
    fi
done

# Check icons directory
if [ -d "icons" ]; then
    echo -e "${GREEN}✓${NC} icons/ directory"
    
    # Check for icon files
    icon_files=("icon16.png" "icon48.png" "icon128.png")
    for icon in "${icon_files[@]}"; do
        if [ -f "icons/$icon" ]; then
            echo -e "${GREEN}  ✓${NC} icons/$icon"
        else
            echo -e "${YELLOW}  !${NC} icons/$icon (recommended)"
        fi
    done
else
    echo -e "${YELLOW}!${NC} icons/ directory (recommended)"
    echo "   See icons/create-icons.md for instructions"
fi

echo ""

if [ ${#missing_files[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing required files. Cannot proceed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files present!${NC}"
echo ""

# Validate manifest.json
echo -e "${BLUE}🔍 Validating manifest.json${NC}"

if command -v python3 &> /dev/null; then
    python3 -m json.tool manifest.json > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Valid JSON format"
    else
        echo -e "${RED}✗${NC} Invalid JSON format in manifest.json"
        exit 1
    fi
else
    echo -e "${YELLOW}!${NC} Python3 not found, skipping JSON validation"
fi

# Check manifest version
version=$(grep '"version"' manifest.json | cut -d'"' -f4)
name=$(grep '"name"' manifest.json | cut -d'"' -f4)
echo -e "${GREEN}✓${NC} Extension: $name (v$version)"

echo ""

# Installation instructions
echo -e "${PURPLE}📦 Installation Instructions${NC}"
echo ""
echo "To install this extension in Chrome:"
echo ""
echo "1. Open Chrome and navigate to: chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top right)"
echo "3. Click 'Load unpacked'"
echo "4. Select this directory: $(pwd)"
echo "5. The extension will be installed and active"
echo ""

echo -e "${BLUE}🧪 Testing Instructions${NC}"
echo ""
echo "To test the extension:"
echo ""
echo "1. Visit a LinkedIn job posting:"
echo "   https://www.linkedin.com/jobs/view/[any-job-id]"
echo ""
echo "2. Look for the Thinkify recommendation widget"
echo "   (should appear below the job details)"
echo ""
echo "3. Click the extension icon in the toolbar"
echo "   (look for the 🎯 icon or 'T' if icons are missing)"
echo ""
echo "4. Test the popup interface and settings"
echo ""

# Create a simple package for distribution
echo -e "${YELLOW}📂 Creating Package${NC}"
echo ""

# Create a timestamp for the package
timestamp=$(date +"%Y%m%d_%H%M%S")
package_name="thinkify-quiz-recommender-v${version}-${timestamp}"

# Create package directory
mkdir -p "../packages"
package_dir="../packages/$package_name"

# Copy extension files
echo "Copying extension files..."
cp -r . "$package_dir"

# Remove unnecessary files from package
cd "$package_dir"
rm -f package-extension.sh
rm -rf .git
rm -f .gitignore
rm -f .DS_Store

# Create installation instructions
cat > INSTALL.txt << EOF
Thinkify Quiz Recommender Chrome Extension
Installation Instructions

1. Open Google Chrome
2. Navigate to: chrome://extensions/
3. Enable "Developer mode" (toggle in top right corner)
4. Click "Load unpacked"
5. Select this folder: $package_name
6. The extension will be installed and ready to use

Visit LinkedIn job postings to see quiz recommendations!

For support: support@thinkify-quiz.com
EOF

cd ..

echo -e "${GREEN}✅ Package created: packages/$package_name${NC}"
echo ""

# Create a ZIP file if zip is available
if command -v zip &> /dev/null; then
    echo "Creating ZIP archive..."
    cd packages
    zip -r "${package_name}.zip" "$package_name" > /dev/null 2>&1
    echo -e "${GREEN}✅ ZIP archive created: packages/${package_name}.zip${NC}"
    cd ..
else
    echo -e "${YELLOW}! ZIP command not found, skipping archive creation${NC}"
fi

echo ""
echo -e "${PURPLE}🚀 Next Steps${NC}"
echo ""
echo "1. Follow the installation instructions above"
echo "2. Test the extension on LinkedIn job pages"
echo "3. Use the popup to configure settings"
echo "4. Report any issues to support@thinkify-quiz.com"
echo ""
echo -e "${GREEN}📚 For more information, see README.md${NC}"
echo ""
echo -e "${BLUE}Happy learning with Thinkify! 🎯📚${NC}" 