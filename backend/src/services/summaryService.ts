import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface MatchHighlight {
  id: string;
  player1Name: string;
  player2Name: string;
  player1SkillLevel: string;
  player2SkillLevel: string;
  player1Score: number;
  player2Score: number;
  matchType: string;
  isUpset: boolean;
  scoreMargin: number;
}

export interface TopPerformer {
  playerId: string;
  playerName: string;
  wins: number;
  matchesPlayed: number;
  winRate: number;
}

export interface PracticeSummary {
  practiceId: string;
  practiceDate: string;
  court: string;
  totalMatches: number;
  topPerformers: TopPerformer[];
  mostMatches: {
    playerId: string;
    playerName: string;
    matchCount: number;
  } | null;
  closestScore: MatchHighlight | null;
  biggestUpset: MatchHighlight | null;
  totalParticipants: number;
}

class SummaryService {
  /**
   * Get all matches for a practice
   */
  private async getPracticeMatches(practiceId: string) {
    const matches = await prisma.match.findMany({
      where: { practiceId },
      include: {
        player1: true,
        player2: true,
      },
    });

    return matches.map((match: any) => ({
      id: match.id,
      player1Id: match.player1Id,
      player1Name: match.player1.name,
      player1SkillLevel: match.player1.skillLevel || 'INTERMEDIATE',
      player2Id: match.player2Id,
      player2Name: match.player2.name,
      player2SkillLevel: match.player2.skillLevel || 'INTERMEDIATE',
      player1Score: match.score1,
      player2Score: match.score2,
      matchType: match.matchType,
      createdAt: match.createdAt,
    }));
  }

  /**
   * Calculate top performers for a practice
   */
  private calculateTopPerformers(matches: any[]): TopPerformer[] {
    const playerStats = new Map<
      string,
      { name: string; wins: number; matches: number }
    >();

    matches.forEach((match) => {
      const player1Winner = match.player1Score > match.player2Score;

      // Player 1
      if (!playerStats.has(match.player1Id)) {
        playerStats.set(match.player1Id, {
          name: match.player1Name,
          wins: 0,
          matches: 0,
        });
      }
      const p1Stats = playerStats.get(match.player1Id)!;
      p1Stats.matches += 1;
      if (player1Winner) p1Stats.wins += 1;

      // Player 2
      if (!playerStats.has(match.player2Id)) {
        playerStats.set(match.player2Id, {
          name: match.player2Name,
          wins: 0,
          matches: 0,
        });
      }
      const p2Stats = playerStats.get(match.player2Id)!;
      p2Stats.matches += 1;
      if (!player1Winner) p2Stats.wins += 1;
    });

    const performers = Array.from(playerStats.entries())
      .map(([playerId, stats]) => ({
        playerId,
        playerName: stats.name,
        wins: stats.wins,
        matchesPlayed: stats.matches,
        winRate: stats.matches > 0 ? (stats.wins / stats.matches) * 100 : 0,
      }))
      .sort((a, b) => {
        // Sort by win rate first, then by matches
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.matchesPlayed - a.matchesPlayed;
      });

    return performers.slice(0, 5); // Top 5 performers
  }

  /**
   * Find player with most matches
   */
  private findMostMatches(matches: any[]) {
    const playerMatchCount = new Map<string, { name: string; count: number }>();

    matches.forEach((match) => {
      const increment = (
        playerId: string,
        playerName: string
      ) => {
        if (!playerMatchCount.has(playerId)) {
          playerMatchCount.set(playerId, { name: playerName, count: 0 });
        }
        const entry = playerMatchCount.get(playerId)!;
        entry.count += 1;
      };

      increment(match.player1Id, match.player1Name);
      increment(match.player2Id, match.player2Name);
    });

    if (playerMatchCount.size === 0) return null;

    const mostMatches = Array.from(playerMatchCount.entries()).sort(
      (a, b) => b[1].count - a[1].count
    )[0];

    return {
      playerId: mostMatches[0],
      playerName: mostMatches[1].name,
      matchCount: mostMatches[1].count,
    };
  }

  /**
   * Find closest score match
   */
  private findClosestScore(matches: any[]): MatchHighlight | null {
    if (matches.length === 0) return null;

    let closestMatch = matches[0];
    let smallestMargin = Math.abs(
      closestMatch.player1Score - closestMatch.player2Score
    );

    matches.forEach((match) => {
      const margin = Math.abs(match.player1Score - match.player2Score);
      if (margin < smallestMargin) {
        smallestMargin = margin;
        closestMatch = match;
      }
    });

    return {
      id: closestMatch.id,
      player1Name: closestMatch.player1Name,
      player2Name: closestMatch.player2Name,
      player1SkillLevel: closestMatch.player1SkillLevel,
      player2SkillLevel: closestMatch.player2SkillLevel,
      player1Score: closestMatch.player1Score,
      player2Score: closestMatch.player2Score,
      matchType: closestMatch.matchType,
      isUpset: false,
      scoreMargin: smallestMargin,
    };
  }

  /**
   * Identify biggest upset
   */
  private identifyBiggestUpset(matches: any[]): MatchHighlight | null {
    if (matches.length === 0) return null;

    const skillLevelRank = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };

    let biggestUpset: MatchHighlight | null = null;
    let maxSkillDifference = 0;

    matches.forEach((match) => {
      const p1Level =
        skillLevelRank[match.player1SkillLevel as keyof typeof skillLevelRank] ||
        2;
      const p2Level =
        skillLevelRank[match.player2SkillLevel as keyof typeof skillLevelRank] ||
        2;

      const skillDifference = Math.abs(p1Level - p2Level);

      if (skillDifference > 0) {
        // Determine if it's an upset
        const player1IsLower = p1Level < p2Level;
        const player1Won = match.player1Score > match.player2Score;

        // Upset = lower skill level player beat higher skill level player
        const isUpset =
          (player1IsLower && player1Won) ||
          (!player1IsLower && !player1Won);

        if (isUpset && skillDifference > maxSkillDifference) {
          maxSkillDifference = skillDifference;
          biggestUpset = {
            id: match.id,
            player1Name: match.player1Name,
            player2Name: match.player2Name,
            player1SkillLevel: match.player1SkillLevel,
            player2SkillLevel: match.player2SkillLevel,
            player1Score: match.player1Score,
            player2Score: match.player2Score,
            matchType: match.matchType,
            isUpset: true,
            scoreMargin: Math.abs(
              match.player1Score - match.player2Score
            ),
          };
        }
      }
    });

    return biggestUpset;
  }

  /**
   * Get unique participants
   */
  private getUniqueParticipants(matches: any[]): number {
    const participants = new Set<string>();
    matches.forEach((match) => {
      participants.add(match.player1Id);
      participants.add(match.player2Id);
    });
    return participants.size;
  }

  /**
   * Generate practice summary
   */
  async getPracticeSummary(practiceId: string): Promise<PracticeSummary | null> {
    // Fetch practice
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) return null;

    // Get all matches for this practice
    const matches = await this.getPracticeMatches(practiceId);

    if (matches.length === 0) {
      return {
        practiceId,
        practiceDate: practice.date.toISOString().split('T')[0],
        court: practice.court || 'N/A',
        totalMatches: 0,
        topPerformers: [],
        mostMatches: null,
        closestScore: null,
        biggestUpset: null,
        totalParticipants: 0,
      };
    }

    return {
      practiceId,
      practiceDate: practice.date.toISOString().split('T')[0],
      court: practice.court || 'N/A',
      totalMatches: matches.length,
      topPerformers: this.calculateTopPerformers(matches),
      mostMatches: this.findMostMatches(matches),
      closestScore: this.findClosestScore(matches),
      biggestUpset: this.identifyBiggestUpset(matches),
      totalParticipants: this.getUniqueParticipants(matches),
    };
  }

  /**
   * Get summaries for multiple practices
   */
  async getPracticeSummaries(
    clubId: string,
    limit: number = 10
  ): Promise<PracticeSummary[]> {
    const practices = await prisma.practice.findMany({
      where: { clubId },
      orderBy: { date: 'desc' },
      take: limit,
    });

    const summaries: PracticeSummary[] = [];

    for (const practice of practices) {
      const summary = await this.getPracticeSummary(practice.id);
      if (summary) {
        summaries.push(summary);
      }
    }

    return summaries;
  }
}

export default new SummaryService();
