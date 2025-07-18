#!/bin/bash

# Cloudflare-Aware Topics Extractor Runner
# Uses proper headers and request patterns to bypass Cloudflare protection
# Admin: shayne@devpipeline.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔬 Cloudflare-Aware Topics Extractor${NC}"
echo -e "${CYAN}====================================${NC}"
echo ""
echo -e "${BLUE}📋 This extractor will:${NC}"
echo -e "${BLUE}• Use proper headers to bypass Cloudflare protection${NC}"
echo -e "${BLUE}• Separate content from studies in different columns${NC}"
echo -e "${BLUE}• Remove all HTML tags and links from content${NC}"
echo -e "${BLUE}• Handle session management and retries${NC}"
echo -e "${BLUE}• Generate a clean CSV with Topic, Content, Studies columns${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if the extractor script exists
if [ ! -f "cloudflare-aware-extractor.js" ]; then
    echo -e "${RED}❌ cloudflare-aware-extractor.js not found in current directory${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  Important Notes:${NC}"
echo -e "${YELLOW}• This extractor uses proper browser headers to bypass Cloudflare${NC}"
echo -e "${YELLOW}• It includes delays between requests to avoid rate limiting${NC}"
echo -e "${YELLOW}• If Cloudflare challenges are detected, it will wait and retry${NC}"
echo -e "${YELLOW}• The process may take several minutes depending on the number of topics${NC}"
echo ""

echo -e "${GREEN}🚀 Starting Cloudflare-aware extraction...${NC}"
echo ""

# Run the extractor
node cloudflare-aware-extractor.js

echo ""
echo -e "${GREEN}✅ Extraction completed!${NC}"
echo ""
echo -e "${BLUE}📁 Check the current directory for the output CSV file:${NC}"
echo -e "${BLUE}   cloudflare_extracted_data_[timestamp].csv${NC}"
echo ""
echo -e "${CYAN}🔍 The CSV will contain:${NC}"
echo -e "${CYAN}   • Topic: The topic name${NC}"
echo -e "${CYAN}   • Content: Clean content without HTML tags or links${NC}"
echo -e "${CYAN}   • Studies: Studies section separated from content${NC}"
echo "" 