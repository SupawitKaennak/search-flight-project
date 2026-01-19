# Docker Setup Script for Windows PowerShell
# สคริปต์ช่วยในการ setup Docker environment

Write-Host "🚀 Flight Search - Docker Setup" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "📋 Checking Docker Desktop..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check and stop processes using required ports
Write-Host ""
Write-Host "📋 Checking for processes using ports 3000, 3001, 5432..." -ForegroundColor Yellow
$ports = @(3000, 3001, 5432)
$portsInUse = $false

foreach ($port in $ports) {
    $connections = netstat -ano | findstr ":$port" | findstr "LISTENING"
    if ($connections) {
        $portsInUse = $true
        Write-Host "⚠️  Port $port is in use" -ForegroundColor Yellow
    }
}

if ($portsInUse) {
    Write-Host ""
    $response = Read-Host "Some ports are in use. Stop them? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        & "$PSScriptRoot\stop-port.ps1"
    } else {
        Write-Host "⚠️  Continuing anyway. If Docker fails, stop the processes manually." -ForegroundColor Yellow
    }
}

# Check if .env files exist
Write-Host ""
Write-Host "📋 Checking environment files..." -ForegroundColor Yellow

if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found. Creating from env.example..." -ForegroundColor Yellow
    Copy-Item "backend\env.example" "backend\.env"
    Write-Host "✅ Created backend\.env" -ForegroundColor Green
} else {
    Write-Host "✅ backend\.env exists" -ForegroundColor Green
}

if (-not (Test-Path "frontend\.env.local")) {
    Write-Host "⚠️  frontend\.env.local not found. Creating from env.example..." -ForegroundColor Yellow
    Copy-Item "frontend\env.example" "frontend\.env.local"
    Write-Host "✅ Created frontend\.env.local" -ForegroundColor Green
} else {
    Write-Host "✅ frontend\.env.local exists" -ForegroundColor Green
}

# Build and start containers
Write-Host ""
Write-Host "🏗️  Building and starting Docker containers..." -ForegroundColor Yellow
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Docker containers started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    Write-Host ""
    Write-Host "📊 Container status:" -ForegroundColor Cyan
    docker-compose ps
    
    Write-Host ""
    Write-Host "🌐 Services are available at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "   Backend:  http://localhost:3001/api" -ForegroundColor White
    Write-Host "   Database: localhost:5432" -ForegroundColor White
    
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Run database migrations:" -ForegroundColor White
    Write-Host "      docker-compose exec backend npm run migrate" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. View logs:" -ForegroundColor White
    Write-Host "      docker-compose logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   3. Stop services:" -ForegroundColor White
    Write-Host "      docker-compose down" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Failed to start Docker containers" -ForegroundColor Red
    Write-Host "Check logs with: docker-compose logs" -ForegroundColor Yellow
    exit 1
}
