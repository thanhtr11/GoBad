#!/bin/bash

# GoBad Remote Deployment Script
# Run this on the remote server to deploy GoBad

set -e

echo "=== GoBad Remote Deployment ==="

# Configuration
INSTALL_DIR="${1:-.}"
SERVER_IP="${2:-192.168.88.14}"
BACKEND_PORT="${3:-5983}"
FRONTEND_PORT="${4:-3865}"

echo "Install directory: $INSTALL_DIR"
echo "Server IP: $SERVER_IP"
echo "Backend port: $BACKEND_PORT"
echo "Frontend port: $FRONTEND_PORT"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone or update repository
if [ -d "GoBad" ]; then
    echo "Updating existing GoBad installation..."
    cd GoBad
    git pull origin main
else
    echo "Cloning GoBad repository..."
    git clone https://github.com/thanhtr11/GoBad.git
    cd GoBad
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
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
BACKEND_PORT=$BACKEND_PORT
SERVER_PORT=$FRONTEND_PORT

# API URL for Frontend
VITE_API_URL=http://$SERVER_IP:$BACKEND_PORT/api
EOF
    echo ".env file created"
else
    echo ".env file already exists"
fi

# Stop existing containers (if any)
echo "Stopping existing containers..."
docker-compose down || true

# Start containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
echo ""
echo "=== Deployment Complete ==="
echo "Frontend: http://$SERVER_IP:$FRONTEND_PORT"
echo "Backend: http://$SERVER_IP:$BACKEND_PORT/api"
echo "Prisma Studio: http://$SERVER_IP:5555"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
