# 🏸 GoBad - Badminton Club Manager

A comprehensive web application for managing multiple badminton clubs, built with modern technologies and optimized for mobile devices.

## ✨ Features

- **Multi-Club Management**: Create and manage multiple independent clubs with complete data isolation
- **Member Management**: Track members and guests with profiles, skill levels, and membership status
- **Practice Scheduling**: Calendar view for scheduling practices with court assignments
- **Match Recording**: Record match results with detailed statistics
- **Player Statistics**: Individual stats, leaderboards, and head-to-head records
- **Tournament Mode**: Organize tournaments with bracket generation (knockout & round-robin)
- **Financial Management**: Track income and expenses with reporting and CSV/PDF export
- **Attendance Tracking**: QR code check-in system with audit trail
- **Role-Based Access**: Admin, Member, and Guest roles with appropriate permissions
- **Mobile-First Design**: Progressive Web App (PWA) with offline support

## 🛠️ Technology Stack

### Backend
- Node.js + Express.js (TypeScript)
- PostgreSQL database
- Prisma ORM
- JWT authentication
- Docker containerization

### Frontend
- React 18+ (TypeScript)
- Vite build tool
- Tailwind CSS (mobile-first)
- TanStack Query (React Query)
- React Router v6
- PWA support with Workbox

## 📋 Prerequisites

- Docker and Docker Compose installed
- Git

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd GoBad
```

### 2. Set up environment variables
```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your configuration
# Important: Change JWT_SECRET and database passwords for production!
```

### 3. Start the application with Docker
```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up -d
```

### 4. Access the application
- **Frontend**: http://localhost:3865
- **Backend API**: http://localhost:5983
- **Prisma Studio**: http://localhost:5555 (Database GUI)

## 📦 Development Workflow

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Stop services
```bash
# Stop containers
docker-compose down

# Stop and remove all data (reset database)
docker-compose down -v
```

### Install new packages
```bash
# Backend
docker-compose exec backend npm install <package-name>

# Frontend
docker-compose exec frontend npm install <package-name>

# Rebuild containers after adding dependencies
docker-compose up --build
```

### Run Prisma commands
```bash
# Generate Prisma Client
docker-compose exec backend npx prisma generate

# Create migration
docker-compose exec backend npx prisma migrate dev --name <migration-name>

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Seed database
docker-compose exec backend npx prisma db seed
```

### Access container shell
```bash
# Backend container
docker-compose exec backend sh

# Frontend container
docker-compose exec frontend sh

# Database container
docker-compose exec db psql -U gobad -d gobad_db
```

## 📁 Project Structure

```
GoBad/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth, validation, etc.
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helper functions
│   └── prisma/           # Database schema & migrations
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── api/          # API client functions
│   │   ├── hooks/        # Custom React hooks
│   │   └── context/      # React context providers
├── docs/                 # Documentation
└── docker-compose.yml    # Docker orchestration
```

## 🧪 Testing

```bash
# Run backend tests
docker-compose exec backend npm test

# Run frontend tests
docker-compose exec frontend npm test
```

## 🚢 Production Deployment

### Build production images
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### Deploy to production
```bash
# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Database backup
```bash
# Backup database
docker-compose exec db pg_dump -U gobad gobad_db > backup_$(date +%Y%m%d).sql

# Restore database
docker-compose exec -T db psql -U gobad gobad_db < backup.sql
```

## 🔐 Security Notes

- **Change default passwords**: Update `POSTGRES_PASSWORD` and `JWT_SECRET` in production
- **Use HTTPS**: Configure SSL certificate with reverse proxy (nginx)
- **Environment variables**: Never commit `.env` files to version control
- **Regular updates**: Keep dependencies updated for security patches

## 📚 Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Database Schema](./docs/DATABASE_SCHEMA.md)
- [Setup Guide](./docs/SETUP_GUIDE.md)
- [User Guide](./docs/USER_GUIDE.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

MIT License

## 🐛 Troubleshooting

### Port already in use
```bash
# Check what's using the port
lsof -i :3000  # or :5000, :5432

# Stop conflicting services or change ports in docker-compose.yml
```

### Database connection issues
```bash
# Check database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Restart database
docker-compose restart db
```

### Permission issues
```bash
# Fix permissions on Linux/Mac
sudo chown -R $USER:$USER .
```

## 📞 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ for the badminton community**
