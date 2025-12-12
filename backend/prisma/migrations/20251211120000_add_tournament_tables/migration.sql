-- Add tournament tables (participants, matches, standings, templates)

-- Create tournament_participants table
CREATE TABLE "tournament_participants" (
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

CREATE INDEX "tournament_participants_tournamentId_idx" ON "tournament_participants"("tournamentId");
CREATE INDEX "tournament_participants_memberId_idx" ON "tournament_participants"("memberId");

-- Create tournament_matches table
CREATE TABLE "tournament_matches" (
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

CREATE INDEX "tournament_matches_tournamentId_idx" ON "tournament_matches"("tournamentId");
CREATE INDEX "tournament_matches_round_idx" ON "tournament_matches"("round");
CREATE INDEX "tournament_matches_player1Id_idx" ON "tournament_matches"("player1Id");
CREATE INDEX "tournament_matches_player2Id_idx" ON "tournament_matches"("player2Id");

-- Create tournament_standings table
CREATE TABLE "tournament_standings" (
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

CREATE INDEX "tournament_standings_tournamentId_idx" ON "tournament_standings"("tournamentId");
CREATE INDEX "tournament_standings_memberId_idx" ON "tournament_standings"("memberId");

-- Create tournament_templates table
CREATE TABLE "tournament_templates" (
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

CREATE INDEX "tournament_templates_clubId_idx" ON "tournament_templates"("clubId");
