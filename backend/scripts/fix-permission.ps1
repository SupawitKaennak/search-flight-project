# Script สำหรับแก้ปัญหา Permission denied

Write-Host "🔧 Fixing Docker permission issues..." -ForegroundColor Cyan
Write-Host ""

Write-Host "🛑 Stopping containers..." -ForegroundColor Yellow
docker-compose -f ../docker-compose.database.yml down

Write-Host ""
Write-Host "🗑️  Removing old volumes..." -ForegroundColor Yellow
docker-compose -f ../docker-compose.database.yml down -v

Write-Host ""
Write-Host "🧹 Cleaning up old containers..." -ForegroundColor Yellow
docker rm -f flight_search_db 2>$null

Write-Host ""
Write-Host "📦 Removing old images (optional)..." -ForegroundColor Yellow
Write-Host "   (Skipping - keeping image for faster restart)"

Write-Host ""
Write-Host "🚀 Starting fresh container..." -ForegroundColor Yellow
docker-compose -f ../docker-compose.database.yml up -d

Write-Host ""
Write-Host "⏳ Waiting for database to initialize (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "📊 Checking container status..." -ForegroundColor Cyan
docker-compose -f ../docker-compose.database.yml ps

Write-Host ""
Write-Host "📋 Checking logs for errors..." -ForegroundColor Cyan
$logs = docker-compose -f ../docker-compose.database.yml logs --tail=20 postgres
Write-Host $logs

Write-Host ""
if ($logs -match "Permission denied") {
    Write-Host "❌ Still have permission issues. Trying alternative solution..." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Use PostgreSQL image instead of TimescaleDB" -ForegroundColor Yellow
    Write-Host "   Edit ../docker-compose.database.yml and change:" -ForegroundColor Yellow
    Write-Host "   image: postgres:18" -ForegroundColor Yellow
} else {
    Write-Host "✅ Container started successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Test connection: npm run test:db"
    Write-Host "   2. Run migrations: npm run migrate"
}

