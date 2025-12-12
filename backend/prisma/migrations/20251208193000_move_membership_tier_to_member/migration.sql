-- Move membershipTier from users to club_members
-- 1) Add membershipTier column to club_members with default
ALTER TABLE "club_members"
ADD COLUMN "membershipTier" "MembershipTier" NOT NULL DEFAULT 'ADULT';

-- 2) Backfill from users based on userId (cast text to enum)
UPDATE "club_members" cm
SET "membershipTier" = u."membershipTier"::"MembershipTier"
FROM "users" u
WHERE cm."userId" = u."id"
  AND u."membershipTier" IS NOT NULL;

-- 3) Drop membershipTier from users
ALTER TABLE "users"
DROP COLUMN "membershipTier";
