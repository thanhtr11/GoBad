-- AlterTable: Add new columns to users table
ALTER TABLE "users" 
ADD COLUMN "name" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "skillLevel" TEXT,
ADD COLUMN "membershipTier" TEXT;

-- Create index on users.skillLevel
CREATE INDEX "users_skillLevel_idx" ON "users"("skillLevel");

-- CreateTable: Create new club_members junction table
CREATE TABLE "club_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "type" TEXT NOT NULL DEFAULT 'MEMBER',
    "checkedInById" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "club_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Add indexes to club_members
CREATE INDEX "club_members_clubId_idx" ON "club_members"("clubId");
CREATE INDEX "club_members_userId_idx" ON "club_members"("userId");
CREATE INDEX "club_members_clubId_status_idx" ON "club_members"("clubId", "status");
CREATE INDEX "club_members_clubId_type_idx" ON "club_members"("clubId", "type");
CREATE UNIQUE INDEX "club_members_userId_clubId_key" ON "club_members"("userId", "clubId");

-- AddForeignKey: Add foreign keys to club_members
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "club_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Copy data from members to users and club_members
-- Step 1: Update users table with member data
UPDATE "users" u
SET 
    "name" = m."name",
    "phone" = m."phone",
    "skillLevel" = m."skillLevel",
    "membershipTier" = m."membershipTier"
FROM "members" m
WHERE u."id" = m."userId";

-- Step 2: Migrate member records to club_members
INSERT INTO "club_members" ("id", "userId", "clubId", "status", "type", "checkedInById", "joinedAt", "createdAt", "updatedAt")
SELECT 
    "id",
    "userId",
    "clubId",
    "status",
    "type",
    "checkedInById",
    "joinedAt",
    "createdAt",
    "updatedAt"
FROM "members";

-- Step 3: Update foreign key references in matches table
-- Note: player1Id and player2Id already reference member IDs, which become club_member IDs
-- No changes needed as IDs are preserved

-- Step 4: Update foreign key references in attendance table
-- Note: memberId already references member IDs, which become club_member IDs
-- No changes needed as IDs are preserved

-- AlterTable: Update foreign key constraints in matches table
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_player1Id_fkey";
ALTER TABLE "matches" DROP CONSTRAINT IF EXISTS "matches_player2Id_fkey";
ALTER TABLE "matches" ADD CONSTRAINT "matches_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "club_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "club_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Update foreign key constraint in attendance table
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_memberId_fkey";
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "club_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropTable: Remove old members table
DROP TABLE "members";
