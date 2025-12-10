# Schema Redesign: Multi-Club Membership Support

## Overview
This migration redesigns the database schema to support users belonging to multiple clubs, moving from a one-to-one relationship (User ←→ Member) to a many-to-many relationship (User ←→ ClubMember ←→ Club).

## What Changed

### Before (Old Schema)
```
User (1) ←→ (0-1) Member ←→ (1) Club
```
- One user could only belong to ONE club
- Member table had unique constraint on userId
- Member data duplicated user information (name, email, phone)

### After (New Schema)
```
User (1) ←→ (many) ClubMember ←→ (many) Club
```
- One user can belong to MULTIPLE clubs
- ClubMember is a junction table with unique constraint on [userId, clubId]
- User has unified profile data across all clubs

## Schema Changes

### User Model
**Added Fields:**
- `name: String?` - User's full name (moved from Member)
- `phone: String?` - User's phone number (moved from Member)
- `skillLevel: SkillLevel?` - User's skill level (moved from Member)
- `membershipTier: MembershipTier?` - User's membership tier (moved from Member)

**Changed Relations:**
- `member Member?` → `clubMemberships ClubMember[]`

**New Indexes:**
- Index on `skillLevel` for filtering

### ClubMember Model (NEW - replaces Member)
**Fields:**
- `id: String` - Primary key (preserves old Member IDs for migration)
- `userId: String` - Reference to User
- `clubId: String` - Reference to Club
- `status: MemberStatus` - Membership status (ACTIVE/INACTIVE/EXPIRED)
- `type: MemberType` - Member type (MEMBER/GUEST)
- `checkedInById: String?` - Reference to ClubMember who checked in this guest
- `joinedAt: DateTime` - When user joined this club
- `createdAt/updatedAt: DateTime` - Timestamps

**Unique Constraint:**
- `@@unique([userId, clubId])` - One membership per user per club

**Relations:**
- `user: User` - Belongs to one user
- `club: Club` - Belongs to one club
- `checkedInBy: ClubMember?` - Guest checked in by this member
- `checkedInGuests: ClubMember[]` - Guests this member checked in
- `matches: Match[]` - Player1 and Player2 relations
- `attendance: Attendance[]` - Check-in records

**Indexes:**
- `clubId` - For querying members of a club
- `userId` - For querying user's club memberships
- `(clubId, status)` - For filtering active/inactive members
- `(clubId, type)` - For filtering members vs guests

### Club Model
**Changed Relations:**
- `members: Member[]` → `members: ClubMember[]`

### Match Model
**Changed Relations:**
- `player1: Member` → `player1: ClubMember`
- `player2: Member` → `player2: ClubMember`

### Attendance Model
**Changed Relations:**
- `member: Member` → `member: ClubMember`

## Migration Strategy

### Data Migration (Automatic)
The migration SQL handles data transformation:

1. **Copy member data to users:**
   - name, phone, skillLevel, membershipTier copied to User table

2. **Create ClubMember records:**
   - All existing Member records copied to ClubMember table
   - IDs preserved to maintain foreign key integrity

3. **Update foreign keys:**
   - Match.player1Id and Match.player2Id now reference ClubMember
   - Attendance.memberId now references ClubMember

4. **Drop old table:**
   - Member table removed after successful migration

### Rollback Available
A rollback migration is provided at:
`migrations/20251208160000_redesign_user_club_relationship/rollback.sql`

This will revert the schema to the original one-to-one relationship.

## What Needs Updating

### Backend Services

#### 1. memberService.ts
- ✅ **Current:** Queries `Member` table
- ⚠️ **Update to:** Query `ClubMember` table
- **Changes needed:**
  - `prisma.member.findMany()` → `prisma.clubMember.findMany()`
  - `prisma.member.create()` → Create User + ClubMember
  - Add support for multi-club membership queries
  - Update all Prisma queries to use `clubMember` instead of `member`

#### 2. attendanceService.ts
- ✅ **Current:** References `Member` via `memberId`
- ⚠️ **Update to:** Reference `ClubMember` via `memberId`
- **Changes needed:**
  - Update includes: `include: { member: true }` → `include: { member: { include: { user: true } } }`
  - Verify foreign key relationships

#### 3. matchService.ts
- ✅ **Current:** References `Member` for player1/player2
- ⚠️ **Update to:** Reference `ClubMember` for player1/player2
- **Changes needed:**
  - Update includes: `include: { player1: true, player2: true }` → `include: { player1: { include: { user: true } }, player2: { include: { user: true } } }`

#### 4. practiceService.ts
- ⚠️ **Review:** Check if any member-related queries need updating

#### 5. clubService.ts
- ✅ **Current:** Gets members via Club relation
- ⚠️ **Update to:** Include ClubMember → User chain
- **Changes needed:**
  - `include: { members: true }` → `include: { members: { include: { user: true } } }`

### Frontend Components

#### 1. Types/Interfaces
- ⚠️ **Update:** All `Member` types → `ClubMember`
- ⚠️ **Add:** Nested user data structure
- **Example:**
  ```typescript
  interface ClubMember {
    id: string;
    userId: string;
    clubId: string;
    status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
    type: 'MEMBER' | 'GUEST';
    joinedAt: string;
    user: {
      id: string;
      username: string;
      email: string;
      name?: string;
      phone?: string;
      skillLevel?: string;
      membershipTier?: string;
    };
  }
  ```

#### 2. MemberList.tsx
- ⚠️ **Update:** Access user data via nested object
- **Changes:**
  - `member.name` → `member.user.name`
  - `member.email` → `member.user.email`
  - `member.phone` → `member.user.phone`
  - `member.skillLevel` → `member.user.skillLevel`

#### 3. MemberForm.tsx
- ⚠️ **Update:** Handle User + ClubMember creation
- **Changes:**
  - Create User first (if new user)
  - Then create ClubMember record
  - Handle editing of User data separately

#### 4. MembersPage.tsx
- ⚠️ **Update:** API response structure
- ⚠️ **Consider:** Add club switcher for users with multiple memberships

#### 5. PracticeDetailsModal.tsx
- ⚠️ **Update:** Access attendee names via `member.user.name`

#### 6. AttendanceList/components
- ⚠️ **Update:** Access member data via nested structure

### API Endpoints

#### 1. GET /members
- ⚠️ **Update:** Return ClubMember with nested User data
- **Response structure:**
  ```json
  {
    "members": [
      {
        "id": "member-id",
        "userId": "user-id",
        "clubId": "club-id",
        "status": "ACTIVE",
        "type": "MEMBER",
        "joinedAt": "2024-01-01T00:00:00Z",
        "user": {
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890",
          "skillLevel": "INTERMEDIATE"
        }
      }
    ]
  }
  ```

#### 2. POST /members
- ⚠️ **Update:** Accept userId OR create new User
- **Request body options:**
  ```json
  // Option 1: Existing user
  {
    "userId": "existing-user-id",
    "clubId": "club-id",
    "status": "ACTIVE",
    "type": "MEMBER"
  }
  
  // Option 2: New user
  {
    "user": {
      "username": "johndoe",
      "email": "john@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "skillLevel": "INTERMEDIATE"
    },
    "clubId": "club-id",
    "status": "ACTIVE",
    "type": "MEMBER"
  }
  ```

#### 3. PUT /members/:id
- ⚠️ **Update:** Handle User and ClubMember updates separately
- **Note:** May need to update User data via separate endpoint

#### 4. GET /attendance
- ⚠️ **Update:** Include nested User data in response

#### 5. GET /matches
- ⚠️ **Update:** Include nested User data for players

## New Capabilities

### Multi-Club Membership
Users can now:
1. Join multiple clubs with a single account
2. Have different statuses in different clubs (ACTIVE in Club A, INACTIVE in Club B)
3. Have different member types in different clubs (MEMBER in Club A, GUEST in Club B)
4. Maintain unified profile (name, phone, skill level) across all clubs

### Query Examples

#### Get all clubs a user belongs to:
```typescript
const userClubs = await prisma.clubMember.findMany({
  where: { userId: 'user-id' },
  include: { club: true }
});
```

#### Get all members of a club:
```typescript
const clubMembers = await prisma.clubMember.findMany({
  where: { clubId: 'club-id' },
  include: { user: true }
});
```

#### Check if user is member of specific club:
```typescript
const membership = await prisma.clubMember.findUnique({
  where: {
    userId_clubId: {
      userId: 'user-id',
      clubId: 'club-id'
    }
  }
});
```

## Testing Checklist

### Database Migration
- [ ] Run migration on development database
- [ ] Verify all data copied correctly
- [ ] Check foreign key constraints
- [ ] Test rollback migration

### Backend Services
- [ ] Test member CRUD operations
- [ ] Test attendance check-in
- [ ] Test match creation with players
- [ ] Test club member queries
- [ ] Test multi-club membership queries

### Frontend Components
- [ ] Test member list display
- [ ] Test member add/edit forms
- [ ] Test attendance displays
- [ ] Test match displays
- [ ] Test practice details modal
- [ ] Test member filtering and search

### Integration Tests
- [ ] Create user with multiple club memberships
- [ ] Verify user profile data consistency across clubs
- [ ] Test switching between clubs
- [ ] Test member status changes per club
- [ ] Test guest check-in with new schema

## Breaking Changes

⚠️ **WARNING:** This is a BREAKING CHANGE. All existing code that references the `Member` model must be updated to use `ClubMember`.

### Key Breaking Changes:
1. `Member` model renamed to `ClubMember`
2. Member data split between `User` and `ClubMember` tables
3. API response structures changed (nested user data)
4. Frontend components need to access data via nested structure
5. Unique constraint changed from `userId` to `[userId, clubId]`

## Deployment Steps

1. **Backup database** before running migration
2. **Run migration:** Apply `20251208160000_redesign_user_club_relationship/migration.sql`
3. **Verify data:** Check that all data migrated correctly
4. **Update backend:** Deploy updated services
5. **Update frontend:** Deploy updated components
6. **Test thoroughly:** Verify all functionality works
7. **Monitor:** Watch for errors in production logs

## Rollback Procedure

If issues arise:
1. **Stop backend services**
2. **Run rollback:** Apply `rollback.sql`
3. **Revert code:** Roll back backend and frontend deployments
4. **Verify:** Check that system is functional
5. **Debug:** Fix issues before attempting migration again

## Timeline Estimate

- Schema migration: 5 minutes
- Backend services update: 2-4 hours
- Frontend components update: 3-5 hours
- Testing: 2-3 hours
- **Total:** 1-2 days for full implementation and testing

## Next Steps

1. ✅ Schema redesigned
2. ✅ Migration SQL created
3. ✅ Rollback SQL created
4. ⏳ Apply migration (when database is running)
5. ⏳ Update backend services
6. ⏳ Update frontend components
7. ⏳ Run tests
8. ⏳ Deploy to production
