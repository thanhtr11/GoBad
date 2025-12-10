# Schema Redesign Implementation Checklist

## Phase 1: Schema & Migration ✅ COMPLETE

- [x] Design new schema (User + ClubMember junction table)
- [x] Update Prisma schema file
- [x] Remove duplicate enum definitions
- [x] Update Match model relations (Member → ClubMember)
- [x] Update Attendance model relations (Member → ClubMember)
- [x] Validate schema with `prisma validate`
- [x] Generate Prisma client
- [x] Create migration SQL with data transformation
- [x] Create rollback SQL
- [x] Document changes in SCHEMA_REDESIGN.md
- [x] Create quick reference guide (MIGRATION_QUICK_REFERENCE.md)
- [x] Update context.txt

## Phase 2: Database Migration ⏳ PENDING

- [ ] Backup production database
- [ ] Start database server
- [ ] Apply migration: `20251208160000_redesign_user_club_relationship`
- [ ] Verify data integrity:
  - [ ] Check User table has name, phone, skillLevel, membershipTier
  - [ ] Check ClubMember table created with all records
  - [ ] Check Match.player1Id and player2Id reference ClubMember
  - [ ] Check Attendance.memberId references ClubMember
  - [ ] Verify foreign key constraints
  - [ ] Count records: Users, ClubMembers, Matches, Attendance
- [ ] Test rollback (on development database)
- [ ] Run `prisma generate` to update client

## Phase 3: Backend Services Update ⏳ NOT STARTED

### memberService.ts
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update `getClubMembers()` query
  - [ ] Change `prisma.member.findMany()` → `prisma.clubMember.findMany()`
  - [ ] Add `include: { user: true }`
  - [ ] Update where clause if needed
- [ ] Update `getMemberById()` query
  - [ ] Change `prisma.member.findUnique()` → `prisma.clubMember.findUnique()`
  - [ ] Add `include: { user: true }`
- [ ] Update `createMember()` mutation
  - [ ] Handle existing user: create ClubMember only
  - [ ] Handle new user: create User + ClubMember
  - [ ] Update return type
- [ ] Update `updateMember()` mutation
  - [ ] Update User data separately if needed
  - [ ] Update ClubMember data
- [ ] Update `deleteMember()` mutation
  - [ ] Change `prisma.member.delete()` → `prisma.clubMember.delete()`
  - [ ] Decide: Keep User or delete?
- [ ] Update type definitions
- [ ] Update response serialization

### attendanceService.ts
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update `getAttendance()` query
  - [ ] Add nested include: `{ member: { include: { user: true } } }`
- [ ] Update `checkIn()` mutation
  - [ ] Verify memberId references ClubMember
- [ ] Update type definitions
- [ ] Update response serialization (member.user.name)

### matchService.ts
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update `getMatches()` query
  - [ ] Add nested includes: `{ player1: { include: { user: true } }, player2: { include: { user: true } } }`
- [ ] Update `createMatch()` mutation
  - [ ] Verify player1Id and player2Id reference ClubMembers
  - [ ] Validate both players belong to same club
- [ ] Update type definitions
- [ ] Update response serialization (player names)

### clubService.ts
- [ ] Update `getClubById()` query
  - [ ] Update include: `{ members: { include: { user: true } } }`
- [ ] Update `getClubs()` query
  - [ ] Update include if fetching members
- [ ] Update type definitions

### practiceService.ts
- [ ] Review queries for member references
- [ ] Update includes if needed
- [ ] Test practice with attendance

### Other Services
- [ ] Check financeService.ts for member references
- [ ] Check tournamentService.ts for member references
- [ ] Update any other files using Member model

## Phase 4: API Routes Update ⏳ NOT STARTED

### memberRoutes.ts
- [ ] Update GET /members response structure
- [ ] Update POST /members request handling
  - [ ] Accept userId OR user data
  - [ ] Create User if needed
- [ ] Update PUT /members/:id request handling
  - [ ] Update User and ClubMember separately
- [ ] Update DELETE /members/:id
- [ ] Update response types

### attendanceRoutes.ts
- [ ] Update GET /attendance response structure
- [ ] Update POST /attendance request handling
- [ ] Update response types

### matchRoutes.ts
- [ ] Update GET /matches response structure
- [ ] Update POST /matches request handling
- [ ] Update response types

### Other Routes
- [ ] Check practiceRoutes.ts
- [ ] Check clubRoutes.ts
- [ ] Update any other routes using members

## Phase 5: Frontend Types Update ⏳ NOT STARTED

### Create/Update Type Definitions
- [ ] Create `ClubMember` interface in types file
  ```typescript
  interface ClubMember {
    id: string;
    userId: string;
    clubId: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    type: 'MEMBER' | 'GUEST';
    joinedAt: string;
    user: User;
  }
  ```
- [ ] Update `User` interface with new fields
  ```typescript
  interface User {
    id: string;
    username: string;
    email: string;
    name?: string;
    phone?: string;
    skillLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    membershipTier?: 'ADULT' | 'JUNIOR' | 'FAMILY';
  }
  ```
- [ ] Remove old `Member` interface
- [ ] Update `Match` interface to use ClubMember
- [ ] Update `Attendance` interface to use ClubMember

## Phase 6: Frontend Components Update ⏳ NOT STARTED

### MemberList.tsx
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update data access:
  - [ ] `member.name` → `member.user.name`
  - [ ] `member.email` → `member.user.email`
  - [ ] `member.phone` → `member.user.phone`
  - [ ] `member.skillLevel` → `member.user.skillLevel`
- [ ] Update table columns
- [ ] Update filter logic if needed
- [ ] Test display

### MemberForm.tsx
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update form structure:
  - [ ] Separate user fields from club member fields
  - [ ] Add userId field for existing users
  - [ ] Add option to search existing users
- [ ] Update create mutation
  - [ ] Check if user exists by email
  - [ ] Create User if new, or use existing userId
  - [ ] Create ClubMember record
- [ ] Update edit mutation
  - [ ] Update User data
  - [ ] Update ClubMember data
- [ ] Test form submission

### MembersPage.tsx
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update API calls
- [ ] Update type definitions
- [ ] Update props passed to child components
- [ ] Test page functionality

### PracticeDetailsModal.tsx
- [ ] Update attendance display
  - [ ] `attendee.name` → `attendee.user.name`
- [ ] Update player displays if showing members
- [ ] Test modal

### AttendanceList.tsx (if exists)
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update data access: `member.user.name`
- [ ] Test attendance display

### MatchList.tsx (if exists)
- [ ] Update import: `Member` → `ClubMember`
- [ ] Update player displays:
  - [ ] `player1.name` → `player1.user.name`
  - [ ] `player2.name` → `player2.user.name`
- [ ] Test match list

### Other Components
- [ ] Check Dashboard.tsx for member displays
- [ ] Check Statistics components for member data
- [ ] Check any other components displaying member info
- [ ] Update all components using member data

## Phase 7: Testing ⏳ NOT STARTED

### Backend API Tests
- [ ] Test GET /members - returns nested user data
- [ ] Test POST /members - create new user
- [ ] Test POST /members - add existing user to club
- [ ] Test PUT /members/:id - update member
- [ ] Test DELETE /members/:id
- [ ] Test GET /attendance - returns nested data
- [ ] Test POST /attendance - check-in
- [ ] Test GET /matches - returns nested player data
- [ ] Test POST /matches - create match

### Frontend Component Tests
- [ ] Test member list displays correctly
- [ ] Test member form - add new member
- [ ] Test member form - edit existing member
- [ ] Test member form - add existing user to club
- [ ] Test member deletion
- [ ] Test attendance displays
- [ ] Test match displays
- [ ] Test practice details modal

### Integration Tests
- [ ] Create user with multiple club memberships
- [ ] Verify user profile consistent across clubs
- [ ] Test switching between clubs
- [ ] Test member status per club (ACTIVE in Club A, INACTIVE in Club B)
- [ ] Test guest check-in with new schema
- [ ] Test match creation with club members
- [ ] Test attendance check-in
- [ ] Test statistics calculation

### Edge Cases
- [ ] User with no club memberships
- [ ] User with 5+ club memberships
- [ ] Deleting club with members (cascade)
- [ ] Deleting user with memberships (cascade)
- [ ] Adding same user to same club twice (should fail)
- [ ] Member type GUEST vs MEMBER
- [ ] Expired membership status

## Phase 8: Documentation & Deployment ⏳ NOT STARTED

### Documentation
- [x] SCHEMA_REDESIGN.md created
- [x] MIGRATION_QUICK_REFERENCE.md created
- [x] context.txt updated
- [ ] Update API documentation
- [ ] Update README.md
- [ ] Create migration guide for developers
- [ ] Document breaking changes

### Deployment
- [ ] Create deployment plan
- [ ] Schedule maintenance window
- [ ] Backup production database
- [ ] Deploy backend changes
- [ ] Apply database migration
- [ ] Deploy frontend changes
- [ ] Verify production functionality
- [ ] Monitor error logs
- [ ] Prepare rollback plan if needed

## Phase 9: Post-Deployment ⏳ NOT STARTED

### Monitoring
- [ ] Monitor application logs for errors
- [ ] Check database query performance
- [ ] Verify new indexes are being used
- [ ] Monitor API response times
- [ ] Check for any user-reported issues

### Cleanup
- [ ] Remove old migration (optimize_user_member_tables) if superseded
- [ ] Archive old Member-related code
- [ ] Update code comments
- [ ] Clean up unused types/interfaces

### Future Enhancements
- [ ] Add UI for switching between clubs
- [ ] Show all user's club memberships
- [ ] Add "primary club" concept
- [ ] Implement cross-club statistics
- [ ] Add club invitation system

---

## Progress Summary

- ✅ **Phase 1:** Schema & Migration - COMPLETE
- ⏳ **Phase 2:** Database Migration - PENDING (database not running)
- ⏳ **Phase 3:** Backend Services - NOT STARTED (0/6 services)
- ⏳ **Phase 4:** API Routes - NOT STARTED
- ⏳ **Phase 5:** Frontend Types - NOT STARTED
- ⏳ **Phase 6:** Frontend Components - NOT STARTED (0/6 components)
- ⏳ **Phase 7:** Testing - NOT STARTED
- ⏳ **Phase 8:** Documentation & Deployment - PARTIALLY COMPLETE (docs done)
- ⏳ **Phase 9:** Post-Deployment - NOT STARTED

**Overall Progress:** 1/9 phases complete (11%)

**Estimated Remaining Time:** 1-2 days for full implementation

**Next Step:** Apply database migration when database is available

---

Last Updated: December 8, 2024
