#!/bin/bash

# Shoq MCP Server Setup Script
# This script sets up and configures the Shoq MCP Server

echo "🔧 Setting up Shoq MCP Server..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Install MCP SDK if not already installed
if ! npm list @modelcontextprotocol/sdk &> /dev/null; then
    echo "📦 Installing MCP SDK..."
    npm install @modelcontextprotocol/sdk
fi

# Compile TypeScript
echo "🏗️  Compiling TypeScript..."
npx tsc shoq-mcp-server.ts --target es2022 --module esnext --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop --outDir ./

# Make the compiled file executable
chmod +x shoq-mcp-server.js

# Create a symbolic link for easier access
if [ ! -L "./mcp-server" ]; then
    ln -s shoq-mcp-server.js mcp-server
    echo "🔗 Created symbolic link: mcp-server"
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with required environment variables"
echo "2. Update your Claude Desktop config with the server path:"
echo "   $(pwd)/shoq-mcp-server.js"
echo "3. Start the server with: ./start-mcp-server.sh"
echo ""
echo "Available tools:"
echo "  • Product Management (search, create, update, delete)"
echo "  • Order Processing (create, view, cancel orders)"  
echo "  • User Management (profiles, balance updates)"
echo "  • Hedera Blockchain (transaction verification, transfers)"
echo "  • AI Chat (context-aware responses)"
echo "  • Analytics (sales reports, popular products)"
