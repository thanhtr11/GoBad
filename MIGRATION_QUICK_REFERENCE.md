# Quick Reference: Member → ClubMember Migration

## At a Glance

**Old:** `Member` table (one-to-one with User)  
**New:** `ClubMember` table (many-to-many junction)

## Common Code Changes

### Backend: Prisma Queries

```typescript
// OLD ❌
const members = await prisma.member.findMany({
  where: { clubId }
});

// NEW ✅
const members = await prisma.clubMember.findMany({
  where: { clubId },
  include: { user: true }  // Include user data
});
```

```typescript
// OLD ❌
const member = await prisma.member.create({
  data: {
    userId,
    clubId,
    name,
    email,
    phone,
    skillLevel
  }
});

// NEW ✅
// Option 1: Existing user
const member = await prisma.clubMember.create({
  data: {
    userId,
    clubId,
    status: 'ACTIVE',
    type: 'MEMBER'
  },
  include: { user: true }
});

// Option 2: New user
const member = await prisma.clubMember.create({
  data: {
    clubId,
    status: 'ACTIVE',
    type: 'MEMBER',
    user: {
      create: {
        username,
        email,
        password,
        name,
        phone,
        skillLevel
      }
    }
  },
  include: { user: true }
});
```

### Frontend: Accessing Data

```typescript
// OLD ❌
<td>{member.name}</td>
<td>{member.email}</td>
<td>{member.phone}</td>
<td>{member.skillLevel}</td>

// NEW ✅
<td>{member.user.name}</td>
<td>{member.user.email}</td>
<td>{member.user.phone}</td>
<td>{member.user.skillLevel}</td>
```

```typescript
// OLD ❌
interface Member {
  id: string;
  name: string;
  email: string;
  phone?: string;
  skillLevel?: string;
}

// NEW ✅
interface ClubMember {
  id: string;
  userId: string;
  clubId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  type: 'MEMBER' | 'GUEST';
  user: {
    id: string;
    username: string;
    email: string;
    name?: string;
    phone?: string;
    skillLevel?: string;
  };
}
```

## Field Mapping

| Old Location | New Location | Notes |
|--------------|--------------|-------|
| `Member.name` | `User.name` | Access via `clubMember.user.name` |
| `Member.email` | `User.email` | Access via `clubMember.user.email` |
| `Member.phone` | `User.phone` | Access via `clubMember.user.phone` |
| `Member.skillLevel` | `User.skillLevel` | Access via `clubMember.user.skillLevel` |
| `Member.membershipTier` | `User.membershipTier` | Access via `clubMember.user.membershipTier` |
| `Member.status` | `ClubMember.status` | Direct access |
| `Member.type` | `ClubMember.type` | Direct access |
| `Member.clubId` | `ClubMember.clubId` | Direct access |
| `Member.userId` | `ClubMember.userId` | Direct access |

## Files to Update

### High Priority (Required)
- [ ] `backend/src/services/memberService.ts`
- [ ] `backend/src/services/attendanceService.ts`
- [ ] `backend/src/services/matchService.ts`
- [ ] `frontend/src/components/members/MemberList.tsx`
- [ ] `frontend/src/components/members/MemberForm.tsx`
- [ ] `frontend/src/pages/MembersPage.tsx`

### Medium Priority (Important)
- [ ] `backend/src/services/clubService.ts`
- [ ] `backend/src/services/practiceService.ts`
- [ ] `frontend/src/components/practices/PracticeDetailsModal.tsx`
- [ ] `frontend/src/components/attendance/AttendanceList.tsx`

### Low Priority (Review)
- [ ] Any components displaying member names
- [ ] Any queries fetching member data
- [ ] Type definitions and interfaces

## Testing Checklist

Quick tests to verify migration:
- [ ] Can view members list
- [ ] Can add new member
- [ ] Can edit existing member
- [ ] Can delete member
- [ ] Can check in to practice
- [ ] Can view practice attendance
- [ ] Can create match with players
- [ ] Member names display correctly
- [ ] Email/phone display correctly

## Common Errors

### Error: "Cannot read property 'name' of undefined"
**Cause:** Frontend trying to access `member.name` instead of `member.user.name`  
**Fix:** Update to nested structure: `member.user.name`

### Error: "Invalid prisma.member.findMany invocation"
**Cause:** Backend still using `prisma.member` instead of `prisma.clubMember`  
**Fix:** Change to `prisma.clubMember` and add `include: { user: true }`

### Error: "Unique constraint failed on userId"
**Cause:** Trying to create second club membership but old unique constraint expected  
**Fix:** This shouldn't happen after migration. Check that migration ran successfully.

## Need Help?

See full documentation: `SCHEMA_REDESIGN.md`
