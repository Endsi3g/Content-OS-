$ErrorActionPreference = "Continue"

Write-Host "🧼 Content OS Deep Cleaning & Fresh Install" -ForegroundColor Cyan
Write-Host "-------------------------------------------"

# 1. Stop all processes
Write-Host "🛑 Stopping running services..." -ForegroundColor Yellow
docker-compose down -v --remove-orphans 2>$null
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -Force -ErrorAction SilentlyContinue

# 2. Delete build and dependency folders
Write-Host "🗑️  Deleting node_modules and build artifacts..." -ForegroundColor Yellow
$FoldersToDelete = @("node_modules", "dist", "package-lock.json", ".vite")
foreach ($folder in $FoldersToDelete) {
    if (Test-Path $folder) {
        Write-Host "  Removing $folder..."
        Remove-Item -Path $folder -Recurse -Force
    }
}

# 3. Clean npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

# 4. Fresh Install
Write-Host "📦 Installing dependencies from scratch..." -ForegroundColor Magenta
npm install --legacy-peer-deps

# 5. Initialize Prisma
Write-Host "🔄 Initializing Prisma Client..." -ForegroundColor Green
npx prisma generate

Write-Host "✨ System is now clean and ready!" -ForegroundColor Green
Write-Host "🚀 Run '.\scripts\test-local.ps1' to start dev." -ForegroundColor Cyan
