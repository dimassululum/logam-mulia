param(
  [switch]$SkipBuild,
  [switch]$SkipMigrate
)

$ErrorActionPreference = "Stop"
$env:COMPOSE_BAKE = "false"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Confirm = Read-Host "Type DEPLOY-PROD to continue"
if ($Confirm -ne "DEPLOY-PROD") {
  throw "Production deploy cancelled."
}

$Project = "logam-mulia-prod"
$EnvFile = ".env.production"
$ComposeArgs = @("-p", $Project, "--env-file", $EnvFile, "-f", "docker-compose.stack.yml", "-f", "docker-compose.prod.yml")

function Invoke-Compose {
  & docker.exe compose @ComposeArgs @args
  if ($LASTEXITCODE -ne 0) {
    throw "docker compose $($args -join ' ') failed with exit code $LASTEXITCODE."
  }
}

if (-not (Test-Path $EnvFile)) {
  throw "Missing $EnvFile. Copy .env.production.example to $EnvFile and fill secrets first."
}

if (-not $SkipBuild) {
  Invoke-Compose build
}

Invoke-Compose up -d db

$dbReady = $false
for ($attempt = 1; $attempt -le 60; $attempt++) {
  Start-Sleep -Seconds 2
  docker.exe compose @ComposeArgs exec -T db pg_isready -U postgres | Out-Null
  if ($LASTEXITCODE -eq 0) {
    $dbReady = $true
    break
  }
}

if (-not $dbReady) {
  throw "Database did not become ready within 120 seconds."
}

if (-not $SkipMigrate) {
  Invoke-Compose run --rm backend npx prisma migrate deploy
}

Invoke-Compose up -d
Invoke-Compose ps
