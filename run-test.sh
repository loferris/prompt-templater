#!/bin/bash

# Test runner script for Notion API client
echo "🧪 Running Notion API Tests..."

cd /home/loferris/Code/prompt-templater

echo "📁 Current directory: $(pwd)"
echo "📋 Environment check:"

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local found"
else
    echo "❌ .env.local not found"
    exit 1
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules found"
else
    echo "⚠️  node_modules not found, running npm install..."
    npm install
fi

echo ""
echo "🔧 Running JavaScript test..."
node test-notion-client.js

echo ""
echo "📊 Running structure validation..."
node validate-structure.js

echo ""
echo "🎉 All tests completed!"