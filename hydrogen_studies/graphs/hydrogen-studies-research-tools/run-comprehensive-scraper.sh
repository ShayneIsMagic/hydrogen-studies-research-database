#!/bin/bash

# Comprehensive Hydrogen Studies Topics Scraper Runner
# This script runs the comprehensive scraper to extract topics and detailed study information

echo "🔬 Comprehensive Hydrogen Studies Topics Scraper"
echo "================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the scraper script exists
if [ ! -f "comprehensive-topics-scraper.js" ]; then
    echo "❌ Error: comprehensive-topics-scraper.js not found in current directory."
    exit 1
fi

echo "🚀 Starting comprehensive topics extraction..."
echo "📄 Target: https://hydrogenstudies.com/topics/"
echo "📊 Output: hydrogen_studies_by_topic.csv"
echo "📋 Columns: Topic, Page Content, Study Title, Authors, Year, DOI or Study Link"
echo ""
echo "⚠️  Note: This process may take several minutes due to Cloudflare protection."
echo "   The scraper will attempt multiple proxy strategies to bypass protection."
echo ""

# Run the comprehensive scraper
node comprehensive-topics-scraper.js

echo ""
echo "✅ Comprehensive extraction process completed!"
echo ""
echo "📁 Check the current directory for the generated CSV file:"
echo "📂 hydrogen_studies_by_topic.csv"
echo ""
echo "📊 The CSV will contain:"
echo "   - Topic categories"
echo "   - Page content/descriptions"
echo "   - Study titles"
echo "   - Authors (when available)"
echo "   - Publication years (when available)"
echo "   - DOIs or study links" 