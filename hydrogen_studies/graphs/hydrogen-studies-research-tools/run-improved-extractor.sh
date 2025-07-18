#!/bin/bash

# Improved Topics Extractor Runner
# Properly separates content from studies and removes HTML tags/links
# Admin: shayne@devpipeline.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔬 Improved Topics Extractor${NC}"
echo -e "${CYAN}==========================${NC}"
echo ""
echo -e "${BLUE}📋 This extractor will:${NC}"
echo -e "${BLUE}• Separate content from studies in different columns${NC}"
echo -e "${BLUE}• Remove all HTML tags and links from content${NC}"
echo -e "${BLUE}• Clean up study titles and information${NC}"
echo -e "${BLUE}• Generate a properly formatted CSV file${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if the extractor script exists
if [ ! -f "improved-topics-extractor.js" ]; then
    echo -e "${RED}❌ Error: improved-topics-extractor.js not found in current directory.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ Found improved-topics-extractor.js${NC}"
echo ""

# Show what will be extracted
echo -e "${YELLOW}This improved extraction will:${NC}"
echo -e "${BLUE}• Extract topics from https://hydrogenstudies.com/topics/${NC}"
echo -e "${BLUE}• Visit each topic page to get content and studies${NC}"
echo -e "${BLUE}• Separate content (descriptions) from studies (research links)${NC}"
echo -e "${BLUE}• Remove HTML tags, links, and formatting from content${NC}"
echo -e "${BLUE}• Clean up study information and remove duplicates${NC}"
echo -e "${BLUE}• Generate CSV with columns: Topic, Content, Studies${NC}"
echo ""

# Check if user wants to run the extraction
read -p "Do you want to continue with improved extraction? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Improved extraction cancelled by user${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Starting Improved Topics Extraction...${NC}"
echo -e "${BLUE}⏱️  Estimated time: 10-30 minutes (depending on number of topics)${NC}"
echo -e "${BLUE}📊 Output: improved_topics_content_[timestamp].csv${NC}"
echo -e "${BLUE}🔍 Properly separated content and studies${NC}"
echo ""

# Run the improved extractor
node improved-topics-extractor.js

# Check if the script completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Improved extraction completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📁 Check the current directory for the generated CSV file:${NC}"
    echo -e "${BLUE}📂 improved_topics_content_[timestamp].csv${NC}"
    echo ""
    echo -e "${BLUE}📊 The CSV will contain:${NC}"
    echo -e "${BLUE}   - Topic: The health topic name${NC}"
    echo -e "${BLUE}   - Content: Clean description without HTML tags or links${NC}"
    echo -e "${BLUE}   - Studies: List of study titles with authors and years${NC}"
    echo ""
    echo -e "${GREEN}🎉 Extraction process finished!${NC}"
else
    echo ""
    echo -e "${RED}❌ Improved extraction failed!${NC}"
    echo -e "${RED}Check the error messages above for details.${NC}"
    exit 1
fi 