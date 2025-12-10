import { PrismaClient, MatchType } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateMatchData {
  practiceId: string;
  player1Id: string;
  player2Id: string;
  player3Id?: string;
  player4Id?: string;
  matchType: MatchType;
  score1: number;
  score2: number;
  court: string;
  notes?: string;
}

interface UpdateMatchData {
  score1?: number;
  score2?: number;
  notes?: string;
}

class MatchService {
  /**
   * Create a new match record
   */
  async createMatch(data: CreateMatchData) {
    const match = await prisma.match.create({
      data: {
        practiceId: data.practiceId,
        player1Id: data.player1Id,
        player2Id: data.player2Id,
        matchType: data.matchType,
        score1: data.score1,
        score2: data.score2,
        court: data.court,
        notes: data.notes,
      },
      include: {
        practice: {
          include: {
            club: true,
          },
        },
        player1: {
          include: {
            user: true,
          },
        },
        player2: {
          include: {
            user: true,
          },
        },
      },
    });

    return match;
  }

  /**
   * Get matches with filters
   */
  async getMatches(
    practiceId?: string,
    clubId?: string,
    playerId?: string,
    matchType?: MatchType
  ) {
    const where: any = {};

    if (clubId) {
      where.practice = { clubId };
    }

    if (practiceId) {
      where.practiceId = practiceId;
    }

    if (playerId) {
      where.OR = [
        { player1Id: playerId },
        { player2Id: playerId },
      ];
    }

    if (matchType) {
      where.matchType = matchType;
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        practice: {
          include: {
            club: true,
          },
        },
        player1: {
          include: {
            user: true,
          },
        },
        player2: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform to flatten user data
    return matches.map((match) => ({
      ...match,
      player1: match.player1 && match.player1.user ? {
        id: match.player1.id,
        name: match.player1.user.name,
        skillLevel: match.player1.user.skillLevel,
      } : null,
      player2: match.player2 && match.player2.user ? {
        id: match.player2.id,
        name: match.player2.user.name,
        skillLevel: match.player2.user.skillLevel,
      } : null,
    }));
  }

  /**
   * Get match by ID
   */
  async getMatchById(id: string) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        practice: {
          include: {
            club: true,
          },
        },
        player1: {
          include: {
            user: true,
          },
        },
        player2: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!match) {
      throw new Error('Match not found');
    }

    return match;
  }

  /**
   * Update match
   */
  async updateMatch(id: string, data: UpdateMatchData) {
    const match = await prisma.match.update({
      where: { id },
      data,
      include: {
        practice: {
          include: {
            club: true,
          },
        },
        player1: {
          include: {
            user: true,
          },
        },
        player2: {
          include: {
            user: true,
          },
        },
      },
    });

    return match;
  }

  /**
   * Delete match
   */
  async deleteMatch(id: string) {
    await prisma.match.delete({
      where: { id },
    });

    return { message: 'Match deleted successfully' };
  }

  /**
   * Get matches for a practice
   */
  async getPracticeMatches(practiceId: string) {
    const matches = await prisma.match.findMany({
      where: { practiceId },
      include: {
        player1: {
          include: {
            user: true,
          },
        },
        player2: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return matches;
  }

  /**
   * Get player statistics
   */
  async getPlayerStats(playerId: string) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: playerId },
          { player2Id: playerId },
        ],
      },
    });

    const stats = {
      totalMatches: matches.length,
      wins: 0,
      losses: 0,
      winRate: 0,
      byType: {
        SINGLES: { played: 0, won: 0 },
        DOUBLES: { played: 0, won: 0 },
      },
    };

    matches.forEach((match) => {
      const isPlayer1 = match.player1Id === playerId;
      const won = (isPlayer1 && match.score1 > match.score2) || 
                  (!isPlayer1 && match.score1 < match.score2);

      if (won) {
        stats.wins++;
      } else {
        stats.losses++;
      }

      // Track by match type
      if (match.matchType === 'SINGLES' || match.matchType === 'DOUBLES') {
        const typeKey = match.matchType as keyof typeof stats.byType;
        stats.byType[typeKey].played++;
        if (won) {
          stats.byType[typeKey].won++;
        }
      }
    });

    if (stats.totalMatches > 0) {
      stats.winRate = (stats.wins / stats.totalMatches) * 100;
    }

    return stats;
  }
}

export const matchService = new MatchService();
