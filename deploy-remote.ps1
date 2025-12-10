# GoBad Remote Deployment Script (PowerShell)
# Run this to deploy GoBad to a remote server via SSH

param(
    [string]$RemoteHost = "192.168.88.14",
    [string]$RemoteUser = "root",
    [string]$RemoteDir = "/opt/gobad",
    [int]$BackendPort = 5983,
    [int]$FrontendPort = 3865
)

$ErrorActionPreference = "Stop"

Write-Host "=== GoBad Remote Deployment (PowerShell) ===" -ForegroundColor Cyan
Write-Host "Remote Host: $RemoteHost"
Write-Host "Remote User: $RemoteUser"
Write-Host "Remote Directory: $RemoteDir"
Write-Host "Backend Port: $BackendPort"
Write-Host "Frontend Port: $FrontendPort"
Write-Host ""

# Check if SSH is available
try {
    ssh -V | Out-Null
} catch {
    Write-Host "ERROR: SSH is not available. Please install OpenSSH Client." -ForegroundColor Red
    exit 1
}

Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh "$RemoteUser@$RemoteHost" "mkdir -p $RemoteDir"

Write-Host "Checking if GoBad is already cloned..." -ForegroundColor Yellow
$repoExists = ssh "$RemoteUser@$RemoteHost" "test -d $RemoteDir/GoBad && echo 'exists' || echo 'notexists'"

if ($repoExists -eq "exists") {
    Write-Host "Updating existing GoBad installation..." -ForegroundColor Yellow
    ssh "$RemoteUser@$RemoteHost" "cd $RemoteDir/GoBad && git pull origin main"
} else {
    Write-Host "Cloning GoBad repository..." -ForegroundColor Yellow
    ssh "$RemoteUser@$RemoteHost" "cd $RemoteDir && git clone https://github.com/thanhtr11/GoBad.git"
}

Write-Host "Creating .env file..." -ForegroundColor Yellow
$envContent = @"
# Database Configuration
POSTGRES_USER=gobad
POSTGRES_PASSWORD=gobad_password
POSTGRES_DB=gobad_db

# Node Environment
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d

# Port Configuration
BACKEND_PORT=$BackendPort
SERVER_PORT=$FrontendPort

# API URL for Frontend
VITE_API_URL=http://$RemoteHost`:$BackendPort/api
"@

# Create temporary .env file locally and copy it
$tempEnv = New-TemporaryFile | Rename-Item -NewName { $_.Name -replace 'tmp$', 'env' } -PassThru
Set-Content -Path $tempEnv -Value $envContent

# Copy .env to remote server
scp $tempEnv "$RemoteUser@$RemoteHost`:$RemoteDir/GoBad/.env"
Remove-Item $tempEnv

Write-Host "Stopping existing containers..." -ForegroundColor Yellow
ssh "$RemoteUser@$RemoteHost" "cd $RemoteDir/GoBad && docker-compose down 2>/dev/null || true"

Write-Host "Starting Docker containers..." -ForegroundColor Yellow
ssh "$RemoteUser@$RemoteHost" "cd $RemoteDir/GoBad && docker-compose up -d"

Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Frontend: http://$RemoteHost`:$FrontendPort" -ForegroundColor Cyan
Write-Host "Backend: http://$RemoteHost`:$BackendPort/api" -ForegroundColor Cyan
Write-Host "Prisma Studio: http://$RemoteHost`:5555" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view logs on remote server:" -ForegroundColor Yellow
Write-Host "  ssh $RemoteUser@$RemoteHost"
Write-Host "  cd $RemoteDir/GoBad"
Write-Host "  docker-compose logs -f"
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose down"
