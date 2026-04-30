$ErrorActionPreference = "Stop"

Write-Host "🎭 Content OS End-to-End Test Suite" -ForegroundColor Cyan
Write-Host "----------------------------------------"

# 1. Install Playwright if needed (should be done by install script, but safe check)
if (!(Test-Path "node_modules\@playwright\test")) {
    Write-Host "📦 Installing Playwright dependencies..." -ForegroundColor Yellow
    npm install -D @playwright/test --legacy-peer-deps
    npx playwright install --with-deps
}

# 2. Build application for production testing
Write-Host "🏗️  Building application for E2E testing..." -ForegroundColor Magenta
npm run build

# 3. Ensure Database is running (assuming Docker for reliable testing)
Write-Host "🐳 Ensuring Docker services are active..." -ForegroundColor Blue
docker-compose up -d postgres redis
Start-Sleep -Seconds 3
npx prisma db push

# 4. Start Server in background
Write-Host "🌐 Starting production server for testing..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "npm" -ArgumentList "run start" -PassThru -NoNewWindow
Write-Host "⏳ Waiting for server to respond on http://localhost:3000..."
npx wait-on http://localhost:3000 --timeout 60000

# 5. Run Playwright Tests
try {
    Write-Host "🚀 Running Playwright tests..." -ForegroundColor Green
    npx playwright test
} catch {
    Write-Host "❌ Tests failed!" -ForegroundColor Red
} finally {
    Write-Host "🛑 Shutting down server..." -ForegroundColor Cyan
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Done!" -ForegroundColor Cyan
