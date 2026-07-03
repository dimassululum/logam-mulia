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

$Project = "logam-mulia"
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

$EnvValues = @{}
Get-Content $EnvFile | ForEach-Object {
  $Line = $_.Trim()
  if ($Line -eq "" -or $Line.StartsWith("#") -or -not $Line.Contains("=")) {
    return
  }

  $Parts = $Line.Split("=", 2)
  $EnvValues[$Parts[0].Trim()] = $Parts[1].Trim().Trim('"')
}

$TunnelConfig = $EnvValues["CLOUDFLARED_CONFIG_FILE"]
if (-not $TunnelConfig) {
  $TunnelConfig = "./cloudflared/config.prod.yml"
}

$TunnelCredentials = $EnvValues["CLOUDFLARED_CREDENTIALS_FILE"]
if (-not $TunnelCredentials) {
  $TunnelCredentials = "./cloudflared/prod-credentials.json"
}

$TunnelConfigPath = Join-Path $Root $TunnelConfig
$TunnelCredentialsPath = Join-Path $Root $TunnelCredentials

if (-not (Test-Path -LiteralPath $TunnelConfigPath -PathType Leaf)) {
  throw "Cloudflare config must be an existing file: $TunnelConfig"
}

if (-not (Test-Path -LiteralPath $TunnelCredentialsPath -PathType Leaf)) {
  throw "Cloudflare credentials must be an existing file, not a directory: $TunnelCredentials"
}

$TunnelConfigContent = Get-Content -LiteralPath $TunnelConfigPath -Raw
if ($TunnelConfigContent -match "REPLACE_WITH|YOUR_TUNNEL_ID") {
  throw "Cloudflare config still contains a placeholder tunnel ID: $TunnelConfig"
}

$PaymentProxySshKey = $EnvValues["PAYMENT_PROXY_SSH_KEY_PATH"]
if (-not $PaymentProxySshKey) {
  throw "Missing PAYMENT_PROXY_SSH_KEY_PATH in $EnvFile."
}

if (-not (Test-Path -LiteralPath $PaymentProxySshKey -PathType Leaf)) {
  throw "Payment proxy SSH key must be an existing file: $PaymentProxySshKey"
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
