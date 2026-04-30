param (
    [switch]$Docker,
    [switch]$SkipMigrations,
    [switch]$Clean,
    [switch]$SkipEnv
)

$ErrorActionPreference = "Stop"

Write-Host "[LAUNCH] Content OS Local Test Orchestrator" -ForegroundColor Cyan
Write-Host "-------------------------------------------"

if ($Clean) {
    Write-Host "[CLEAN] Cleaning environment..." -ForegroundColor Yellow
    if ($Docker) {
        docker-compose down -v --remove-orphans
    }
    Remove-Item -Path "node_modules", "dist", "package-lock.json" -Recurse -Force -ErrorAction SilentlyContinue
}

# 1. Check Environment
if (!(Test-Path ".env") -and !$SkipEnv) {
    Write-Host "[WARN] .env not found. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "[ACTION] Please fill in .env with your credentials before proceeding, or use -SkipEnv to test UI only." -ForegroundColor Red
    exit
}

if ($SkipEnv) {
    Write-Host "[INFO] Skipping .env validation. App will run in UI-only/mock mode if configured." -ForegroundColor Blue
    $env:VITE_MOCK_MODE="true"
}

# 2. Dependencies
if (!(Test-Path "node_modules")) {
    Write-Host "[DEPS] Installing dependencies with pnpm..." -ForegroundColor Magenta
    pnpm install
}

# 3. Database Layer
if ($Docker) {
    Write-Host "[DOCKER] Starting Docker services..." -ForegroundColor Blue
    docker-compose up -d postgres redis
    Write-Host "[WAIT] Waiting for database to be ready..."
    Start-Sleep -Seconds 5
} else {
    Write-Host "[LOCAL] Assuming local PostgreSQL is running (check DATABASE_URL in .env)" -ForegroundColor Gray
}

# 4. Prisma and Schema
if (!$SkipMigrations -and !$SkipEnv) {
    Write-Host "[DB] Running database migrations..." -ForegroundColor Green
    pnpm exec prisma generate
    pnpm exec prisma db push
} elseif ($SkipEnv) {
    Write-Host "[DB] Skipping database migrations due to UI mock mode (-SkipEnv)." -ForegroundColor Gray
}

# 5. Start Application
Write-Host "[START] Starting application in dev mode..." -ForegroundColor Cyan
if ($Docker) {
    Write-Host "[DOCKER] App will run inside Docker container"
    docker-compose up app
} else {
    Write-Host "[LOCAL] App will run locally with pnpm"
    pnpm run dev
}
