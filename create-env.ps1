# Script to create .env file from .env.example
# สคริปต์สำหรับสร้างไฟล์ .env จาก .env.example

Write-Host "📝 Creating .env file..." -ForegroundColor Cyan
Write-Host ""

$envExamplePath = Join-Path $PSScriptRoot ".env.example"
$envPath = Join-Path $PSScriptRoot ".env"

# Check if .env.example exists
if (-not (Test-Path $envExamplePath)) {
    Write-Host "⚠️  .env.example not found. Creating default .env.example..." -ForegroundColor Yellow
    
    # Create default .env.example
    @"
# Environment Variables for Docker Compose
# Copy this file to .env and update the values

# ============================================
# OpenWeatherMap API Key (for Weather Display)
# ============================================
# Get your free API key from: https://openweathermap.org/api
# Free tier allows 60 calls/minute and 1,000,000 calls/month
# Leave empty if you don't want to use weather features
NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_api_key_here
"@ | Out-File -FilePath $envExamplePath -Encoding UTF8
    
    Write-Host "✅ Created .env.example" -ForegroundColor Green
}

# Check if .env already exists
if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $response = Read-Host "Do you want to overwrite it? (Y/N)"
    if ($response -ne 'Y' -and $response -ne 'y') {
        Write-Host "❌ Cancelled. Existing .env file is preserved." -ForegroundColor Red
        exit 0
    }
}

# Copy .env.example to .env
try {
    Copy-Item $envExamplePath $envPath -Force
    Write-Host "✅ Created .env file from .env.example" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Edit .env file and add your OpenWeatherMap API key:" -ForegroundColor White
    Write-Host "      NEXT_PUBLIC_OPENWEATHERMAP_API_KEY=your_actual_api_key_here" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Get API key from: https://openweathermap.org/api" -ForegroundColor White
    Write-Host ""
    Write-Host "   3. Restart Docker containers:" -ForegroundColor White
    Write-Host "      docker-compose down" -ForegroundColor Gray
    Write-Host "      docker-compose up -d --build" -ForegroundColor Gray
    Write-Host ""
    
    # Ask if user wants to open the file
    $openFile = Read-Host "Do you want to open .env file now? (Y/N)"
    if ($openFile -eq 'Y' -or $openFile -eq 'y') {
        notepad $envPath
    }
} catch {
    Write-Host "❌ Error creating .env file: $_" -ForegroundColor Red
    exit 1
}
