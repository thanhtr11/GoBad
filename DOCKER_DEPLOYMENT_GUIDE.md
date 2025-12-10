# 🚀 GoBad Docker Deployment Guide

## Quick Start (Local or Same Machine)

```bash
cd GoBad
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:3865
- Backend API: http://localhost:5983
- Database Studio: http://localhost:5555

---

## Deploy to Another Computer/Server

### Step 1: Prepare the Server

```bash
# SSH into your server
ssh user@your-server-ip

# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (optional, to avoid using sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/thanhtr11/GoBad.git
cd GoBad
```

### Step 3: Configure Environment Variables

Create a `.env` file with your server's IP address:

```bash
# Edit this file
nano .env
```

**Add these lines** (replace `YOUR_SERVER_IP` with your actual server IP):

```env
# Server Configuration
SERVER_HOST=0.0.0.0
SERVER_IP=YOUR_SERVER_IP
SERVER_PORT=3865
BACKEND_PORT=5983

# Database Configuration
POSTGRES_USER=gobad
POSTGRES_PASSWORD=change_me_to_secure_password
POSTGRES_DB=gobad_db

# Backend Configuration
NODE_ENV=production
JWT_SECRET=generate_a_random_string_here
JWT_EXPIRES_IN=7d

# Frontend Configuration - THIS IS CRITICAL!
# Use your server's actual IP address, not localhost
VITE_API_URL=http://YOUR_SERVER_IP:5983/api
```

**Example for IP 192.168.1.100:**

```env
VITE_API_URL=http://192.168.1.100:5983/api
```

### Step 4: Start the Application

```bash
docker-compose up -d

# Verify all containers are running
docker-compose ps

# Check logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Step 5: Access from Another Computer

From any computer on the same network:

- **Frontend:** `http://YOUR_SERVER_IP:3865`
- **Backend API:** `http://YOUR_SERVER_IP:5983`
- **Database Studio:** `http://YOUR_SERVER_IP:5555`

---

## Common Issues & Fixes

### Issue 1: "Cannot reach frontend from another computer"

**Cause:** The frontend is hardcoded to connect to `localhost` instead of the server's IP.

**Fix:** Ensure your `.env` file has the correct `VITE_API_URL`:

```bash
VITE_API_URL=http://YOUR_ACTUAL_SERVER_IP:5983/api
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

### Issue 2: "Connection refused" or "Failed to connect to backend"

**Cause:** The backend port (5983) is blocked by a firewall.

**Fix:** Allow the port through the firewall:

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 5983/tcp
sudo ufw allow 3865/tcp
sudo ufw allow 5432/tcp

# CentOS with firewalld
sudo firewall-cmd --permanent --add-port=5983/tcp
sudo firewall-cmd --permanent --add-port=3865/tcp
sudo firewall-cmd --reload
```

### Issue 3: "Database connection failed"

**Cause:** Incorrect database credentials in `.env`.

**Fix:** Verify your `.env` file matches your `docker-compose.yml` and restart:

```bash
docker-compose down
docker-compose up -d
```

### Issue 4: "Can't connect from the network but localhost works"

**Cause:** The frontend thinks the backend is on a different computer's localhost.

**Solution:** Check the browser DevTools:
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to login
4. Look at the failed requests and check the URL
5. Should show `http://YOUR_SERVER_IP:5983/api`, NOT `http://localhost:5983`

---

## Production Deployment Tips

### Security Checklist

- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Generate a random `JWT_SECRET` (don't use the example)
- [ ] Use a domain name instead of IP address
- [ ] Set up HTTPS/SSL certificates (see below)
- [ ] Use firewall rules to restrict access
- [ ] Keep Docker images updated
- [ ] Set `NODE_ENV=production`

### Enable HTTPS with Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Update docker-compose.yml to use HTTPS ports
# Frontend: port 443:3000
# Backend: port 443:5000
# And update VITE_API_URL to https://
```

### Backup Database

```bash
# Backup PostgreSQL
docker-compose exec db pg_dump -U gobad gobad_db > backup.sql

# Restore from backup
cat backup.sql | docker-compose exec -T db psql -U gobad gobad_db
```

---

## Testing Deployment

### From Server (Local)
```bash
curl http://localhost:5983/health
# Should return: {"status":"OK","message":"GoBad Backend is running!"}
```

### From Remote Computer
```bash
curl http://YOUR_SERVER_IP:5983/health
# Should return: {"status":"OK","message":"GoBad Backend is running!"}
```

### Test Frontend Connectivity
1. Open browser
2. Navigate to `http://YOUR_SERVER_IP:3865`
3. Open DevTools (F12) → Console
4. Should see no CORS errors
5. Try to login → should make request to backend

---

## Docker Compose Commands

```bash
# Start services in background
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache

# Restart specific service
docker-compose restart frontend

# Run migrations
docker-compose exec backend npm run prisma:migrate
```

---

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `SERVER_HOST` | `0.0.0.0` | Listening address (keep as 0.0.0.0) |
| `SERVER_IP` | - | Your server's public IP or domain |
| `SERVER_PORT` | `3865` | Frontend access port |
| `BACKEND_PORT` | `5983` | Backend API port |
| `POSTGRES_USER` | `gobad` | Database username |
| `POSTGRES_PASSWORD` | - | Database password (CHANGE THIS) |
| `POSTGRES_DB` | `gobad_db` | Database name |
| `NODE_ENV` | `production` | Environment (development/production) |
| `JWT_SECRET` | - | JWT signing secret (CHANGE THIS) |
| `VITE_API_URL` | - | Frontend's API endpoint URL |

---

**Questions?** Check the GitHub repository: https://github.com/thanhtr11/GoBad
