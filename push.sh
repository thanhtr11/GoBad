#!/bin/bash

# GoBad Push Script
# This script helps push the GoBad application to GitHub and DockerHub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}GoBad Push to GitHub and DockerHub${NC}"
echo -e "${YELLOW}========================================${NC}"

# GitHub Configuration
echo -e "\n${GREEN}Step 1: GitHub Configuration${NC}"
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter your GitHub repository name (e.g., gobad): " GITHUB_REPO
GITHUB_URL="https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}.git"

echo -e "\nGitHub URL: ${GITHUB_URL}"
read -p "Is this correct? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting..."
    exit 1
fi

# Add GitHub remote
echo -e "\n${GREEN}Adding GitHub remote...${NC}"
git remote remove origin 2>/dev/null || true
git remote add origin "$GITHUB_URL"
git branch -M main

echo -e "${GREEN}Pushing to GitHub...${NC}"
git push -u origin main

echo -e "${GREEN}✓ Successfully pushed to GitHub!${NC}"

# DockerHub Configuration
echo -e "\n${GREEN}Step 2: DockerHub Configuration${NC}"
read -p "Enter your DockerHub username: " DOCKERHUB_USERNAME

# Login to DockerHub
echo -e "\n${GREEN}Logging into DockerHub...${NC}"
docker login

# Build and push backend
echo -e "\n${GREEN}Building backend image...${NC}"
docker build -t "${DOCKERHUB_USERNAME}/gobad-backend:latest" -t "${DOCKERHUB_USERNAME}/gobad-backend:v1.0.0" ./backend

echo -e "${GREEN}Pushing backend image to DockerHub...${NC}"
docker push "${DOCKERHUB_USERNAME}/gobad-backend:latest"
docker push "${DOCKERHUB_USERNAME}/gobad-backend:v1.0.0"

# Build and push frontend
echo -e "\n${GREEN}Building frontend image...${NC}"
docker build -t "${DOCKERHUB_USERNAME}/gobad-frontend:latest" -t "${DOCKERHUB_USERNAME}/gobad-frontend:v1.0.0" ./frontend

echo -e "${GREEN}Pushing frontend image to DockerHub...${NC}"
docker push "${DOCKERHUB_USERNAME}/gobad-frontend:latest"
docker push "${DOCKERHUB_USERNAME}/gobad-frontend:v1.0.0"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Successfully pushed to GitHub and DockerHub!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\nYour images are available at:"
echo -e "  Backend:  docker.io/${DOCKERHUB_USERNAME}/gobad-backend:latest"
echo -e "  Frontend: docker.io/${DOCKERHUB_USERNAME}/gobad-frontend:latest"

echo -e "\nNext steps:"
echo -e "1. Update docker-compose.yml with your image names"
echo -e "2. Deploy to your server using: docker-compose pull && docker-compose up -d"
