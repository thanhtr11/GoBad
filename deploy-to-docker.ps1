# GoBad Docker Deployment Script for Windows PowerShell
# Target: 192.168.88.14
# Usage: .\deploy-to-docker.ps1

param(
    [string]$ServerIP = "192.168.88.14",
    [string]$SSHUser = "root",
    [int]$SSHPort = 22,
    [string]$Action = "deploy"
)

$WarningPreference = "SilentlyContinue"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         GoBad - Docker Deployment Script (Windows)            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DeploymentConfig = @{
    "ServerIP"          = $ServerIP
    "SSHUser"           = $SSHUser
    "SSHPort"           = $SSHPort
    "FrontendPort"      = 3865
    "BackendPort"       = 5983
    "DatabasePort"      = 5432
    "DeploymentPath"    = "/home/$SSHUser/GoBad"
}

Write-Host "📋 Deployment Configuration:" -ForegroundColor Yellow
Write-Host "   Server IP:     $($DeploymentConfig.ServerIP)"
Write-Host "   SSH User:      $($DeploymentConfig.SSHUser)"
Write-Host "   Frontend Port: $($DeploymentConfig.FrontendPort)"
Write-Host "   Backend Port:  $($DeploymentConfig.BackendPort)"
Write-Host ""

function Test-SSHConnection {
    Write-Host "🔍 Testing SSH connection..." -ForegroundColor Cyan
    try {
        $result = ssh -o ConnectTimeout=5 "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) "echo OK"
        if ($result -eq "OK") {
            Write-Host "✅ SSH connection successful" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ SSH connection failed: $_" -ForegroundColor Red
        return $false
    }
}

function Test-DockerRemote {
    Write-Host "🐳 Testing Docker on remote server..." -ForegroundColor Cyan
    try {
        $result = ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) "docker --version"
        Write-Host "✅ Docker found: $result" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Docker not found on remote server" -ForegroundColor Red
        return $false
    }
}

function Deploy-Application {
    Write-Host ""
    Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
    Write-Host ""

    # Step 1: Clone/Update repository
    Write-Host "📦 Step 1: Clone/Update repository..." -ForegroundColor Yellow
    $cloneScript = @"
if [ -d ~/GoBad ]; then
    echo "Repository exists, pulling latest changes..."
    cd ~/GoBad
    git pull origin main
else
    echo "Cloning repository..."
    cd ~
    git clone https://github.com/thanhtr11/GoBad.git
    cd GoBad
fi
"@
    
    ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $cloneScript
    
    # Step 2: Copy .env file
    Write-Host "⚙️  Step 2: Setting up environment variables..." -ForegroundColor Yellow
    $envContent = @"
POSTGRES_USER=gobad
POSTGRES_PASSWORD=gobad_secure_password_123!
POSTGRES_DB=gobad_db
BACKEND_PORT=5983
SERVER_PORT=3865
NODE_ENV=production
JWT_SECRET=$(Get-Random -Minimum 100000000000 -Maximum 999999999999)_$(Get-Random -Minimum 100000000000 -Maximum 999999999999)
JWT_EXPIRES_IN=7d
VITE_API_URL=http://$($DeploymentConfig.ServerIP):5983/api
"@

    # Create temporary .env file locally
    $tempEnvPath = "$env:TEMP\.env"
    $envContent | Out-File -FilePath $tempEnvPath -Encoding UTF8 -NoNewline
    
    # Copy to remote
    Write-Host "   Uploading .env file..." -ForegroundColor Gray
    scp -P $($DeploymentConfig.SSHPort) $tempEnvPath "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP):~/GoBad/.env" 2>&1 | Out-Null
    Remove-Item $tempEnvPath -Force
    
    # Step 3: Pull images and start containers
    Write-Host "🔄 Step 3: Starting Docker containers..." -ForegroundColor Yellow
    $dockerScript = @"
cd ~/GoBad
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
"@
    
    ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $dockerScript
    
    # Step 4: Verify deployment
    Write-Host "✔️  Step 4: Verifying deployment..." -ForegroundColor Yellow
    $statusScript = @"
cd ~/GoBad
echo "Container Status:"
docker-compose -f docker-compose.prod.yml ps
"@
    
    $status = ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $statusScript
    Write-Host $status
}

function Show-ServiceStatus {
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Cyan
    
    $statusScript = @"
cd ~/GoBad
docker-compose -f docker-compose.prod.yml ps
"@
    
    ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $statusScript
}

function Show-Logs {
    Write-Host ""
    Write-Host "📜 Showing recent logs (last 50 lines)..." -ForegroundColor Cyan
    
    $logScript = @"
cd ~/GoBad
docker-compose -f docker-compose.prod.yml logs --tail 50
"@
    
    ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $logScript
}

function Stop-Services {
    Write-Host ""
    Write-Host "⛔ Stopping all services..." -ForegroundColor Yellow
    
    $stopScript = @"
cd ~/GoBad
docker-compose -f docker-compose.prod.yml down
"@
    
    ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $stopScript
    Write-Host "✅ Services stopped" -ForegroundColor Green
}

function Restart-Services {
    Write-Host ""
    Write-Host "🔄 Restarting services..." -ForegroundColor Yellow
    
    $restartScript = @"
cd ~/GoBad
docker-compose -f docker-compose.prod.yml restart
"@
    
    ssh "$($DeploymentConfig.SSHUser)@$($DeploymentConfig.ServerIP)" -p $($DeploymentConfig.SSHPort) $restartScript
    Write-Host "✅ Services restarted" -ForegroundColor Green
}

function Show-Menu {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Available Commands:" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  deploy      - Deploy application to server" -ForegroundColor White
    Write-Host "  status      - Show container status" -ForegroundColor White
    Write-Host "  logs        - Show application logs" -ForegroundColor White
    Write-Host "  stop        - Stop all services" -ForegroundColor White
    Write-Host "  restart     - Restart services" -ForegroundColor White
    Write-Host "  menu        - Show this menu" -ForegroundColor White
    Write-Host ""
}

# Main execution
if ($Action -eq "interactive") {
    if (-not (Test-SSHConnection)) { exit 1 }
    if (-not (Test-DockerRemote)) { exit 1 }
    
    while ($true) {
        Show-Menu
        $command = Read-Host "Enter command"
        
        switch ($command.ToLower()) {
            "deploy" { Deploy-Application; break }
            "status" { Show-ServiceStatus }
            "logs" { Show-Logs }
            "stop" { Stop-Services }
            "restart" { Restart-Services }
            "menu" { Show-Menu }
            default { Write-Host "Unknown command" -ForegroundColor Red }
        }
    }
}
else {
    # Non-interactive mode
    if (-not (Test-SSHConnection)) { exit 1 }
    if (-not (Test-DockerRemote)) { exit 1 }
    
    switch ($Action.ToLower()) {
        "deploy" { Deploy-Application }
        "status" { Show-ServiceStatus }
        "logs" { Show-Logs }
        "stop" { Stop-Services }
        "restart" { Restart-Services }
        default { Deploy-Application }
    }
}

Write-Host ""
Write-Host "📍 Access URLs:" -ForegroundColor Green
Write-Host "   Frontend:  http://$($DeploymentConfig.ServerIP):$($DeploymentConfig.FrontendPort)" -ForegroundColor Green
Write-Host "   Backend:   http://$($DeploymentConfig.ServerIP):$($DeploymentConfig.BackendPort)/api" -ForegroundColor Green
Write-Host ""
