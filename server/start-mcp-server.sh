#!/bin/bash

# Shoq MCP Server Startup Script
# This script starts the Shoq MCP Server with proper environment setup

echo "🚀 Starting Shoq MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if TypeScript is compiled
if [ ! -f "shoq-mcp-server.js" ]; then
    echo "📦 Compiling TypeScript..."
    npx tsc shoq-mcp-server.ts --target es2022 --module esnext --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Please create one with the required environment variables."
    echo "Required variables:"
    echo "  - MONGO_URL"
    echo "  - GEMINI_API_KEY" 
    echo "  - OPERATOR_ADDRESS"
    echo "  - OPERATOR_KEY"
    echo "  - SHOP_OWNER_ADDRESS"
    echo "  - HEDERA_USDC_TOKEN_ID"
    echo "  - FULFILLMENT_EMAIL"
    echo "  - EMAIL_USERNAME"
    echo "  - EMAIL_PASSWORD"
    echo "  - SMTP_HOST"
    echo "  - JWT_SECRET"
    exit 1
fi

# Load environment variables
source .env

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."
if ! node -e "
const mongoose = require('mongoose');
mongoose.connect('$MONGO_URL', { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('✅ MongoDB connected'); process.exit(0); })
  .catch(() => { console.log('❌ MongoDB connection failed'); process.exit(1); });
" 2>/dev/null; then
    echo "❌ Cannot connect to MongoDB. Please check your MONGO_URL."
    exit 1
fi

echo "✅ Environment checks passed"
echo "🎯 Starting MCP Server..."

# Start the MCP server
exec node shoq-mcp-server.js
