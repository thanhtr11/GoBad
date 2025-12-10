#!/bin/bash

# GoBad Quick Deploy Script
# Usage: bash DEPLOY_TO_SERVER.sh

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         GoBad - Deploy to Server Script                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Install Docker first: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "✅ Docker found"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "Install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker Compose found"
echo ""

# Show current status
echo "📊 Current Services Status:"
docker-compose ps || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 Deploy Options:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1) Start all services"
echo "2) Stop all services"
echo "3) Restart services"
echo "4) View logs"
echo "5) Run setup (interactive)"
echo "6) Database backup"
echo "0) Exit"
echo ""

read -p "Select option: " choice

case $choice in
    1)
        echo "Starting services..."
        docker-compose up -d
        sleep 10
        docker-compose ps
        echo ""
        echo "✅ Services started!"
        echo "Frontend: http://localhost:3865"
        echo "Backend: http://localhost:5983"
        ;;
    2)
        echo "Stopping services..."
        docker-compose down
        echo "✅ Services stopped!"
        ;;
    3)
        echo "Restarting services..."
        docker-compose restart
        sleep 5
        docker-compose ps
        echo "✅ Services restarted!"
        ;;
    4)
        read -p "View logs for (frontend/backend/db/all)? " service
        case $service in
            frontend) docker-compose logs -f frontend ;;
            backend) docker-compose logs -f backend ;;
            db) docker-compose logs -f db ;;
            *) docker-compose logs -f ;;
        esac
        ;;
    5)
        if [ -f "setup-docker.sh" ]; then
            bash setup-docker.sh
        else
            echo "❌ setup-docker.sh not found!"
        fi
        ;;
    6)
        echo "Backing up database..."
        docker-compose exec db pg_dump -U gobad gobad_db > backup-$(date +%Y%m%d-%H%M%S).sql
        echo "✅ Backup created!"
        ls -lh backup-*.sql | tail -1
        ;;
    0)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📖 For more help, read:"
echo "   - QUICK_START.md"
echo "   - DOCKER_DEPLOYMENT_GUIDE.md"
echo "   - DOCKER_TROUBLESHOOTING.md"
echo "═══════════════════════════════════════════════════════════════"
