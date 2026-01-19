#!/bin/bash
# Docker Setup Script for Linux/Mac
# สคริปต์ช่วยในการ setup Docker environment

echo "🚀 Flight Search - Docker Setup"
echo ""

# Check if Docker is running
echo "📋 Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi
echo "✅ Docker is running"

# Check if .env files exist
echo ""
echo "📋 Checking environment files..."

if [ ! -f "backend/.env" ]; then
    echo "⚠️  backend/.env not found. Creating from env.example..."
    cp backend/env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "✅ backend/.env exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  frontend/.env.local not found. Creating from env.example..."
    cp frontend/env.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "✅ frontend/.env.local exists"
fi

# Build and start containers
echo ""
echo "🏗️  Building and starting Docker containers..."
docker-compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Docker containers started successfully!"
    echo ""
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    echo ""
    echo "📊 Container status:"
    docker-compose ps
    
    echo ""
    echo "🌐 Services are available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001/api"
    echo "   Database: localhost:5432"
    
    echo ""
    echo "📝 Next steps:"
    echo "   1. Run database migrations:"
    echo "      docker-compose exec backend npm run migrate"
    echo ""
    echo "   2. View logs:"
    echo "      docker-compose logs -f"
    echo ""
    echo "   3. Stop services:"
    echo "      docker-compose down"
else
    echo ""
    echo "❌ Failed to start Docker containers"
    echo "Check logs with: docker-compose logs"
    exit 1
fi
