# Deployment Instructions

## To deploy the latest changes to production:

### Option 1: Using Docker Compose (Recommended)

```bash
# SSH into production server
ssh user@gobad.thanhtr.com

# Navigate to the project directory
cd /path/to/GoBad

# Pull latest code
git pull origin main

# Rebuild and restart containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Verify the deployment
docker-compose -f docker-compose.prod.yml ps
docker logs gobad_backend_prod --tail 50
```

### Option 2: Manual Restart (if containers already exist)

```bash
# On production server
cd /path/to/GoBad

git pull origin main

# Restart the containers (they will auto-update if volumes are set up correctly)
docker-compose -f docker-compose.prod.yml restart backend
```

### Option 3: Using the deployment script

```bash
cd /path/to/GoBad
bash DEPLOY_TO_SERVER.sh
```

## Important Notes

1. The backend runs on port 5983 in production (mapped from 5000 inside container)
2. The fix for tournament queries has been pushed to GitHub
3. Docker will rebuild the backend with the latest code
4. Database migrations will run automatically on container startup
5. The frontend will automatically use the updated API

## Troubleshooting

If you get a 500 error after deployment:

1. Check backend logs: `docker logs gobad_backend_prod`
2. Verify database connection: `docker logs gobad_db_prod`
3. Restart all services: `docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d`
