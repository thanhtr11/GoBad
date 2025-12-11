-- Manual SQL Migration for Tournament Features
-- Run this if the Prisma migration doesn't apply automatically

-- Add templateId column to tournaments if it doesn't exist
ALTER TABLE "tournaments"
ADD COLUMN IF NOT EXISTS "templateId" TEXT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tournaments_templateId_fkey' 
    AND table_name = 'tournaments'
  ) THEN
    ALTER TABLE "tournaments"
    ADD CONSTRAINT "tournaments_templateId_fkey" 
    FOREIGN KEY ("templateId") 
    REFERENCES "tournament_templates" ("id") 
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create tournament_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS "tournament_participants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tournamentId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "seedRank" INTEGER,
  "joinedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "tournament_participants_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_participants_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "club_members" ("id") ON DELETE CASCADE,
  UNIQUE("tournamentId", "memberId")
);

CREATE INDEX IF NOT EXISTS "tournament_participants_tournamentId_idx" ON "tournament_participants"("tournamentId");
CREATE INDEX IF NOT EXISTS "tournament_participants_memberId_idx" ON "tournament_participants"("memberId");

-- Create tournament_matches table if it doesn't exist
CREATE TABLE IF NOT EXISTS "tournament_matches" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tournamentId" TEXT NOT NULL,
  "round" INTEGER NOT NULL,
  "position" INTEGER NOT NULL,
  "player1Id" TEXT,
  "player2Id" TEXT,
  "player1Score" INTEGER,
  "player2Score" INTEGER,
  "winnerId" TEXT,
  "scheduledDate" TIMESTAMP,
  "scheduledTime" TEXT,
  "court" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "tournament_matches_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_matches_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "club_members" ("id") ON DELETE SET NULL,
  CONSTRAINT "tournament_matches_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "club_members" ("id") ON DELETE SET NULL,
  CONSTRAINT "tournament_matches_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "club_members" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "tournament_matches_tournamentId_idx" ON "tournament_matches"("tournamentId");
CREATE INDEX IF NOT EXISTS "tournament_matches_round_idx" ON "tournament_matches"("round");
CREATE INDEX IF NOT EXISTS "tournament_matches_player1Id_idx" ON "tournament_matches"("player1Id");
CREATE INDEX IF NOT EXISTS "tournament_matches_player2Id_idx" ON "tournament_matches"("player2Id");

-- Create tournament_standings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "tournament_standings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tournamentId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
  "wins" INTEGER NOT NULL DEFAULT 0,
  "losses" INTEGER NOT NULL DEFAULT 0,
  "pointsFor" INTEGER NOT NULL DEFAULT 0,
  "pointsAgainst" INTEGER NOT NULL DEFAULT 0,
  "ranking" INTEGER,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "tournament_standings_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments" ("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_standings_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "club_members" ("id") ON DELETE CASCADE,
  UNIQUE("tournamentId", "memberId")
);

CREATE INDEX IF NOT EXISTS "tournament_standings_tournamentId_idx" ON "tournament_standings"("tournamentId");
CREATE INDEX IF NOT EXISTS "tournament_standings_memberId_idx" ON "tournament_standings"("memberId");

-- Create tournament_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS "tournament_templates" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clubId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "description" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "tournament_templates_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs" ("id") ON DELETE CASCADE,
  CONSTRAINT "tournament_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "tournament_templates_clubId_idx" ON "tournament_templates"("clubId");

-- Add index for templateId if it doesn't exist
CREATE INDEX IF NOT EXISTS "tournaments_templateId_idx" ON "tournaments"("templateId");
