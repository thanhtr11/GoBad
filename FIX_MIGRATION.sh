#!/bin/bash

# Fix Tournament Migration on Production Server
# Run these commands on your production server

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      GoBad - Apply Missing Tournament Migration                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Option 1: Apply migration using docker-compose
echo "Option 1: Using Docker Compose (Recommended)"
echo "=============================================="
echo ""
echo "Run these commands on production server:"
echo ""
echo "cd /path/to/GoBad"
echo "docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy"
echo ""
echo ""

# Option 2: Restart backend (migrations run automatically)
echo "Option 2: Restart Backend Container"
echo "===================================="
echo ""
echo "cd /path/to/GoBad"
echo "docker-compose -f docker-compose.prod.yml restart backend"
echo "sleep 10"
echo "docker logs gobad_backend_prod --tail 20"
echo ""
echo ""

# Option 3: Complete rebuild
echo "Option 3: Complete Rebuild (if above doesn't work)"
echo "=================================================="
echo ""
echo "cd /path/to/GoBad"
echo "git pull origin main"
echo "docker-compose -f docker-compose.prod.yml down"
echo "docker-compose -f docker-compose.prod.yml build --no-cache"
echo "docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo ""

# Verification commands
echo "Verification Commands:"
echo "====================="
echo ""
echo "# Check if column exists now"
echo "docker exec gobad_db_prod psql -U gobad -d gobad_db -c \"\\d tournaments\""
echo ""
echo "# Test the endpoint"
echo "curl -s http://localhost:5000/api/tournaments/club/f5bee2cb-18c0-4333-904b-f00a5f859bf8"
echo ""
