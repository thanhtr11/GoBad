# User & Member Creation After Schema Redesign

## 🎯 Overview

After the schema redesign, user creation happens in **two ways**:

1. **User Registration** (Public, creates User only)
2. **Member Addition** (Admin/Manager adds user to club as ClubMember)

---

## 📝 Step 1: User Registration (Frontend)

Members self-register to create their account:

**Route:** `POST /api/auth/register`

**Request Body:**
```json
{
  "username": "alice",
  "password": "securePassword123",
  "name": "Alice Johnson",
  "email": "alice@example.com"
}
```

**What Creates:**
- ✅ Creates `User` table record with:
  - `id`, `username`, `email`, `password` (hashed), `role: 'MEMBER'`
  - New fields: `name`, `phone` (optional), `skillLevel` (optional), `membershipTier` (optional)
- ✅ Returns JWT token
- ❌ Does NOT create ClubMember yet (user has no club)

**Response:**
```json
{
  "user": {
    "id": "user-uuid",
    "username": "alice",
    "role": "MEMBER"
  },
  "token": "eyJhbGc..."
}
```

---

## 👥 Step 2: Member Addition (Admin adds user to club)

After registration, admin/manager must add user to a club as a `ClubMember`:

**Route:** `POST /api/members`

**Request Body - Option 1: Add Existing User**
```json
{
  "clubId": "club-uuid",
  "userId": "user-uuid",
  "status": "ACTIVE",
  "type": "MEMBER"
}
```

**Request Body - Option 2: Create New User + Member**
```json
{
  "clubId": "club-uuid",
  "name": "Bob Smith",
  "email": "bob@example.com",
  "phone": "+1234567890",
  "skillLevel": "INTERMEDIATE",
  "membershipTier": "ADULT",
  "type": "MEMBER",
  "username": "bob",
  "password": "securePassword123"
}
```

**What Creates:**
- ✅ Creates `ClubMember` table record with:
  - `id`, `userId`, `clubId`, `status`, `type`, `joinedAt`
  - Links User to Club with unique constraint `[userId, clubId]`
- ✅ If Option 2: First creates User record
- ✅ Returns ClubMember with nested User data

**Response:**
```json
{
  "message": "Member added successfully",
  "member": {
    "id": "club-member-uuid",
    "userId": "user-uuid",
    "clubId": "club-uuid",
    "status": "ACTIVE",
    "type": "MEMBER",
    "joinedAt": "2024-12-08T10:30:00Z",
    "user": {
      "id": "user-uuid",
      "username": "bob",
      "email": "bob@example.com",
      "name": "Bob Smith",
      "phone": "+1234567890",
      "skillLevel": "INTERMEDIATE",
      "membershipTier": "ADULT",
      "role": "MEMBER"
    }
  }
}
```

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────┐
│ Member Self-Registers               │
│ POST /api/auth/register             │
├─────────────────────────────────────┤
│ Creates User record                 │
│ - username, password (hashed)       │
│ - name, email                       │
│ - skillLevel, membershipTier        │
│ - role: MEMBER                      │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ User logged  │
        │ in but has   │
        │ no club yet  │
        └──────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Admin/Manager adds user to club     │
│ POST /api/members                   │
├─────────────────────────────────────┤
│ Creates ClubMember record           │
│ - links userId to clubId            │
│ - sets status & type                │
│ - sets joinedAt timestamp           │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ User is now member   │
        │ of specific club     │
        │ (can join more clubs)│
        └──────────────────────┘
```

---

## 💾 Database Changes

### Before Schema (Member = One-to-One with User)
```sql
Users:
├── id, username, email, password, role
└── (no name, phone, skillLevel, membershipTier)

Members:
├── id, userId (unique!), clubId
├── name, email, phone
├── skillLevel, membershipTier, status, type
└── (contains duplicate data from user)
```

### After Schema (ClubMember = Junction Table)
```sql
Users:
├── id, username, email, password, role
├── name, phone ✨ NEW
├── skillLevel, membershipTier ✨ NEW
└── (unified profile across all clubs)

ClubMembers:
├── id, userId, clubId
├── status, type, joinedAt
├── checkedInById
├── (unique constraint: [userId, clubId])
└── (per-club specific data only)
```

---

## 🔐 Updated `addMember()` Function

### File: `backend/src/services/memberService.ts`

**Before (Old Schema):**
```typescript
async addMember(data: {
  clubId: string;
  name: string;
  email?: string;
  phone?: string;
  skillLevel?: SkillLevel;
  membershipTier?: MembershipTier;
  type: MemberType;
  username?: string;
  password?: string;
}) {
  // Create User if username/password provided
  if (data.username && data.password) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email || null,
        password: hashedPassword,
        role: 'MEMBER',
      },
    });
    userId = user.id;
  }

  // Create Member record (all user data duplicated)
  const member = await prisma.member.create({
    data: {
      clubId: data.clubId,
      userId: userId,
      name: data.name.trim(),
      email: data.email?.trim(),
      phone: data.phone?.trim(),
      skillLevel: data.skillLevel || 'INTERMEDIATE',
      membershipTier: data.membershipTier || 'ADULT',
      type: data.type,
      status: 'ACTIVE',
      joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
    },
  });

  return member;
}
```

**After (New Schema):**
```typescript
async addMember(data: {
  clubId: string;
  userId?: string; // NEW: existing user option
  name?: string; // OPTIONAL: only if creating new user
  email?: string;
  phone?: string;
  skillLevel?: SkillLevel;
  membershipTier?: MembershipTier;
  type: MemberType;
  username?: string; // OPTIONAL: only if creating new user
  password?: string; // OPTIONAL: only if creating new user
}) {
  if (!data.clubId) {
    throw new ValidationError('Club ID is required');
  }

  if (!data.type) {
    throw new ValidationError('Member type is required');
  }

  // Verify club exists
  const club = await prisma.club.findUnique({ 
    where: { id: data.clubId } 
  });
  if (!club) {
    throw new NotFoundError(`Club with ID ${data.clubId} not found`);
  }

  let userId: string;

  // Option 1: Use existing userId
  if (data.userId) {
    userId = data.userId;
    
    // Verify user exists
    const user = await prisma.user.findUnique({ 
      where: { id: data.userId } 
    });
    if (!user) {
      throw new NotFoundError(`User with ID ${data.userId} not found`);
    }
  } 
  // Option 2: Create new User + ClubMember
  else if (data.username && data.password && data.name) {
    // Update User with profile data
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email || null,
        password: hashedPassword,
        name: data.name.trim(),
        phone: data.phone?.trim(),
        skillLevel: data.skillLevel || 'INTERMEDIATE',
        membershipTier: data.membershipTier || 'ADULT',
        role: 'MEMBER',
      },
    });
    userId = user.id;
  } 
  else {
    throw new ValidationError(
      'Either userId or (username, password, name) must be provided'
    );
  }

  // Check if already member of this club
  const existing = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId, clubId: data.clubId } }
  });

  if (existing) {
    throw new ValidationError(
      'User is already a member of this club'
    );
  }

  // Create ClubMember record (junction table)
  const member = await prisma.clubMember.create({
    data: {
      userId,
      clubId: data.clubId,
      type: data.type,
      status: 'ACTIVE',
      joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
    },
    include: {
      user: true,
    },
  });

  return member;
}
```

---

## 📋 API Endpoint Updates

### Before: `POST /api/members` (Old)
```javascript
// Request
{
  "clubId": "club-id",
  "name": "John",
  "email": "john@example.com",
  "skillLevel": "ADVANCED"
  // All user data in one request
}

// Creates Member table record with all fields
```

### After: `POST /api/members` (New)
```javascript
// Request Option 1: Add existing user
{
  "clubId": "club-id",
  "userId": "user-id",
  "type": "MEMBER"
  // Minimal - just link user to club
}

// Request Option 2: Create new user + member
{
  "clubId": "club-id",
  "username": "john",
  "password": "securePassword",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "skillLevel": "ADVANCED",
  "membershipTier": "ADULT",
  "type": "MEMBER"
  // User and ClubMember created together
}
```

---

## 🎮 Frontend Component Changes

### File: `frontend/src/components/members/MemberForm.tsx`

**Key Changes:**
1. Add option to search existing users
2. Split form into user data vs club-specific data
3. Handle both create-new and add-existing flows

**New Fields:**
```tsx
// New radio button to choose action
<input type="radio" value="existing" /> Add Existing User
<input type="radio" value="new" /> Create New User

// If "existing": show user search dropdown
<select name="userId">
  <option value="">Select user...</option>
  {availableUsers.map(u => (
    <option value={u.id}>{u.username} ({u.name})</option>
  ))}
</select>

// If "new": show creation fields (username, password, name, email)
<input placeholder="Username" {...register('username')} />
<input placeholder="Password" {...register('password')} />
<input placeholder="Full Name" {...register('name')} />
<input placeholder="Email" {...register('email')} />

// Always show club-specific fields
<select>
  <option value="MEMBER">Member</option>
  <option value="GUEST">Guest</option>
</select>
<select>
  <option value="BEGINNER">Beginner</option>
  <option value="INTERMEDIATE">Intermediate</option>
  <option value="ADVANCED">Advanced</option>
</select>
```

---

## 🐛 Common Issues

### Issue 1: "User is already a member of this club"
**Cause:** Trying to add same user to club twice  
**Fix:** Check unique constraint on `[userId, clubId]` before creating

### Issue 2: "User not found"
**Cause:** `userId` doesn't exist in database  
**Fix:** Verify user was registered first, or create new user

### Issue 3: "userId and username both missing"
**Cause:** Neither adding existing user nor creating new one  
**Fix:** Must provide either `userId` OR (`username` + `password` + `name`)

---

## ✅ Migration Checklist

### Phase 1: Backend Update
- [ ] Update `memberService.addMember()` with new logic
- [ ] Update `memberController.addMember()` validation
- [ ] Update Prisma queries to use `clubMember` instead of `member`
- [ ] Add `include: { user: true }` to all ClubMember queries
- [ ] Test API endpoints

### Phase 2: Frontend Update
- [ ] Update `MemberForm.tsx` with new fields
- [ ] Add user search/selection dropdown
- [ ] Update form submission logic
- [ ] Update type definitions
- [ ] Test member creation flow

### Phase 3: Testing
- [ ] Register new user
- [ ] Admin adds user to club
- [ ] User appears in club members list
- [ ] User can join additional clubs
- [ ] User profile consistent across clubs

---

## 📚 Related Files to Update

```
Backend:
├── backend/src/services/memberService.ts ⚠️ CRITICAL
├── backend/src/controllers/memberController.ts ⚠️ CRITICAL
├── backend/src/routes/members.ts ⚠️ CRITICAL
├── backend/seed.ts (update seed data)
└── backend/prisma/schema.prisma ✅ DONE

Frontend:
├── frontend/src/components/members/MemberForm.tsx ⚠️ CRITICAL
├── frontend/src/components/members/MemberList.tsx ⚠️ CRITICAL
├── frontend/src/pages/MembersPage.tsx ⚠️ CRITICAL
├── frontend/src/types/index.ts ⚠️ CRITICAL
└── frontend/src/utils/api.ts (may need updates)
```

---

## 🔗 See Also

- `SCHEMA_REDESIGN.md` - Full schema redesign documentation
- `MIGRATION_QUICK_REFERENCE.md` - Quick developer reference
- `IMPLEMENTATION_CHECKLIST.md` - Full implementation tracking
