# 🔧 Docker Deployment Troubleshooting Checklist

## Problem: Cannot Access Frontend from Another Computer

### Quick Diagnostics

Run these commands on the server:

```bash
# 1. Check if containers are running
docker-compose ps
# All 4 containers should show "Up"

# 2. Check if ports are exposed
netstat -tlnp | grep -E "3865|5983"
# Should show LISTEN on both ports

# 3. Test backend is running
curl http://localhost:5983/health
# Should return JSON with "status": "OK"

# 4. Check frontend logs
docker-compose logs frontend | tail -50
# Look for errors

# 5. Check backend logs
docker-compose logs backend | tail -50
# Look for "Server is running"
```

### Common Causes and Fixes

#### ❌ Problem: "ERR_NAME_NOT_RESOLVED" or "Failed to fetch"

**Root Cause:** Frontend is trying to connect to `localhost:5983` instead of your server IP.

**Check:**
1. Look at your `.env` file:
   ```bash
   cat .env | grep VITE_API_URL
   ```
   Should show: `VITE_API_URL=http://YOUR_SERVER_IP:5983/api`
   
   NOT: `VITE_API_URL=http://localhost:5983/api`

2. If wrong, fix it:
   ```bash
   # Edit .env
   nano .env
   # Change VITE_API_URL to correct value
   
   # Restart frontend
   docker-compose restart frontend
   ```

3. Wait 10-15 seconds for frontend to rebuild, then try again.

#### ❌ Problem: "Connection refused" or "This site can't be reached"

**Root Cause:** Firewall is blocking the ports.

**Check:**
```bash
# From remote computer, try:
telnet YOUR_SERVER_IP 3865
# Press Ctrl+C

# If this fails, firewall is blocking
```

**Fix Firewall:**

For UFW (Ubuntu/Debian):
```bash
sudo ufw allow 3865/tcp
sudo ufw allow 5983/tcp
sudo ufw status
```

For firewalld (CentOS/RHEL):
```bash
sudo firewall-cmd --permanent --add-port=3865/tcp
sudo firewall-cmd --permanent --add-port=5983/tcp
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

For Windows Server:
```powershell
netsh advfirewall firewall add rule name="GoBad Frontend" dir=in action=allow protocol=tcp localport=3865
netsh advfirewall firewall add rule name="GoBad Backend" dir=in action=allow protocol=tcp localport=5983
```

#### ❌ Problem: Database won't start ("db: No such container")

**Root Cause:** Docker images not built or database credentials wrong.

**Fix:**
```bash
# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Wait 30 seconds, then check
docker-compose logs db | tail -20
```

#### ❌ Problem: Backend crashes on startup

**Check logs:**
```bash
docker-compose logs backend | tail -100
```

**Common errors:**
- `DATABASE_URL is missing` → Add to `.env`
- `Port already in use` → Change `BACKEND_PORT` in `.env`
- `Cannot find module` → Run `npm install` inside container

**Fix:**
```bash
docker-compose down
docker-compose up -d

# Wait for database to be ready (30 seconds)
# Then check again
docker-compose logs backend
```

---

## Problem: Slow or Intermittent Connectivity

### Causes and Fixes

#### Issue: "Connection timeout"

```bash
# Check Docker network
docker network inspect gobad-network

# Restart network
docker network disconnect gobad-network gobad_frontend 2>/dev/null || true
docker network disconnect gobad-network gobad_backend 2>/dev/null || true
docker-compose restart
```

#### Issue: "DNS resolution issues"

```bash
# Test from container
docker-compose exec frontend ping backend
# Should respond with IP

docker-compose exec backend ping db
# Should respond with IP
```

---

## Problem: Data Not Persisting

### Issue: Database data disappears after restart

```bash
# Check volume
docker volume ls | grep gobad

# If missing, data is gone
# To prevent this, NEVER run:
docker-compose down -v  # ❌ DELETES DATABASE!

# Instead use:
docker-compose down     # ✅ Keeps database
```

---

## Debugging Tools

### View Real-Time Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db

# Last 100 lines
docker-compose logs --tail=100 frontend
```

### Check Service Health

```bash
# Check container stats
docker stats

# Check container processes
docker-compose ps -a

# Inspect specific container
docker inspect gobad_frontend

# Check network connectivity
docker-compose exec frontend curl http://backend:5000/health
```

### Manual Database Connection

```bash
# Connect to PostgreSQL directly
docker-compose exec db psql -U gobad -d gobad_db

# List tables
\dt

# Check users
SELECT * FROM "User";

# Exit
\q
```

---

## Performance Tips

### For Slow Performance

1. **Increase Docker resources:**
   ```bash
   # Edit docker-compose.yml and add:
   services:
     backend:
       deploy:
         resources:
           limits:
             cpus: '2'
             memory: 1G
   ```

2. **Check system resources:**
   ```bash
   docker stats --no-stream
   ```

3. **Reduce volume mounts** (for production, use built images instead):
   ```yaml
   # Remove or comment out:
   # volumes:
   #   - ./backend/src:/app/src
   ```

---

## Production Deployment Checklist

- [ ] Created `.env` file with strong passwords
- [ ] Changed `POSTGRES_PASSWORD` to secure value
- [ ] Generated random `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Verified `VITE_API_URL` points to server IP/domain
- [ ] Opened firewall ports (3865, 5983)
- [ ] Tested from another computer
- [ ] Set up database backups
- [ ] Enabled HTTPS/SSL (optional but recommended)
- [ ] Created regular backup scripts
- [ ] Documented your server setup

---

## Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs -f
   ```

2. **Verify configuration:**
   ```bash
   cat .env
   docker-compose config
   ```

3. **Test connectivity:**
   ```bash
   curl http://YOUR_SERVER_IP:5983/health
   telnet YOUR_SERVER_IP 3865
   ```

4. **Report issues with:**
   - Your `.env` settings (sanitized)
   - Full log output
   - Server OS and network setup
   - Exact error message you see
