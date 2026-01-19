#!/bin/bash
# Script to create .env file from .env.example
# สคริปต์สำหรับสร้างไฟล์ .env จาก .env.example

echo "📝 Creating .env file..."
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_EXAMPLE="$SCRIPT_DIR/.env.example"
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env.example exists
if [ ! -f "$ENV_EXAMPLE" ]; then
    echo "⚠️  .env.example not found. Creating default .env.example..."
    
    cat > "$ENV_EXAMPLE" << 'EOF'
# Environment Variables for Docker Compose
# Copy this file to .env and update the values

# ============================================
# OpenWeatherMap API Key (for Weather Display)
# ============================================
# Get your free API key from: https://openweathermap.org/api
# Free tier allows 60 calls/minute and 1,000,000 calls/month
# Leave empty if you don't want to use weather features
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_api_key_here
EOF
    
    echo "✅ Created .env.example"
fi

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (Y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Existing .env file is preserved."
        exit 0
    fi
fi

# Copy .env.example to .env
cp "$ENV_EXAMPLE" "$ENV_FILE"
echo "✅ Created .env file from .env.example"
echo ""
echo "📝 Next steps:"
echo "   1. Edit .env file and add your OpenWeatherMap API key:"
echo "      NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_actual_api_key_here"
echo ""
echo "   2. Get API key from: https://openweathermap.org/api"
echo ""
echo "   3. Restart Docker containers:"
echo "      docker-compose down"
echo "      docker-compose up -d --build"
echo ""

# Ask if user wants to open the file
read -p "Do you want to open .env file now? (Y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code "$ENV_FILE"
    elif command -v nano &> /dev/null; then
        nano "$ENV_FILE"
    elif command -v vi &> /dev/null; then
        vi "$ENV_FILE"
    else
        echo "Please edit .env file manually"
    fi
fi
