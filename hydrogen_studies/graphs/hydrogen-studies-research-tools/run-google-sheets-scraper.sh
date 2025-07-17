#!/bin/bash
# Google Sheets Topics Scraper Runner
# Extracts data for all specified topics from Google Sheets and Hydrogen Studies
# Admin: shayne@devpipeline.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${CYAN}🔬 Google Sheets Topics Scraper${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js version 14 or higher is recommended. Current version: $(node --version)${NC}"
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check if required files exist
if [ ! -f "$SCRIPT_DIR/google-sheets-topics-scraper.js" ]; then
    echo -e "${RED}❌ google-sheets-topics-scraper.js not found in $SCRIPT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found google-sheets-topics-scraper.js${NC}"

# Create output directory if it doesn't exist
OUTPUT_DIR="$SCRIPT_DIR/output"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"

# Check if user wants to run the scraper
echo ""
echo -e "${YELLOW}This will extract data for 199+ health topics from:${NC}"
echo -e "${BLUE}• Google Sheets: https://docs.google.com/spreadsheets/d/1UVcZ3kWcvmf88Q5ZLj6DT_aW6jLSSpoZo4QrVGC4Lrk/edit?gid=529478384#gid=529478384${NC}"
echo -e "${BLUE}• Hydrogen Studies: https://hydrogenstudies.com${NC}"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Scraper cancelled by user${NC}"
    exit 0
fi

# Start the scraper
echo ""
echo -e "${GREEN}🚀 Starting Google Sheets Topics Scraper...${NC}"
echo ""

# Run the scraper
cd "$SCRIPT_DIR"
node run-google-sheets-scraper.js

# Check if the script completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Scraper completed successfully!${NC}"
    
    # List output files
    echo ""
    echo -e "${BLUE}📁 Generated files:${NC}"
    ls -la "$SCRIPT_DIR"/*.csv 2>/dev/null || echo "No CSV files found"
    ls -la "$SCRIPT_DIR"/*.json 2>/dev/null || echo "No JSON files found"
    ls -la "$SCRIPT_DIR"/*.html 2>/dev/null || echo "No HTML files found"
    
    # Move files to output directory
    echo ""
    echo -e "${BLUE}📂 Moving files to output directory...${NC}"
    mv "$SCRIPT_DIR"/*.csv "$OUTPUT_DIR/" 2>/dev/null || true
    mv "$SCRIPT_DIR"/*.json "$OUTPUT_DIR/" 2>/dev/null || true
    mv "$SCRIPT_DIR"/*.html "$OUTPUT_DIR/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Files moved to: $OUTPUT_DIR${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Scraper failed with exit code $?${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All done! Check the output directory for results.${NC}" 