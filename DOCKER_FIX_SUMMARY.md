# 🐳 Docker Deployment Issues - FIXED

## Summary of Problems & Solutions

When you deploy GoBad to Docker and access from another computer, there were **2 critical issues**:

### ❌ Issue 1: Frontend API URL Hardcoded to `localhost`

**What was wrong:**
- Your `.env` file had: `VITE_API_URL=http://localhost:5000/api`
- But the backend runs on port **5983** (exposed from Docker)
- When accessing from another computer, "localhost" means "their computer", not yours!
- This caused: `ERR_NAME_NOT_RESOLVED` or `Failed to fetch` errors

**How it's fixed:**
- Updated `.env` to: `VITE_API_URL=http://localhost:5983/api`
- Updated `docker-compose.yml` to use environment variables for dynamic configuration
- Created `.env.production` template for deployment on other servers

---

### ❌ Issue 2: No Way to Configure for Remote Servers

**What was wrong:**
- Hardcoded values in `docker-compose.yml`
- No template for production deployment
- Users couldn't easily change database passwords or API URL

**How it's fixed:**
- Updated `docker-compose.yml` to support environment variables with defaults
- Created `.env.production` template
- Created `setup-docker.sh` script for automatic deployment
- All secrets can now be configured via `.env` file

---

## Current Status ✅

### Local/Same Machine Access (Works Now)

```
Frontend: http://localhost:3865
Backend: http://localhost:5983
Database: http://localhost:5555
```

**Test it:**
```bash
curl http://localhost:5983/health
# Should return: {"status":"OK",...}
```

---

## Deploying to Another Computer (New Process)

### Option A: Quick Automated Setup (Recommended)

```bash
# 1. On your server, clone the repo
git clone https://github.com/thanhtr11/GoBad.git
cd GoBad

# 2. Run the setup script (interactive)
bash setup-docker.sh

# 3. It will ask for:
#    - Your server's IP address
#    - Database password
#    - Then auto-generate JWT secret

# 4. Done! Access from any computer:
#    http://YOUR_SERVER_IP:3865
```

### Option B: Manual Setup

```bash
# 1. Clone and navigate
git clone https://github.com/thanhtr11/GoBad.git
cd GoBad

# 2. Create .env from template
cp .env.production .env

# 3. Edit .env with your values
nano .env
# Change these lines:
# SERVER_IP=192.168.1.100          (your actual server IP)
# POSTGRES_PASSWORD=change_me       (pick a secure password)
# JWT_SECRET=generate_random_string (or use: openssl rand -hex 32)
# VITE_API_URL=http://192.168.1.100:5983/api

# 4. Start the application
docker-compose up -d

# 5. Wait 30 seconds for services to start
sleep 30

# 6. Verify all services are running
docker-compose ps

# 7. Access from any computer:
# Frontend: http://192.168.1.100:3865
# Backend: http://192.168.1.100:5983
```

---

## Key Configuration Files

### 1. `.env` (Development - Already Fixed)
```env
VITE_API_URL=http://localhost:5983/api
```

### 2. `.env.production` (Template for Production)
```env
# Change these to your values:
VITE_API_URL=http://YOUR_SERVER_IP:5983/api
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_random_secret
```

### 3. `docker-compose.yml` (Updated)
Now uses environment variables:
```yaml
environment:
  VITE_API_URL: ${VITE_API_URL:-http://localhost:5983/api}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-gobad_password}
```

---

## Troubleshooting Remote Access

### Test 1: Check Backend is Accessible

From the **remote computer**, run:
```bash
curl http://YOUR_SERVER_IP:5983/health
# Should show: {"status":"OK",...}
```

### Test 2: Check Frontend Can Connect to Backend

1. Open `http://YOUR_SERVER_IP:3865` in browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Try to login
5. Look at failed requests
6. **The URL should be** `http://YOUR_SERVER_IP:5983/api`
7. **NOT** `http://localhost:5983/api`

If it shows `localhost`, your `.env` file needs to be fixed.

### Test 3: Check Firewall

```bash
# From remote computer
telnet YOUR_SERVER_IP 3865
# If it connects, firewall is OK
# If not, firewall is blocking (see guide below)
```

---

## Firewall Configuration

### Ubuntu/Debian (UFW)
```bash
sudo ufw allow 3865/tcp
sudo ufw allow 5983/tcp
sudo ufw allow 5432/tcp
sudo ufw status
```

### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=3865/tcp
sudo firewall-cmd --permanent --add-port=5983/tcp
sudo firewall-cmd --reload
```

### Windows Server
```powershell
netsh advfirewall firewall add rule name="GoBad" dir=in action=allow protocol=tcp localport=3865
```

---

## New Files Created

1. **`.env.production`** - Template for production deployment
2. **`docker-compose.yml`** - Updated with environment variables
3. **`.env`** - Fixed for local development (API URL corrected)
4. **`setup-docker.sh`** - Automated setup script
5. **`DOCKER_DEPLOYMENT_GUIDE.md`** - Complete deployment documentation
6. **`DOCKER_TROUBLESHOOTING.md`** - Troubleshooting checklist

---

## Testing Checklist

Before deploying to production:

- [ ] Verify `.env` file has correct `VITE_API_URL` (with server IP, not localhost)
- [ ] Run `docker-compose ps` - all 4 services should show "Up"
- [ ] Test backend: `curl http://YOUR_IP:5983/health`
- [ ] Test firewall: `telnet YOUR_IP 3865`
- [ ] Open frontend in browser: `http://YOUR_IP:3865`
- [ ] Check console (F12) for no CORS errors
- [ ] Try to login
- [ ] Check network requests show correct API URL
- [ ] Verify database is accessible (Prisma Studio at port 5555)

---

## Docker Commands Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend

# Restart service
docker-compose restart frontend

# Check status
docker-compose ps

# Run migrations
docker-compose exec backend npm run prisma:migrate

# Database backup
docker-compose exec db pg_dump -U gobad gobad_db > backup.sql

# Clean up (WARNING: deletes database)
docker-compose down -v
```

---

## What Changed

| File | Change | Reason |
|------|--------|--------|
| `.env` | `localhost:5983/api` | Fixed port from 5000 to 5983 |
| `docker-compose.yml` | Added env var support | Allow dynamic configuration |
| `.env.production` | Created | Template for servers |
| `setup-docker.sh` | Created | Automated deployment |
| `DOCKER_DEPLOYMENT_GUIDE.md` | Created | Step-by-step guide |
| `DOCKER_TROUBLESHOOTING.md` | Created | Issue resolution guide |

---

## Next Steps

1. **For local testing:** Just access `http://localhost:3865` now (it's fixed!)

2. **For remote deployment:** Follow `DOCKER_DEPLOYMENT_GUIDE.md`

3. **If issues:** Check `DOCKER_TROUBLESHOOTING.md`

4. **For production:** Use `.env.production` template with your settings

---

**All files have been created and configured. Your application is ready to be deployed!** 🎉
