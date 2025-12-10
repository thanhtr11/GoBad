# GoBad - Badminton Club Manager
## Project Implementation Plan

---

## 📋 Technology Stack Summary

### Backend
- **Runtime**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, bcrypt
- **Performance**: Compression middleware, rate limiting

### Frontend
- **Framework**: React 18+ (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (mobile-first)
- **Routing**: React Router v6 (lazy loading)
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Calendar**: React Big Calendar
- **Export**: jsPDF + PapaParse (CSV)
- **QR Codes**: react-qr-code
- **PWA**: Vite PWA Plugin + Workbox
- **Mobile**: React Window (virtual scrolling), React Use Gesture (swipes)

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm/yarn
- **Containerization**: Docker + Docker Compose
- **Database GUI**: Prisma Studio
- **API Testing**: Postman/Thunder Client
- **Code Quality**: ESLint, Prettier

---

## 🎯 Core Features (22 Total)

### Management (4)
1. Multi-Club Management (CRUD, data isolation)
2. Members & Guests Management (profiles, skill levels, check-in tracking)
3. Practice Scheduling (calendar, court assignment, double-booking prevention)
4. Match Results Recording (singles/doubles/mixed, scores, linked to practices)

### Analytics (4)
5. Player Statistics (wins/losses, win rate, trends)
6. Head-to-Head Records (historical matchups)
7. Leaderboards (ranked by wins)
8. Match Highlights (auto-generated summaries per practice)

### Tournament (2)
9. Tournament Mode (bracket generation)
10. Tournament Formats (knockout, round-robin)

### Finance (3)
11. Financial Tracking (income: fees/donations, expenses: equipment/rental)
12. Financial Reports (balance, summaries)
13. Export to CSV/PDF

### Attendance (3)
14. Check-In System (web forms, QR codes)
15. Guest Check-In (members check in guests)
16. Attendance History (audit trail)

### Admin (4)
17. Dashboard & Analytics (overview stats, upcoming practices)
18. Online Self-Service (member registration, tiered pricing)
19. Role-Based Access Control (Admin, Member, Guest)
20. Custom Reports (exportable, data visualization)

### Technical (2)
21. Data Isolation Architecture (per-club separation)
22. Mobile-Responsive Design (PWA, touch-friendly, offline-capable)

---

## 📱 Mobile Optimization Features
- **Progressive Web App (PWA)**: Installable, offline support
- **Touch-Friendly UI**: 44px+ touch targets, swipe gestures
- **Bottom Navigation**: Mobile-first navigation pattern
- **Virtual Scrolling**: Performance for long lists
- **Pull-to-Refresh**: Native-like experience
- **Responsive Breakpoints**: xs, sm, md, lg, xl
- **Code Splitting**: Lazy-loaded routes
- **Optimistic Updates**: Instant UI feedback
- **QR Scanner**: Device camera integration

---

## 🗂️ Project Structure

```
GoBad/
├── backend/              # Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/  # Business logic (10 controllers)
│   │   ├── routes/       # API endpoints (10 route files)
│   │   ├── middleware/   # Auth, role check, club isolation
│   │   ├── services/     # Stats, tournament, export logic
│   │   ├── utils/        # Validators, helpers, error handling
│   │   ├── types/        # TypeScript interfaces
│   │   └── server.ts     # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma # Database models (9 models)
│   │   └── migrations/
│   ├── Dockerfile        # Backend Docker image
│   ├── .dockerignore
│   ├── package.json
│   └── .env.example
│
├── frontend/             # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/   # 60+ reusable components
│   │   │   ├── layout/   # Header, Sidebar, MobileNav
│   │   │   ├── common/   # Button, Modal, Table, Cards
│   │   │   ├── auth/     # Login, Register
│   │   │   ├── clubs/    # Club management
│   │   │   ├── members/  # Member/guest management
│   │   │   ├── practices/# Practice scheduling
│   │   │   ├── matches/  # Match recording
│   │   │   ├── finances/ # Financial tracking
│   │   │   ├── attendance/# Check-in system
│   │   │   ├── stats/    # Statistics & analytics
│   │   │   └── tournament/# Tournament brackets
│   │   ├── pages/        # 12 main pages
│   │   ├── api/          # Axios API calls (10 files)
│   │   ├── hooks/        # Custom React hooks (15+)
│   │   ├── context/      # Auth & Club context
│   │   ├── utils/        # Formatters, validators
│   │   └── main.tsx      # App entry
│   ├── public/
│   │   ├── manifest.json # PWA manifest
│   │   └── icons/        # PWA icons
│   ├── Dockerfile        # Frontend Docker image
│   ├── .dockerignore
│   ├── package.json
│   └── .env.example
│
├── docs/                 # Documentation
├── docker-compose.yml    # Multi-container orchestration
├── docker-compose.dev.yml # Development override
├── .env.example          # Root environment variables
└── README.md
```

---

## ✅ Implementation Checklist

### Phase 1: Project Setup & Foundation
- [ ] 1.1 Initialize Git repository
- [ ] 1.2 Create project folder structure
- [ ] 1.3 Create docker-compose.yml (PostgreSQL, Backend, Frontend)
- [ ] 1.4 Create backend Dockerfile (multi-stage build)
- [ ] 1.5 Create frontend Dockerfile (multi-stage build with nginx)
- [ ] 1.6 Set up backend (Node.js + Express + TypeScript)
- [ ] 1.7 Set up frontend (React + Vite + TypeScript)
- [ ] 1.8 Configure ESLint + Prettier
- [ ] 1.9 Create .env files (root, backend, frontend)
- [ ] 1.10 Configure Tailwind CSS with mobile-first breakpoints
- [ ] 1.11 Create .dockerignore files (backend + frontend)
- [ ] 1.12 Test Docker containers (docker-compose up)

### Phase 2: Database & Backend Core
- [ ] 2.1 Create Prisma schema (9 models: Club, User, Member, Practice, Match, Finance, Attendance, Tournament)
- [ ] 2.2 Run Prisma migrations (create database tables)
- [ ] 2.3 Create seed data script
- [ ] 2.4 Set up Express server with middleware (CORS, helmet, compression)
- [ ] 2.5 Implement JWT authentication
- [ ] 2.6 Create auth middleware (verify token)
- [ ] 2.7 Create role check middleware (Admin/Member/Guest)
- [ ] 2.8 Create club isolation middleware (enforce clubId filtering)
- [ ] 2.9 Set up centralized error handling
- [ ] 2.10 Configure rate limiting

### Phase 3: Authentication & Authorization
- [ ] 3.1 Create User model & auth routes (login, register, logout)
- [ ] 3.2 Implement password hashing (bcrypt)
- [ ] 3.3 Create JWT token generation & validation
- [ ] 3.4 Build auth controller (login, register, get current user)
- [ ] 3.5 Build frontend auth context (AuthContext)
- [ ] 3.6 Create LoginForm component
- [ ] 3.7 Create RegisterForm component
- [ ] 3.8 Create ProtectedRoute component
- [ ] 3.9 Implement token storage (localStorage)
- [ ] 3.10 Add auto-logout on token expiry

### Phase 4: Club Management Module
- [ ] 4.1 Create Club routes (CRUD)
- [ ] 4.2 Create Club controller (create, read, update, delete)
- [ ] 4.3 Create ClubList component (grid on desktop, list on mobile)
- [ ] 4.4 Create ClubCard component (touch-optimized)
- [ ] 4.5 Create ClubForm component (create/edit modal)
- [ ] 4.6 Create ClubSelector component (dropdown filter)
- [ ] 4.7 Create ClubDetails component
- [ ] 4.8 Create ClubContext (track selected club globally)
- [ ] 4.9 Add cascade delete for club (all related data)
- [ ] 4.10 Test club data isolation

### Phase 5: Members & Guests Module
- [ ] 5.1 Create Member routes (CRUD)
- [ ] 5.2 Create Member controller (add, edit, delete, filter by club)
- [ ] 5.3 Create MemberList component (virtual scrolling for performance)
- [ ] 5.4 Create MemberCard component (swipeable for edit/delete)
- [ ] 5.5 Create MemberForm component (multi-step on mobile)
- [ ] 5.6 Create MemberProfile component
- [ ] 5.7 Create GuestForm component
- [ ] 5.8 Create GuestCheckInForm component (member checks in guest)
- [ ] 5.9 Add skill level & membership status filters
- [ ] 5.10 Implement member search (debounced)

### Phase 6: Practice Scheduling Module
- [ ] 6.1 Create Practice routes (CRUD)
- [ ] 6.2 Create Practice controller (schedule, edit, delete, prevent double-booking)
- [ ] 6.3 Create PracticeCalendar component (full calendar view, touch gestures)
- [ ] 6.4 Create PracticeList component (list view for mobile)
- [ ] 6.5 Create PracticeForm component (date/time pickers optimized)
- [ ] 6.6 Create PracticeDetails component
- [ ] 6.7 Add court assignment logic
- [ ] 6.8 Implement double-booking validation
- [ ] 6.9 Add filter by club & date range
- [ ] 6.10 Show upcoming practices on dashboard (next 5)

### Phase 7: Match Recording Module
- [ ] 7.1 Create Match routes (CRUD)
- [ ] 7.2 Create Match controller (record, edit, delete, link to practice)
- [ ] 7.3 Create MatchForm component (score increment buttons for touch)
- [ ] 7.4 Create MatchList component
- [ ] 7.5 Create MatchCard component
- [ ] 7.6 Create MatchHistory component
- [ ] 7.7 Add match type selection (singles, doubles, mixed doubles)
- [ ] 7.8 Validate both players from same club
- [ ] 7.9 Add optional notes field
- [ ] 7.10 Filter matches by practice session

### Phase 8: Player Statistics Module
- [ ] 8.1 Create stats service (calculate wins, losses, win rate)
- [ ] 8.2 Create stats routes (player stats, leaderboard, head-to-head)
- [ ] 8.3 Create Dashboard component (overview cards, scrollable on mobile)
- [ ] 8.4 Create PlayerStatsCard component
- [ ] 8.5 Create Leaderboard component (ranked by wins, sticky headers)
- [ ] 8.6 Create HeadToHead component (1v1 comparison)
- [ ] 8.7 Create PerformanceChart component (Recharts, touch tooltips)
- [ ] 8.8 Create StatsFilters component (filter by club, date)
- [ ] 8.9 Implement per-club stats isolation
- [ ] 8.10 Add performance trends calculation

### Phase 9: Match Highlights & Summaries
- [ ] 9.1 Create summary service (auto-generate highlights)
- [ ] 9.2 Create PracticeSummary component
- [ ] 9.3 Calculate top performers per practice
- [ ] 9.4 Calculate most matches played
- [ ] 9.5 Find closest scores
- [ ] 9.6 Identify biggest upsets (based on skill level)
- [ ] 9.7 Add summary to practice details page
- [ ] 9.8 Make summaries exportable (PDF)

### Phase 10: Tournament Mode
- [ ] 10.1 Create Tournament model & routes
- [ ] 10.2 Create tournament service (bracket generation logic)
- [ ] 10.3 Create TournamentForm component
- [ ] 10.4 Create TournamentBracket component (horizontal scroll, pinch-zoom)
- [ ] 10.5 Create RoundRobin component
- [ ] 10.6 Create KnockoutStage component
- [ ] 10.7 Implement automatic winner advancement
- [ ] 10.8 Link tournaments to practice sessions
- [ ] 10.9 Track tournament status (upcoming, in-progress, completed)
- [ ] 10.10 Add tournament results to stats

### Phase 11: Financial Management Module
- [ ] 11.1 Create Finance routes (CRUD)
- [ ] 11.2 Create Finance controller (income, expense tracking)
- [ ] 11.3 Create FinanceList component
- [ ] 11.4 Create FinanceForm component (income vs expense)
- [ ] 11.5 Create FinanceReport component (charts, summaries)
- [ ] 11.6 Create BalanceCard component (current balance)
- [ ] 11.7 Add category selection (membership fee, donation, equipment, rental)
- [ ] 11.8 Calculate total income, expenses, balance
- [ ] 11.9 Add filter by club & date range
- [ ] 11.10 Implement manual transaction recording (admin only)

### Phase 12: Export Functionality
- [ ] 12.1 Create export service (CSV & PDF generation)
- [ ] 12.2 Create export routes
- [ ] 12.3 Install jsPDF & PapaParse
- [ ] 12.4 Create ExportButtons component
- [ ] 12.5 Export finances to CSV
- [ ] 12.6 Export finances to PDF
- [ ] 12.7 Export member lists to CSV
- [ ] 12.8 Export match history to CSV
- [ ] 12.9 Export stats reports to PDF
- [ ] 12.10 Test all export formats on mobile

### Phase 13: Attendance Tracking Module
- [ ] 13.1 Create Attendance routes (CRUD)
- [ ] 13.2 Create Attendance controller (check-in, history)
- [ ] 13.3 Create CheckInForm component (quick button)
- [ ] 13.4 Create AttendanceList component
- [ ] 13.5 Create AttendanceHistory component
- [ ] 13.6 Create QRCodeDisplay component (full-screen on mobile)
- [ ] 13.7 Create QRScanner component (camera access)
- [ ] 13.8 Implement member self check-in
- [ ] 13.9 Implement guest check-in (by member)
- [ ] 13.10 Add audit trail (who checked in whom, when)

### Phase 14: Dashboard & Analytics
- [ ] 14.1 Create HomePage component (dashboard overview)
- [ ] 14.2 Show total clubs, members, guests stats
- [ ] 14.3 Show total practices scheduled
- [ ] 14.4 Display upcoming practices (next 5)
- [ ] 14.5 Add quick access links to all modules
- [ ] 14.6 Make dashboard responsive (grid → stack on mobile)
- [ ] 14.7 Add data visualization (charts)
- [ ] 14.8 Implement per-club filtering on all views
- [ ] 14.9 Create custom dashboard for members vs admins
- [ ] 14.10 Add pull-to-refresh on mobile

### Phase 15: Role-Based Access Control
- [ ] 15.1 Define user roles (Admin, Member, Guest)
- [ ] 15.2 Implement role check middleware (backend)
- [ ] 15.3 Create role-based route guards (frontend)
- [ ] 15.4 Admin: Full access (edit, delete, view all)
- [ ] 15.5 Members: View schedules & profiles only
- [ ] 15.6 Guests: Limited access (view own profile)
- [ ] 15.7 Hide/show UI elements based on role
- [ ] 15.8 Enforce club data isolation by role
- [ ] 15.9 Test all role permissions
- [ ] 15.10 Add role indicator in UI

### Phase 16: Mobile Optimization
- [ ] 16.1 Configure Tailwind mobile-first breakpoints
- [ ] 16.2 Create MobileNav component (bottom navigation bar)
- [ ] 16.3 Create responsive Header (hamburger menu on mobile)
- [ ] 16.4 Implement touch-friendly buttons (min 44px)
- [ ] 16.5 Create BottomSheet component (native-like modals)
- [ ] 16.6 Create SwipeableCard component (swipe to delete/edit)
- [ ] 16.7 Create PullToRefresh component
- [ ] 16.8 Implement virtual scrolling (react-window)
- [ ] 16.9 Add touch gestures (swipe, pinch-zoom)
- [ ] 16.10 Test on real mobile devices (iOS & Android)

### Phase 17: Progressive Web App (PWA)
- [ ] 17.1 Install Vite PWA plugin
- [ ] 17.2 Create manifest.json (app name, icons, theme)
- [ ] 17.3 Generate PWA icons (192px, 512px, apple-touch)
- [ ] 17.4 Configure service worker (Workbox)
- [ ] 17.5 Implement offline fallback page
- [ ] 17.6 Cache static assets (images, fonts, CSS)
- [ ] 17.7 Cache API responses (stale-while-revalidate)
- [ ] 17.8 Add install prompt for mobile users
- [ ] 17.9 Test offline functionality
- [ ] 17.10 Test PWA install on iOS & Android

### Phase 18: Performance Optimization
- [ ] 18.1 Implement code splitting (React.lazy)
- [ ] 18.2 Lazy load all route components
- [ ] 18.3 Add loading spinners for lazy routes
- [ ] 18.4 Optimize images (WebP, lazy loading)
- [ ] 18.5 Implement API pagination (20-50 items per page)
- [ ] 18.6 Add debounce to search inputs (300ms)
- [ ] 18.7 Implement optimistic UI updates (TanStack Query)
- [ ] 18.8 Enable Gzip/Brotli compression (backend)
- [ ] 18.9 Add rate limiting to API endpoints
- [ ] 18.10 Run Lighthouse audit (aim for 90+ score)

### Phase 19: Testing & Quality Assurance
- [ ] 19.1 Test all CRUD operations (clubs, members, practices, matches, finances)
- [ ] 19.2 Test authentication flow (login, logout, token expiry)
- [ ] 19.3 Test role-based access control
- [ ] 19.4 Test club data isolation (no cross-club data leaks)
- [ ] 19.5 Test cascade deletes (delete club → all data deleted)
- [ ] 19.6 Test double-booking prevention
- [ ] 19.7 Test match stats calculation accuracy
- [ ] 19.8 Test export functionality (CSV, PDF)
- [ ] 19.9 Test QR code check-in system
- [ ] 19.10 Test on multiple devices (desktop, tablet, mobile)

### Phase 20: Documentation & Deployment
- [ ] 20.1 Write API documentation (endpoints, request/response)
- [ ] 20.2 Write database schema documentation
- [ ] 20.3 Write Docker setup guide (installation, configuration)
- [ ] 20.4 Write user guide (how to use features)
- [ ] 20.5 Write deployment guide (production Docker setup)
- [ ] 20.6 Create environment variables documentation
- [ ] 20.7 Create production docker-compose.yml
- [ ] 20.8 Set up production database (PostgreSQL container or managed service)
- [ ] 20.9 Deploy with Docker (AWS ECS, DigitalOcean, Railway, or VPS)
- [ ] 20.10 Configure domain, SSL certificate & reverse proxy (nginx)

### Phase 21: Final Polish & Launch
- [ ] 21.1 Add loading states to all components
- [ ] 21.2 Add error handling & user-friendly error messages
- [ ] 21.3 Add success/error toast notifications
- [ ] 21.4 Add confirmation dialogs for destructive actions
- [ ] 21.5 Implement form validation (frontend + backend)
- [ ] 21.6 Add empty states (no data messages)
- [ ] 21.7 Add 404 page (NotFoundPage)
- [ ] 21.8 Test all mobile gestures & interactions
- [ ] 21.9 Final accessibility audit (keyboard navigation, ARIA labels)
- [ ] 21.10 Launch & monitor for issues

---

## 🐳 Docker Configuration

### docker-compose.yml (Root)
```yaml
version: '3.9'

services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    container_name: gobad_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: gobad
      POSTGRES_PASSWORD: gobad_password
      POSTGRES_DB: gobad_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gobad"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gobad_backend
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://gobad:gobad_password@db:5432/gobad_db
      JWT_SECRET: your_jwt_secret_change_in_production
      JWT_EXPIRES_IN: 7d
      PORT: 5000
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
      - /app/node_modules
    command: npm run dev

  # Frontend React App
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    container_name: gobad_frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:5000/api
    depends_on:
      - backend
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/public:/app/public
      - /app/node_modules
    command: npm run dev

  # Prisma Studio (Optional - for database GUI)
  prisma-studio:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: gobad_prisma_studio
    restart: unless-stopped
    ports:
      - "5555:5555"
    environment:
      DATABASE_URL: postgresql://gobad:gobad_password@db:5432/gobad_db
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/prisma:/app/prisma
    command: npx prisma studio --browser none --port 5555

volumes:
  postgres_data:
```

### backend/Dockerfile
```dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built files
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 5000

# Run migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

# Stage 3: Development
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start development server with hot reload
CMD ["npm", "run", "dev"]
```

### frontend/Dockerfile
```dockerfile
# Multi-stage build for optimal image size

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Stage 3: Development
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### backend/.dockerignore
```
node_modules
dist
.env
.env.local
.env.*.local
npm-debug.log*
.DS_Store
coverage
.vscode
.idea
*.log
```

### frontend/.dockerignore
```
node_modules
dist
.env
.env.local
.env.*.local
npm-debug.log*
.DS_Store
coverage
.vscode
.idea
*.log
```

### .env.example (Root)
```env
# Database
POSTGRES_USER=gobad
POSTGRES_PASSWORD=gobad_password
POSTGRES_DB=gobad_db

# Backend
DATABASE_URL=postgresql://gobad:gobad_password@db:5432/gobad_db
JWT_SECRET=your_jwt_secret_change_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=5000

# Frontend
VITE_API_URL=http://localhost:5000/api
```

### docker-compose.prod.yml (Production Override)
```yaml
version: '3.9'

services:
  db:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Use strong password from .env
    volumes:
      - /var/lib/postgresql/data  # Use host volume for persistence

  backend:
    build:
      target: production
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
    volumes: []  # Remove volume mounts in production
    command: node dist/server.js

  frontend:
    build:
      target: production
    environment:
      VITE_API_URL: ${VITE_API_URL}  # Use production API URL
    volumes: []  # Remove volume mounts in production
    
  # Remove Prisma Studio in production
  prisma-studio:
    profiles:
      - tools  # Only start with --profile tools
```

### Production Deployment Commands
```bash
# Build production images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Backup database
docker-compose exec db pg_dump -U gobad gobad_db > backup.sql

# Restore database
docker-compose exec -T db psql -U gobad gobad_db < backup.sql
```

---

## 📦 NPM Packages Needed

### Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "dotenv": "^16.3.1",
    "jspdf": "^2.5.1",
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.10.5",
    "@types/express": "^4.17.21",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "prisma": "^5.7.0",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  }
}
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tanstack/react-query": "^5.14.2",
    "axios": "^1.6.2",
    "react-hook-form": "^7.49.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    "recharts": "^2.10.3",
    "react-big-calendar": "^1.8.5",
    "date-fns": "^3.0.6",
    "react-qr-code": "^2.0.12",
    "jspdf": "^2.5.1",
    "papaparse": "^5.4.1",
    "react-window": "^1.8.10",
    "react-use-gesture": "^9.1.3",
    "react-intersection-observer": "^9.5.3"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.8",
    "vite-plugin-pwa": "^0.17.4",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1",
    "prettier-plugin-tailwindcss": "^0.5.9"
  }
}
```

---

## 🚀 Quick Start Commands

### Prerequisites
```bash
# Ensure Docker and Docker Compose are installed
docker --version
docker-compose --version
```

### Initial Setup
```bash
# 1. Clone/Create project structure
mkdir -p GoBad/{backend,frontend,docs}
cd GoBad
git init

# 2. Create environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Build and start all containers
docker-compose up --build

# Services will be available at:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - PostgreSQL: localhost:5432
# - Prisma Studio: http://localhost:5555
```

### Development Workflow
```bash
# Start all services
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# Rebuild containers after dependency changes
docker-compose up --build

# Run commands inside containers
docker-compose exec backend npm install <package>
docker-compose exec frontend npm install <package>

# Prisma commands
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma generate
docker-compose exec backend npx prisma db seed

# Access container shell
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec db psql -U gobad -d gobad_db
```

### Local Development (Without Docker - Optional)
```bash
# If you prefer local development without Docker:

# 1. Install PostgreSQL locally
# 2. Initialize backend
cd backend
npm init -y
npm install express @prisma/client bcryptjs jsonwebtoken cors helmet compression express-rate-limit dotenv jspdf papaparse
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken @types/cors @types/compression prisma nodemon ts-node eslint prettier
npx tsc --init
npx prisma init

# 3. Initialize frontend
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install react-router-dom @tanstack/react-query axios react-hook-form zod @hookform/resolvers recharts react-big-calendar date-fns react-qr-code jspdf papaparse react-window react-use-gesture react-intersection-observer
npm install -D vite-plugin-pwa tailwindcss postcss autoprefixer eslint prettier prettier-plugin-tailwindcss
npx tailwindcss init -p

# 4. Start development servers
cd backend && npm run dev  # Terminal 1
cd frontend && npm run dev # Terminal 2
```

---

## 📊 Estimated Timeline

| Phase | Tasks | Duration | Dependencies |
|-------|-------|----------|--------------|
| Phase 1 | Setup (10 tasks) | 1 day | None |
| Phase 2 | Database & Backend Core (10 tasks) | 2 days | Phase 1 |
| Phase 3 | Auth (10 tasks) | 2 days | Phase 2 |
| Phase 4 | Clubs (10 tasks) | 2 days | Phase 3 |
| Phase 5 | Members (10 tasks) | 3 days | Phase 4 |
| Phase 6 | Practices (10 tasks) | 3 days | Phase 4 |
| Phase 7 | Matches (10 tasks) | 3 days | Phase 5, 6 |
| Phase 8 | Stats (10 tasks) | 3 days | Phase 7 |
| Phase 9 | Highlights (8 tasks) | 2 days | Phase 7 |
| Phase 10 | Tournaments (10 tasks) | 3 days | Phase 6, 7 |
| Phase 11 | Finances (10 tasks) | 2 days | Phase 4 |
| Phase 12 | Export (10 tasks) | 2 days | Phase 8, 11 |
| Phase 13 | Attendance (10 tasks) | 3 days | Phase 5, 6 |
| Phase 14 | Dashboard (10 tasks) | 2 days | All modules |
| Phase 15 | RBAC (10 tasks) | 2 days | Phase 3 |
| Phase 16 | Mobile (10 tasks) | 3 days | All modules |
| Phase 17 | PWA (10 tasks) | 2 days | Phase 16 |
| Phase 18 | Performance (10 tasks) | 2 days | All modules |
| Phase 19 | Testing (10 tasks) | 3 days | All modules |
| Phase 20 | Docs & Deploy (10 tasks) | 2 days | Phase 19 |
| Phase 21 | Polish (10 tasks) | 2 days | Phase 20 |

**Total Estimated Time**: ~50 days (10 weeks for solo developer)  
**With Team (3 developers)**: ~20-25 days (4-5 weeks)

---

## 🎯 Success Metrics

- [ ] All 22 core features implemented
- [ ] 100% mobile responsive (tested on iOS & Android)
- [ ] Lighthouse score 90+ (Performance, Accessibility, Best Practices, SEO)
- [ ] PWA installable on mobile devices
- [ ] Complete data isolation between clubs (zero data leaks)
- [ ] Role-based access control working correctly
- [ ] All export features functional (CSV, PDF)
- [ ] QR code check-in system working
- [ ] Offline support via service worker
- [ ] Zero critical bugs in production

---

## 📝 Notes

- **No payment gateway** - Manual finance recording only
- **No notifications** - Users check website proactively
- **No guest registration** - Only members can check in guests
- **Focus on simplicity** - Streamlined for non-profit clubs
- **Data isolation is critical** - Test thoroughly!
- **Mobile-first design** - Most users will access via phone

---

## 🔗 Useful Resources

- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Big Calendar](https://jquense.github.io/react-big-calendar)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app)
- [JWT.io](https://jwt.io)

---

**Ready to start? Begin with Phase 1!** 🚀
