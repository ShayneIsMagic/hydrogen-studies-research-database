#!/bin/bash

echo "🚀 Starting Hydrogen Studies Research Dashboard..."
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Python 3 found. Starting server on http://localhost:8000"
    echo "📊 Dashboard will be available at: http://localhost:8000/hydrogen-research-dashboard.html"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    python3 -m http.server 8000
elif command -v node &> /dev/null; then
    echo "✅ Node.js found. Checking for dependencies..."
    if [ -f "package.json" ]; then
        echo "📦 Installing dependencies..."
        npm install
        echo "✅ Starting Node.js server on http://localhost:3000"
        echo "📊 Dashboard will be available at: http://localhost:3000"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        npm start
    else
        echo "❌ package.json not found. Using Python fallback..."
        echo "📊 Dashboard will be available at: http://localhost:8000/hydrogen-research-dashboard.html"
        echo ""
        echo "Press Ctrl+C to stop the server"
        echo ""
        python3 -m http.server 8000
    fi
else
    echo "❌ Neither Python 3 nor Node.js found."
    echo "Please install Python 3 or Node.js to run the dashboard."
    exit 1
fi 