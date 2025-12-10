# Role-Based Permission System

## Overview
GoBad now implements a comprehensive role-based permission system with four distinct user roles, each with specific access levels and capabilities.

## User Roles

### 1. **SUPER_ADMIN** (Super Administrator)
- **Permissions:** Access to all clubs and features
- **Capabilities:**
  - View and manage all clubs
  - Create new clubs
  - Access all financial reports
  - View all practices and matches
  - Manage all users and roles
  - No club-specific restrictions

### 2. **MANAGER** (Club Manager)
- **Permissions:** Access to assigned clubs only
- **Capabilities:**
  - View and edit clubs they manage
  - Access financial reports for their clubs
  - View practices and matches in their clubs
  - Create practices and record matches in their clubs
  - Manage members in their clubs
  - Cannot access other managers' clubs
  - Requires explicit `ClubManager` relationship in database

### 3. **MEMBER** (Club Member)
- **Permissions:** Access to their specific club only
- **Capabilities:**
  - View practices and matches in their club
  - Check in for practices
  - View financial reports (summary only)
  - Participate in matches
  - Cannot manage the club or access settings

### 4. **GUEST** (Guest User)
- **Permissions:** View-only access to their club
- **Capabilities:**
  - View practices and matches in their club
  - Check in for practices (if allowed)
  - Cannot edit anything
  - Cannot access financial information
  - Cannot manage members or matches

## Database Schema

### User Model
```prisma
model User {
  id        String       @id @default(uuid())
  username  String       @unique
  email     String?
  password  String
  role      UserRole     @default(MEMBER)
  
  // Relations
  member       Member?
  managedClubs ClubManager[]
}

enum UserRole {
  SUPER_ADMIN
  MANAGER
  MEMBER
  GUEST
}
```

### ClubManager Model (New)
```prisma
model ClubManager {
  id        String   @id @default(uuid())
  userId    String
  clubId    String
  
  // Relations
  user User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  club Club  @relation(fields: [clubId], references: [id], onDelete: Cascade)
  
  @@unique([userId, clubId])
}
```

## Middleware Implementation

### Access Control Middleware Files

1. **roleCheck.ts** - General role checking
   - `roleCheck(...roles)` - Check for specific roles
   - `superAdminOnly()` - SUPER_ADMIN only access
   - `adminOnly()` - SUPER_ADMIN or MANAGER with club access
   - `memberAccess()` - MEMBER, MANAGER, SUPER_ADMIN
   - `guestAccess()` - All authenticated users
   - `managerOrAdmin()` - Async middleware for club-specific MANAGER access

2. **permissions.ts** (NEW) - Club and practice-specific access
   - `checkClubAccess()` - Verify user can access a specific club
   - `checkPracticeAccess()` - Verify user can view a practice
   - `checkMatchAccess()` - Verify user can view a match

## Access Control Logic

### Club Access
| Role | All Clubs | Specific Clubs | No Access |
|------|-----------|----------------|-----------|
| SUPER_ADMIN | ✅ | ✅ | ❌ |
| MANAGER | ❌ | ✅ (assigned) | ✅ (others) |
| MEMBER | ❌ | ✅ (their club) | ✅ (others) |
| GUEST | ❌ | ✅ (their club) | ✅ (others) |

### Practice/Match View Access
| Role | In Their Club | Other Clubs |
|------|---------------|-------------|
| SUPER_ADMIN | ✅ | ✅ |
| MANAGER | ✅ | ❌ |
| MEMBER | ✅ | ❌ |
| GUEST | ✅ (view only) | ❌ |

## Test Credentials

The seeded database includes test accounts for each role:

```
SUPER_ADMIN:
  Username: admin
  Password: password123
  
MANAGER:
  Username: manager
  Password: password123
  (Manages: Downtown Badminton Club)
  
MEMBER:
  Username: alice, bob, charlie
  Password: password123
  (All members of Downtown Badminton Club)
  
GUEST:
  Username: guest
  Password: password123
  (Guest in Downtown Badminton Club)
```

## Implementation Examples

### Using Role Check Middleware
```typescript
// Protect route - only SUPER_ADMIN
router.post('/', superAdminOnly, controller);

// Protect route - SUPER_ADMIN or MANAGER with club access
router.put('/:clubId', adminOnly, managerOrAdmin, controller);

// Protect route - All members and above
router.get('/', memberAccess, controller);
```

### Using Permission Middleware
```typescript
// Check specific club access
router.get('/:clubId', checkClubAccess, controller);

// Check practice access (views)
router.get('/practice/:practiceId', checkPracticeAccess, controller);

// Check match access (views)
router.get('/match/:matchId', checkMatchAccess, controller);
```

## Future Enhancements

1. **Granular Permissions** - Add specific permission flags to ClubManager
2. **Role Hierarchy** - Define permission inheritance between roles
3. **Audit Logging** - Track permission checks and access attempts
4. **Custom Roles** - Allow creation of custom roles with specific permissions
5. **Time-Based Access** - Restrict access based on date/time ranges
