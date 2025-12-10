# ⚡ Quick Reference Card

## 🚀 Access Your Application

### Local Machine
- Frontend: http://localhost:3865
- Backend: http://localhost:5983
- Database: http://localhost:5555

### Remote Server (Example IP: 192.168.1.100)
- Frontend: http://192.168.1.100:3865
- Backend: http://192.168.1.100:5983
- Database: http://192.168.1.100:5555

---

## 🔧 Setup on New Server (Copy & Paste)

```bash
# 1. Clone
git clone https://github.com/thanhtr11/GoBad.git
cd GoBad

# 2. Run setup (interactive - asks for IP, password, etc.)
bash setup-docker.sh

# Done! Access from any computer using your server IP
```

---

## 📝 Manual Setup (If Not Using Script)

```bash
# 1. Create .env file
cat > .env << 'EOF'
POSTGRES_USER=gobad
POSTGRES_PASSWORD=your_secure_password_12_chars_min
POSTGRES_DB=gobad_db
DATABASE_URL=postgresql://gobad:your_secure_password_12_chars_min@db:5432/gobad_db
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=5000
VITE_API_URL=http://YOUR_SERVER_IP:5983/api
EOF

# 2. Replace YOUR_SERVER_IP with your actual IP
nano .env

# 3. Start
docker-compose up -d

# 4. Wait 30 seconds, then verify
docker-compose ps
```

---

## ✅ Testing

```bash
# Test backend is running
curl http://localhost:5983/health

# Test from remote (change IP)
curl http://YOUR_SERVER_IP:5983/health

# Expected response:
# {"status":"OK","message":"GoBad Backend is running!","timestamp":"..."}
```

---

## 🛠️ Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Rebuild
docker-compose build --no-cache

# Clean everything (⚠️ deletes database)
docker-compose down -v
```

---

## 🔓 Firewall (If Can't Access from Remote)

### Ubuntu/Debian
```bash
sudo ufw allow 3865/tcp
sudo ufw allow 5983/tcp
```

### CentOS
```bash
sudo firewall-cmd --permanent --add-port=3865/tcp
sudo firewall-cmd --permanent --add-port=5983/tcp
sudo firewall-cmd --reload
```

---

## 📚 Documentation Files

- `DOCKER_FIX_SUMMARY.md` - What was broken and how it's fixed
- `DOCKER_DEPLOYMENT_GUIDE.md` - Step-by-step deployment guide
- `DOCKER_TROUBLESHOOTING.md` - Issue resolution checklist
- `DEPLOYMENT_COMPLETE.md` - General deployment info

---

## 🆘 If It Still Doesn't Work

1. **Check logs:**
   ```bash
   docker-compose logs frontend | tail -20
   docker-compose logs backend | tail -20
   ```

2. **Verify .env is correct:**
   ```bash
   cat .env | grep VITE_API_URL
   # Should show: VITE_API_URL=http://YOUR_SERVER_IP:5983/api
   ```

3. **Test connectivity:**
   ```bash
   curl http://YOUR_SERVER_IP:5983/health
   telnet YOUR_SERVER_IP 3865
   ```

4. **Check firewall:**
   ```bash
   netstat -tlnp | grep -E "3865|5983"
   ```

5. **Restart everything:**
   ```bash
   docker-compose down
   docker-compose up -d
   sleep 30
   docker-compose ps
   ```

---

## 🎯 The Key Difference

| Setup | API URL |
|-------|---------|
| ❌ Wrong | `http://localhost:5983/api` (when accessing from other computer) |
| ✅ Correct | `http://YOUR_SERVER_IP:5983/api` |

**This is the #1 reason why remote access doesn't work!**

---

## 📞 Support

- GitHub: https://github.com/thanhtr11/GoBad
- Issues: https://github.com/thanhtr11/GoBad/issues
- Read `DOCKER_TROUBLESHOOTING.md` for detailed debugging
