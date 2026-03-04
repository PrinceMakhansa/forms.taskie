#!/bin/bash

# Taskie Forms - Quick Start Setup Script

echo "🚀 Taskie Forms - Quick Start Setup"
echo "===================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js $(node --version) detected"

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠ .env.local not found. Copying from .env.example..."
    cp .env.example .env.local
    echo "✓ Created .env.local"
    echo ""
    echo "📝 Please update .env.local with your credentials:"
    echo "   - MONGODB_URI: Your MongoDB Atlas connection string"
    echo "   - DISCORD_CLIENT_ID: Your Discord app's client ID"
    echo "   - DISCORD_CLIENT_SECRET: Your Discord app's client secret"
    echo "   - NEXTAUTH_SECRET: A random secret (generate with: openssl rand -base64 32)"
else
    echo "✓ .env.local already exists"
fi

echo ""
echo "📦 Dependencies are already installed via npm install"
echo ""
echo "🎉 Ready to start development!"
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your credentials"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:3000"
