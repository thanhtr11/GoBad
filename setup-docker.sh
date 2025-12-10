#!/bin/bash

# GoBad Docker Quick Setup Script
# This script helps configure and deploy GoBad on a server

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 GoBad Docker Setup Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Get server IP
read -p "Enter your server IP address (or domain name): " SERVER_IP

if [ -z "$SERVER_IP" ]; then
    echo "❌ Server IP is required!"
    exit 1
fi

# Get database password
read -sp "Enter database password (at least 12 characters): " DB_PASSWORD
echo ""

if [ ${#DB_PASSWORD} -lt 12 ]; then
    echo "❌ Password must be at least 12 characters!"
    exit 1
fi

# Generate JWT secret
JWT_SECRET=$(openssl rand -hex 32)

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "Configuration Summary:"
echo "═══════════════════════════════════════════════════════════════"
echo "Server IP: $SERVER_IP"
echo "Frontend URL: http://$SERVER_IP:3865"
echo "Backend API: http://$SERVER_IP:5983/api"
echo "Database Password: ••••••••••••"
echo "JWT Secret: $JWT_SECRET"
echo ""

read -p "Continue with this configuration? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ Setup cancelled"
    exit 0
fi

# Create .env file
cat > .env << EOF
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_IP=$SERVER_IP
SERVER_PORT=3865
BACKEND_PORT=5983

# Database Configuration
POSTGRES_USER=gobad
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=gobad_db

# Backend Configuration
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# Frontend Configuration
VITE_API_URL=http://$SERVER_IP:5983/api
EOF

echo "✅ Created .env file"
echo ""

# Start docker-compose
echo "📦 Starting Docker containers..."
docker-compose down 2>/dev/null || true
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start (30 seconds)..."
sleep 30

# Check if services are running
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 Service Status:"
echo "═══════════════════════════════════════════════════════════════"
docker-compose ps

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ Setup Complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Access your application:"
echo "  🌐 Frontend: http://$SERVER_IP:3865"
echo "  🔌 Backend API: http://$SERVER_IP:5983"
echo "  📊 Database Studio: http://$SERVER_IP:5555"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop app: docker-compose down"
echo "  Restart app: docker-compose restart"
echo ""
echo "Your configuration has been saved to: .env"
echo "Keep this file safe! It contains your database password and secrets."
echo ""
