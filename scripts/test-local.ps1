param (
    [switch]$Docker,
    [switch]$SkipMigrations,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Content OS Local Test Orchestrator" -ForegroundColor Cyan
Write-Host "----------------------------------------"

if ($Clean) {
    Write-Host "🧹 Cleaning environment..." -ForegroundColor Yellow
    if ($Docker) {
        docker-compose down -v --remove-orphans
    }
    Remove-Item -Path "node_modules", "dist", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue
}

# 1. Check Environment
if (!(Test-Path ".env")) {
    Write-Host "⚠️  .env not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "👉 Please fill in .env with your credentials before proceeding." -ForegroundColor Red
    exit
}

# 2. Dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Magenta
    npm install --legacy-peer-deps
}

# 3. Database Layer
if ($Docker) {
    Write-Host "🐳 Starting Docker services..." -ForegroundColor Blue
    docker-compose up -d postgres redis
    Write-Host "⏳ Waiting for database to be ready..."
    Start-Sleep -Seconds 5
} else {
    Write-Host "💻 Assuming local PostgreSQL is running (check DATABASE_URL in .env)" -ForegroundColor Gray
}

# 4. Prisma & Schema
if (!$SkipMigrations) {
    Write-Host "🔄 Running database migrations..." -ForegroundColor Green
    npx prisma generate
    npx prisma db push
}

# 5. Start Application
Write-Host "✨ Starting application in dev mode..." -ForegroundColor Cyan
if ($Docker) {
    Write-Host "🐳 App will run inside Docker container"
    docker-compose up app
} else {
    Write-Host "🖥️  App will run locally"
    npm run dev
}
