#!/bin/bash

# EchoWater Hydrogen Studies Scraper Runner
# Admin: shayne@devpipeline.com

echo "=== EchoWater Hydrogen Studies Scraper ==="
echo "Admin: shayne@devpipeline.com"
echo "Starting Node.js scraper to avoid CORS issues..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Run the scraper
echo "Running scraper..."
node echo-water-scraper-node.js

echo ""
echo "Scraper completed. Check the generated JSON file for extracted data." 