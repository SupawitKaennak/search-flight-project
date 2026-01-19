# Script to stop processes using ports 3000, 3001, and 5432
Write-Host "🛑 Stopping processes on ports 3000, 3001, and 5432..." -ForegroundColor Yellow

$ports = @(3000, 3001, 5432)

foreach ($port in $ports) {
    $connections = netstat -ano | findstr ":$port" | findstr "LISTENING"
    
    if ($connections) {
        Write-Host "`nPort $port is in use:" -ForegroundColor Cyan
        
        foreach ($line in $connections) {
            $parts = $line -split '\s+'
            $pid = $parts[-1]
            
            if ($pid -match '^\d+$') {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  PID $pid : $($process.ProcessName)" -ForegroundColor Yellow
                    
                    try {
                        Stop-Process -Id $pid -Force -ErrorAction Stop
                        Write-Host "  ✅ Stopped PID $pid" -ForegroundColor Green
                    } catch {
                        Write-Host "  ⚠️  Could not stop PID $pid : $_" -ForegroundColor Red
                    }
                }
            }
        }
    } else {
        Write-Host "Port $port is free" -ForegroundColor Green
    }
}

Write-Host "`n✅ Done!" -ForegroundColor Green
Write-Host "You can now run: docker-compose up -d" -ForegroundColor Cyan
