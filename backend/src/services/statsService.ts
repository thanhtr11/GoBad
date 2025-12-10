import { PrismaClient } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface PlayerStats {
  playerId: string;
  name: string;
  skillLevel: string;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPointsScored: number;
  totalPointsConceded: number;
  avgPointsScored: number;
  avgPointsConceded: number;
  pointDifferential: number;
  avgPointDifferential: number;
}

interface LeaderboardEntry extends PlayerStats {
  recentForm: string; // W/W/L/W format (last 5 matches)
  streak: number; // positive for win streak, negative for loss streak
}

interface HeadToHeadRecord {
  player1Name: string;
  player2Name: string;
  player1Wins: number;
  player2Wins: number;
  matches: Array<{
    id: string;
    player1Score: number;
    player2Score: number;
    matchType: string;
    date: string;
  }>;
}

interface PerformanceTrend {
  date: string;
  winRate: number;
  totalMatches: number;
  wins: number;
}

class StatsService {
  /**
   * Get player statistics
   */
  async getPlayerStats(playerId: string, clubId?: string): Promise<PlayerStats> {
    const player = await prisma.member.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // If clubId provided, verify player belongs to club
    if (clubId && player.clubId !== clubId) {
      throw new NotFoundError('Player not in this club');
    }

    // Get all matches for this player
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: playerId },
          { player2Id: playerId },
        ],
      },
      select: {
        id: true,
        score1: true,
        score2: true,
        player1Id: true,
        player2Id: true,
        matchType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    let wins = 0;
    let losses = 0;
    let totalPointsScored = 0;
    let totalPointsConceded = 0;

    matches.forEach((match) => {
      const isPlayer1 = match.player1Id === playerId;
      const playerScore = isPlayer1 ? match.score1 : match.score2;
      const opponentScore = isPlayer1 ? match.score2 : match.score1;

      totalPointsScored += playerScore;
      totalPointsConceded += opponentScore;

      if (playerScore > opponentScore) {
        wins++;
      } else {
        losses++;
      }
    });

    const totalMatches = wins + losses;
    const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const avgPointsScored = totalMatches > 0 ? totalPointsScored / totalMatches : 0;
    const avgPointsConceded = totalMatches > 0 ? totalPointsConceded / totalMatches : 0;
    const pointDifferential = totalPointsScored - totalPointsConceded;
    const avgPointDifferential = totalMatches > 0 ? pointDifferential / totalMatches : 0;

    return {
      playerId,
      name: player.user.name,
      skillLevel: player.user.skillLevel,
      totalMatches,
      wins,
      losses,
      winRate,
      totalPointsScored,
      totalPointsConceded,
      avgPointsScored,
      avgPointsConceded,
      pointDifferential,
      avgPointDifferential,
    };
  }

  /**
   * Get leaderboard for a club (ranked by wins)
   */
  async getLeaderboard(clubId: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    // Get all members in club
    const members = await prisma.member.findMany({
      where: { clubId },
      include: { user: true },
    });

    // Calculate stats for each member
    const leaderboard: LeaderboardEntry[] = [];

    for (const member of members) {
      const stats = await this.getPlayerStats(member.id, clubId);
      
      // Get recent form (last 5 matches)
      const recentMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: member.id },
            { player2Id: member.id },
          ],
        },
        select: {
          score1: true,
          score2: true,
          player1Id: true,
          player2Id: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const recentForm = recentMatches
        .map((match) => {
          const isPlayer1 = match.player1Id === member.id;
          const playerScore = isPlayer1 ? match.score1 : match.score2;
          const opponentScore = isPlayer1 ? match.score2 : match.score1;
          return playerScore > opponentScore ? 'W' : 'L';
        })
        .reverse()
        .join('');

      // Calculate win streak
      let streak = 0;
      const lastMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: member.id },
            { player2Id: member.id },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: {
          score1: true,
          score2: true,
          player1Id: true,
          player2Id: true,
        },
      });

      let streakDirection: 'win' | 'loss' | null = null;
      for (const match of lastMatches) {
        const isPlayer1 = match.player1Id === member.id;
        const playerScore = isPlayer1 ? match.score1 : match.score2;
        const opponentScore = isPlayer1 ? match.score2 : match.score1;
        const isWin = playerScore > opponentScore;

        if (streakDirection === null) {
          streakDirection = isWin ? 'win' : 'loss';
          streak = 1;
        } else if ((isWin && streakDirection === 'win') || (!isWin && streakDirection === 'loss')) {
          streak++;
        } else {
          break;
        }
      }

      leaderboard.push({
        ...stats,
        recentForm: recentForm || 'N/A',
        streak: streakDirection === 'win' ? streak : -streak,
      });
    }

    // Sort by wins (descending), then by win rate (descending)
    return leaderboard
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      })
      .slice(0, limit);
  }

  /**
   * Get head-to-head record between two players
   */
  async getHeadToHead(playerId1: string, playerId2: string, clubId?: string): Promise<HeadToHeadRecord> {
    // Verify players exist
    const [player1, player2] = await Promise.all([
      prisma.member.findUnique({ where: { id: playerId1 }, include: { user: true } }),
      prisma.member.findUnique({ where: { id: playerId2 }, include: { user: true } }),
    ]);

    if (!player1 || !player2) {
      throw new NotFoundError('One or both players not found');
    }

    // If clubId provided, verify both players belong to club
    if (clubId) {
      if (player1.clubId !== clubId || player2.clubId !== clubId) {
        throw new NotFoundError('One or both players not in this club');
      }
    }

    // Get all head-to-head matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: playerId1, player2Id: playerId2 },
          { player1Id: playerId2, player2Id: playerId1 },
        ],
      },
      select: {
        id: true,
        score1: true,
        score2: true,
        player1Id: true,
        player2Id: true,
        matchType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate win counts
    let player1Wins = 0;
    let player2Wins = 0;

    matches.forEach((match) => {
      if (match.player1Id === playerId1) {
        if (match.score1 > match.score2) {
          player1Wins++;
        } else {
          player2Wins++;
        }
      } else {
        if (match.score2 > match.score1) {
          player1Wins++;
        } else {
          player2Wins++;
        }
      }
    });

    // Format matches for response
    const formattedMatches = matches.map((match) => ({
      id: match.id,
      player1Score: match.player1Id === playerId1 ? match.score1 : match.score2,
      player2Score: match.player1Id === playerId1 ? match.score2 : match.score1,
      matchType: match.matchType,
      date: match.createdAt.toISOString(),
    }));

    return {
      player1Name: player1.user.name,
      player2Name: player2.user.name,
      player1Wins,
      player2Wins,
      matches: formattedMatches,
    };
  }

  /**
   * Get performance trends over time for a player
   */
  async getPerformanceTrends(playerId: string, clubId?: string, daysBack: number = 30): Promise<PerformanceTrend[]> {
    const player = await prisma.member.findUnique({
      where: { id: playerId },
      include: { user: true },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    if (clubId && player.clubId !== clubId) {
      throw new NotFoundError('Player not in this club');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: playerId },
          { player2Id: playerId },
        ],
        createdAt: { gte: startDate },
      },
      select: {
        score1: true,
        score2: true,
        player1Id: true,
        player2Id: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group matches by date and calculate cumulative stats
    const dateMap = new Map<string, { wins: number; total: number }>();

    matches.forEach((match) => {
      const dateKey = match.createdAt.toISOString().split('T')[0];
      const isPlayer1 = match.player1Id === playerId;
      const playerScore = isPlayer1 ? match.score1 : match.score2;
      const opponentScore = isPlayer1 ? match.score2 : match.score1;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { wins: 0, total: 0 });
      }

      const dayStats = dateMap.get(dateKey)!;
      dayStats.total++;
      if (playerScore > opponentScore) {
        dayStats.wins++;
      }
    });

    // Convert to array with cumulative stats
    const trends: PerformanceTrend[] = [];
    let cumulativeWins = 0;
    let cumulativeMatches = 0;

    const sortedDates = Array.from(dateMap.keys()).sort();
    for (const date of sortedDates) {
      const dayStats = dateMap.get(date)!;
      cumulativeWins += dayStats.wins;
      cumulativeMatches += dayStats.total;

      trends.push({
        date,
        winRate: cumulativeMatches > 0 ? (cumulativeWins / cumulativeMatches) * 100 : 0,
        totalMatches: cumulativeMatches,
        wins: cumulativeWins,
      });
    }

    return trends;
  }

  /**
   * Get top performers for a club
   */
  async getTopPerformers(clubId: string, limit: number = 10): Promise<PlayerStats[]> {
    const leaderboard = await this.getLeaderboard(clubId, limit);
    return leaderboard;
  }

  /**
   * Get stats summary for a club
   */
  async getClubStatsSummary(clubId: string) {
    const members = await prisma.member.findMany({
      where: { clubId },
    });

    const matches = await prisma.match.findMany({
      where: {
        practice: { clubId },
      },
      select: {
        score1: true,
        score2: true,
        createdAt: true,
      },
    });

    const avgPointsPerMatch = matches.length > 0
      ? (matches.reduce((sum, m) => sum + m.score1 + m.score2, 0) / matches.length).toFixed(1)
      : 0;

    return {
      totalMembers: members.length,
      totalMatches: matches.length,
      activeMembers: members.filter((m) => m.status === 'ACTIVE').length,
      averagePointsPerMatch: avgPointsPerMatch,
    };
  }
}

export default new StatsService();
