#!/bin/bash

echo "🚀 Setting up Investment Thesis Monitoring Agent..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
npm run db:generate
npm run db:push
npm run db:seed

echo "✅ Setup complete!"
echo ""
echo "To start the development server:"
echo "  npm run dev"
echo ""
echo "Open http://localhost:3000 in your browser"
echo ""
echo "Available scripts:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run start   - Start production server"
echo "  npm run db:seed - Reset and seed database"
echo "  npm run db:studio - Open Prisma Studio"