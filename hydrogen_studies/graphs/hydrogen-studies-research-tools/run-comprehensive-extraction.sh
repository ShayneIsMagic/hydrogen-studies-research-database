#!/bin/bash
# Comprehensive Topics Extraction Runner
# Extracts data for all 199+ topics following exact spreadsheet format
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

echo -e "${CYAN}🔬 Comprehensive Topics Extraction${NC}"
echo -e "${CYAN}==================================${NC}"
echo ""
echo -e "${BLUE}📋 Following exact spreadsheet format for thorough data extraction${NC}"
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
if [ ! -f "$SCRIPT_DIR/google-sheets-direct-scraper.js" ]; then
    echo -e "${RED}❌ google-sheets-direct-scraper.js not found in $SCRIPT_DIR${NC}"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/run-comprehensive-extraction.js" ]; then
    echo -e "${RED}❌ run-comprehensive-extraction.js not found in $SCRIPT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found required scraper files${NC}"

# Create output directory if it doesn't exist
OUTPUT_DIR="$SCRIPT_DIR/comprehensive-output"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}"

# Show what will be extracted
echo ""
echo -e "${YELLOW}This comprehensive extraction will:${NC}"
echo -e "${BLUE}• Extract data for 199+ health topics from A-Z${NC}"
echo -e "${BLUE}• Follow exact spreadsheet format with all columns${NC}"
echo -e "${BLUE}• Include: Topic, Study Title, Authors, Year, Journal, DOI, Study Type, Sample Size, Intervention, Control, Duration, Outcome Measures, Key Findings, Statistical Significance, Limitations, Funding Source, Conflicts of Interest, Notes, Source URL, Extracted Date${NC}"
echo -e "${BLUE}• Combine data from Google Sheets and Hydrogen Studies website${NC}"
echo -e "${BLUE}• Generate CSV and JSON outputs${NC}"
echo ""

# Check if user wants to run the extraction
read -p "Do you want to continue with comprehensive extraction? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Comprehensive extraction cancelled by user${NC}"
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

# Final confirmation
read -p "Ready to start comprehensive extraction? This may take 30-60 minutes. (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🛑 Comprehensive extraction cancelled by user${NC}"
    exit 0
fi

# Start the extraction
echo ""
echo -e "${GREEN}🚀 Starting Comprehensive Topics Extraction...${NC}"
echo -e "${BLUE}⏱️  Estimated time: 30-60 minutes${NC}"
echo -e "${BLUE}📊 Following exact spreadsheet format${NC}"
echo -e "${BLUE}🔍 Thorough data extraction from multiple sources${NC}"
echo ""

# Run the comprehensive extraction
cd "$SCRIPT_DIR"
node run-comprehensive-extraction.js

# Check if the script completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Comprehensive extraction completed successfully!${NC}"
    
    # List output files
    echo ""
    echo -e "${BLUE}📁 Generated files:${NC}"
    ls -la "$SCRIPT_DIR"/comprehensive-*.csv 2>/dev/null || echo "No comprehensive CSV files found"
    ls -la "$SCRIPT_DIR"/comprehensive-*.json 2>/dev/null || echo "No comprehensive JSON files found"
    ls -la "$SCRIPT_DIR"/google-sheets-raw-*.csv 2>/dev/null || echo "No raw CSV files found"
    
    # Move files to output directory
    echo ""
    echo -e "${BLUE}📂 Moving files to comprehensive output directory...${NC}"
    mv "$SCRIPT_DIR"/comprehensive-*.csv "$OUTPUT_DIR/" 2>/dev/null || true
    mv "$SCRIPT_DIR"/comprehensive-*.json "$OUTPUT_DIR/" 2>/dev/null || true
    mv "$SCRIPT_DIR"/google-sheets-raw-*.csv "$OUTPUT_DIR/" 2>/dev/null || true
    
    echo -e "${GREEN}✅ Files moved to: $OUTPUT_DIR${NC}"
    
    # Show summary
    echo ""
    echo -e "${CYAN}📊 Extraction Summary:${NC}"
    echo -e "${BLUE}• Comprehensive data extracted for 199+ health topics${NC}"
    echo -e "${BLUE}• Following exact spreadsheet format with all columns${NC}"
    echo -e "${BLUE}• Data sources: Google Sheets + Hydrogen Studies website${NC}"
    echo -e "${BLUE}• Output formats: CSV, JSON${NC}"
    echo -e "${BLUE}• Files saved in: $OUTPUT_DIR${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Comprehensive extraction failed with exit code $?${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Comprehensive extraction completed! Check the output directory for results.${NC}"
echo -e "${BLUE}📁 Output directory: $OUTPUT_DIR${NC}" 