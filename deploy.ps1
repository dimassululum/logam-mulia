# ============================================
# Logam Mulia Deployment Script
# Jalankan dari folder project:
#   cd C:\dhlb-server\project\logam-mulia
#   .\deploy.ps1
# ============================================

Write-Host "=== Logam Mulia Deployment ===" -ForegroundColor Cyan

# Step 1: Matikan proses manual yang mungkin masih jalan di port 4000/5000
Write-Host "[1/4] Menghentikan proses lama di port 4000 dan 5000..." -ForegroundColor Yellow
$port4000 = (netstat -ano | Select-String ":4000 " | Select-String "LISTENING") -replace '.*LISTENING\s+', ''
$port5000 = (netstat -ano | Select-String ":5000 " | Select-String "LISTENING") -replace '.*LISTENING\s+', ''
if ($port4000) { Stop-Process -Id $port4000.Trim() -Force -ErrorAction SilentlyContinue }
if ($port5000) { Stop-Process -Id $port5000.Trim() -Force -ErrorAction SilentlyContinue }
Stop-Process -Name "cloudflared" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Build dan jalankan dengan Docker Compose
Write-Host "[2/4] Build dan jalankan container..." -ForegroundColor Yellow
docker compose down 2>$null
docker compose up -d --build

Write-Host "[3/4] Menunggu service sehat..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

# Cek status container
docker compose ps

# Step 4: Selesai
Write-Host ""
Write-Host "=== Deployment Selesai ===" -ForegroundColor Green
Write-Host "Aplikasi bisa diakses di: https://logam-mulia.dhlb41.com" -ForegroundColor Green
Write-Host ""
Write-Host "Akun login:" -ForegroundColor Cyan
Write-Host "  Admin  : admin@logam-mulia-antam.com / admin123456" -ForegroundColor White
Write-Host "  Customer: budi.santoso@gmail.com / customer123" -ForegroundColor White
Write-Host ""
Write-Host "Perintah berguna:" -ForegroundColor Gray
Write-Host "  Lihat log   : docker compose logs -f" -ForegroundColor Gray
Write-Host "  Status      : docker compose ps" -ForegroundColor Gray
Write-Host "  Restart     : docker compose restart" -ForegroundColor Gray
Write-Host "  Stop semua  : docker compose down" -ForegroundColor Gray
