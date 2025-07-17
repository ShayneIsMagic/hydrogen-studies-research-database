#!/bin/bash

# Hydrogen Studies Topics Extractor Runner
# This script runs the Node.js topics extractor to create a CSV with all topics and study links

echo "🔬 Hydrogen Studies Topics Extractor"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if the extractor script exists
if [ ! -f "topics-extractor-node.js" ]; then
    echo "❌ Error: topics-extractor-node.js not found in current directory."
    exit 1
fi

echo "🚀 Starting topics extraction..."
echo "📄 Target: https://hydrogenstudies.com/topics/"
echo "📊 Output: CSV file with Topic, Study Title, and Study URL columns"
echo ""

# Run the extractor
node topics-extractor-node.js

echo ""
echo "✅ Extraction process completed!"
echo ""
echo "📁 Check the current directory for the generated CSV file."
echo "📂 The file will be named: hydrogen-studies-topics-[timestamp].csv" 