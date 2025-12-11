# Fix Summary: Tournament API 500 Error

## Problem
The `/api/tournaments/club/:clubId` endpoint returns a 500 error on production (`gobad.thanhtr.com`).

## Root Cause
The tournament service was trying to eagerly load the `practice` relationship, which may be broken or deleted. When `getTournamentParticipants` tried to access `practice.club.members`, it threw an error because `practice` could be null.

## Solution
Added error handling in three tournament service methods:

### 1. **getClubTournaments** 
- Safe filtering of tournaments with missing practice data
- Fallback to return tournaments without practice info

### 2. **getTournament**
- Try/catch wrapper with fallback to basic tournament data
- Returns tournament without practice details if join fails

### 3. **getTournamentParticipants**
- Changed to use direct club relationship instead of `practice.club`
- More reliable data retrieval from the tournament's club

## How to Fix Production

### Option 1: Quick Deploy (Recommended)
On your production server, run:
```bash
cd /path/to/GoBad
bash rebuild-and-deploy.sh
```

### Option 2: Manual Deploy
```bash
cd /path/to/GoBad
git pull origin main
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Just Restart (if containers already have the code)
```bash
cd /path/to/GoBad
git pull origin main
docker-compose -f docker-compose.prod.yml restart backend
```

## Verification
After deployment, test the endpoint:
```bash
curl https://gobad.thanhtr.com/api/tournaments/club/f5bee2cb-18c0-4333-904b-f00a5f859bf8
```

Should return `{"tournaments":[...]}` instead of a 500 error.

## Files Changed
- `backend/src/services/tournamentService.ts`: Added error handling to 3 methods
- `rebuild-and-deploy.sh`: New automated deployment script
- `DEPLOY.md`: Complete deployment documentation

## Production Details
- Backend API runs on port **5983** (mapped from 5000 inside Docker)
- Database runs on port **5432**
- Frontend runs on port **3865**
- All services use Docker Compose for orchestration
