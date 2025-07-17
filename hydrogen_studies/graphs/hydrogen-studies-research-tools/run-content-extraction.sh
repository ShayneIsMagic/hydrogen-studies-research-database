#!/bin/bash
# Content Extraction Runner
# Extracts data in the exact format: Topic, Content, Studies
# Follows the format from the provided Google Sheets document
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

echo -e "${CYAN}🔬 Content Extraction - Topic, Content, Studies Format${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""
echo -e "${BLUE}📋 Following exact format from your Google Sheets document${NC}"
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
if [ ! -f "$SCRIPT_DIR/google-sheets-content-scraper.js" ]; then
    echo -e "${RED}❌ google-sheets-content-scraper.js not found in $SCRIPT_DIR${NC}"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/run-content-extraction.js" ]; then
    echo -e "${RED}❌ run-content-extraction.js not found in $SCRIPT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found required scraper files${NC}"

# Create output directory if it doesn't exist
OUTPUT_DIR="$SCRIPT_DIR/content-output"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"

# Show what will be extracted
echo ""
echo -e "${YELLOW}This content extraction will:${NC}"
echo -e "${BLUE}• Extract data for 199+ health topics from A-Z${NC}"
echo -e "${BLUE}• Follow exact format: Topic, Content, Studies${NC}"
echo -e "${BLUE}• Generate educational content for each topic${NC}"
echo -e "${BLUE}• Include research studies from Hydrogen Studies website${NC}"
echo -e "${BLUE}• Output in CSV (tab-separated) and JSON formats${NC}"
echo -e "${BLUE}• Match your Google Sheets document format exactly${NC}"
echo ""

# Check if user wants to run the extraction
read -p "Do you want to continue with content extraction? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Content extraction cancelled by user${NC}"
    exit 0
fi

# Show topics summary
echo ""
echo -e "${CYAN}📊 Topics to be processed (199+ total):${NC}"
echo -e "${BLUE}A: Acne, Acute Kidney Injury, Alzheimer's Disease, Anxiety, Asthma, etc. (21 topics)${NC}"
echo -e "${BLUE}B: Bacterial Infection, Brain Injury, etc. (6 topics)${NC}"
echo -e "${BLUE}C: Cancer, Cardiovascular Disease, Chronic Kidney Disease, etc. (22 topics)${NC}"
echo -e "${BLUE}D: Depression, Diabetes (Type I & II), Dementia, etc. (17 topics)${NC}"
echo -e "${BLUE}E: Edema, Endometriosis, Erectile Dysfunction, etc. (12 topics)${NC}"
echo -e "${BLUE}F: Fatigue, Fatty Liver Disease, Fibrosis, etc. (8 topics)${NC}"
echo -e "${BLUE}G: Gastric Ulcer, Glaucoma, Graft-Versus-Host-Disease, etc. (9 topics)${NC}"
echo -e "${BLUE}H: Heart Attack, Heart Failure, High Blood Pressure, etc. (12 topics)${NC}"
echo -e "${BLUE}I: Inflammation, Inflammatory Bowel Disease, etc. (15 topics)${NC}"
echo -e "${BLUE}K: Kawasaki Disease, Kidney Failure, Kidney Stones, etc. (4 topics)${NC}"
echo -e "${BLUE}L: Liver Disease, Lung Injury, etc. (5 topics)${NC}"
echo -e "${BLUE}M: Multiple Sclerosis, Muscular Dystrophy, etc. (11 topics)${NC}"
echo -e "${BLUE}N: Neurodegeneration, Neuropathic Pain, etc. (7 topics)${NC}"
echo -e "${BLUE}O: Obesity, Osteoarthritis, Osteoporosis, etc. (9 topics)${NC}"
echo -e "${BLUE}P: Parkinson's Disease, Psoriasis, Pregnancy, etc. (24 topics)${NC}"
echo -e "${BLUE}R: Rheumatoid Arthritis, Retinal Injury, etc. (7 topics)${NC}"
echo -e "${BLUE}S: Stroke, Sleep Apnea, Spinal Cord Injury, etc. (12 topics)${NC}"
echo -e "${BLUE}T: Traumatic Brain Injury, Transplantation/Graft Injury, etc. (4 topics)${NC}"
echo -e "${BLUE}U: Ulcer, Ulcerative Colitis, etc. (6 topics)${NC}"
echo -e "${BLUE}V: Vascular Dysfunction, Vitiligo, etc. (4 topics)${NC}"
echo ""

# Show format example
echo ""
echo -e "${CYAN}📋 Output Format Example:${NC}"
echo -e "${BLUE}Topic: Acne${NC}"
echo -e "${BLUE}Content: What is acne? Acne is a common skin condition...${NC}"
echo -e "${BLUE}Studies: Efficacy of Hydrogen Purification and Cosmetic Acids...${NC}"
echo ""

# Final confirmation
read -p "Ready to start content extraction? This may take 20-40 minutes. (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Content extraction cancelled by user${NC}"
    exit 0
fi

# Start the extraction
echo ""
echo -e "${GREEN}🚀 Starting Content Extraction...${NC}"
echo -e "${BLUE}⏱️  Estimated time: 20-40 minutes${NC}"
echo -e "${BLUE}📊 Following exact Topic, Content, Studies format${NC}"
echo -e "${BLUE}🔍 Generating educational content and research studies${NC}"
echo ""

# Run the content extraction
cd "$SCRIPT_DIR"
node run-content-extraction.js

# Check if the script completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Content extraction completed successfully!${NC}"
    
    # List output files
    echo ""
    echo -e "${BLUE}📁 Generated files:${NC}"
    ls -la "$SCRIPT_DIR"/topics-content-data-*.csv 2>/dev/null || echo "No content CSV files found"
    ls -la "$SCRIPT_DIR"/topics-content-data-*.json 2>/dev/null || echo "No content JSON files found"
    ls -la "$SCRIPT_DIR"/google-sheets-raw-*.csv 2>/dev/null || echo "No raw CSV files found"
    
    # Move files to output directory
    echo ""
    echo -e "${BLUE}📂 Moving files to content output directory...${NC}"
    mv "$SCRIPT_DIR"/topics-content-data-*.csv "$OUTPUT_DIR/" 2>/dev/null || true
    mv "$SCRIPT_DIR"/topics-content-data-*.json "$OUTPUT_DIR/" 2>/dev/null || true
    mv "$SCRIPT_DIR"/google-sheets-raw-*.csv "$OUTPUT_DIR/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Files moved to: $OUTPUT_DIR${NC}"
    
    # Show summary
    echo ""
    echo -e "${CYAN}📊 Content Extraction Summary:${NC}"
    echo -e "${BLUE}• Educational content generated for 199+ health topics${NC}"
    echo -e "${BLUE}• Research studies collected from Hydrogen Studies website${NC}"
    echo -e "${BLUE}• Format: Topic, Content, Studies (exactly as requested)${NC}"
    echo -e "${BLUE}• Output formats: CSV (tab-separated), JSON${NC}"
    echo -e "${BLUE}• Files saved in: $OUTPUT_DIR${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Content extraction failed with exit code $?${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Content extraction completed! Check the output directory for results.${NC}"
echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}" 