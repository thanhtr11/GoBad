-- AlterTable: Make user email unique
ALTER TABLE "users" ADD CONSTRAINT "users_email_key" UNIQUE ("email");

-- CreateIndex: Add index on user role for role-based queries
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex: Add index on user email for faster lookups
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex: Add composite index on member clubId and status for filtered queries
CREATE INDEX "members_clubId_status_idx" ON "members"("clubId", "status");

-- CreateIndex: Add composite index on member clubId and type for member/guest filtering
CREATE INDEX "members_clubId_type_idx" ON "members"("clubId", "type");

-- CreateIndex: Add composite index on member clubId and skillLevel for skill-based queries
CREATE INDEX "members_clubId_skillLevel_idx" ON "members"("clubId", "skillLevel");

-- CreateIndex: Add index on member email for faster email lookups
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex: Add index on member name for search functionality
CREATE INDEX "members_name_idx" ON "members"("name");
