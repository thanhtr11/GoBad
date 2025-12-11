#!/bin/bash

# GoBad Quick Rebuild & Deploy Script
# This script rebuilds the Docker containers with the latest code

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       GoBad - Quick Rebuild & Deploy Script                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Code pulled successfully${NC}"
else
    echo -e "${RED}✗ Failed to pull code${NC}"
    exit 1
fi

echo ""

# Step 2: Stop current containers
echo -e "${YELLOW}Step 2: Stopping current containers...${NC}"
docker-compose -f docker-compose.prod.yml down
echo -e "${GREEN}✓ Containers stopped${NC}"

echo ""

# Step 3: Rebuild containers
echo -e "${YELLOW}Step 3: Building new Docker images (this may take a few minutes)...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker images${NC}"
    exit 1
fi

echo ""

# Step 4: Start new containers
echo -e "${YELLOW}Step 4: Starting new containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started${NC}"
else
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi

echo ""

# Step 5: Wait for services to be ready
echo -e "${YELLOW}Step 5: Waiting for services to be ready...${NC}"
sleep 10

# Step 6: Verify services
echo -e "${YELLOW}Step 6: Verifying services...${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}Step 7: Checking recent logs...${NC}"
echo "Backend logs:"
docker logs gobad_backend_prod --tail 20 || true

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ✓ Deployment completed successfully!              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "API should now be available at:"
echo "  - https://gobad.thanhtr.com/api/"
echo "  - Local: http://localhost:5983/"
echo ""
echo "To view logs in real-time:"
echo "  docker logs -f gobad_backend_prod"
echo ""
