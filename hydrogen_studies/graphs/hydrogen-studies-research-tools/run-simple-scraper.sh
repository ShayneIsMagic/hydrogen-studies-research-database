#!/bin/bash

echo "🔬 Simple Hydrogen Studies Topic Scraper"
echo "========================================"
echo "📊 Extracts: Topic | Content | Studies"
echo "📁 Output: One simple CSV file"
echo "========================================"
echo

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed or not in PATH"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if required packages are installed
echo "📦 Checking required packages..."
python3 -c "import requests, bs4, pandas" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "📦 Installing required packages..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install required packages"
        exit 1
    fi
fi

echo "✅ All required packages are installed"
echo

# Run the scraper
echo "🚀 Starting the scraper..."
echo "💡 You can:"
echo "   - Press Enter for ALL 216 topics"
echo "   - Enter a number (e.g., 5) for testing"
echo "   - Press Ctrl+C to stop anytime"
echo

python3 simple_topic_scraper.py

echo
echo "✅ Scraper completed!"
echo "📁 Check the current directory for CSV files" 