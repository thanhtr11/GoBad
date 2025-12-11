import { PrismaClient, TournamentFormat } from '@prisma/client';

const prisma = new PrismaClient();

export interface BracketNode {
  id: string;
  player1Id?: string;
  player2Id?: string;
  player1Name?: string;
  player2Name?: string;
  winnerId?: string;
  winnerName?: string;
  round: number;
  position: number;
  score1?: number;
  score2?: number;
}

export interface Bracket {
  rounds: BracketNode[][];
}

export interface RoundRobinMatch {
  player1Id: string;
  player2Id: string;
  score1: number;
  score2: number;
}

class TournamentService {
  /**
   * Generate knockout bracket for a tournament
   * Players are matched in first round, winners advance
   */
  generateKnockoutBracket(playerIds: string[], playerNames: Map<string, string>): Bracket {
    // Shuffle players for random matchups
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);

    // Pad to power of 2 (for balanced bracket)
    let paddedPlayers = [...shuffled];
    let targetSize = 1;
    while (targetSize < paddedPlayers.length) {
      targetSize *= 2;
    }
    while (paddedPlayers.length < targetSize) {
      paddedPlayers.push('');
    }

    // Create first round matches
    const rounds: BracketNode[][] = [];
    const firstRound: BracketNode[] = [];

    for (let i = 0; i < paddedPlayers.length; i += 2) {
      firstRound.push({
        id: `match-0-${i / 2}`,
        player1Id: paddedPlayers[i] || undefined,
        player2Id: paddedPlayers[i + 1] || undefined,
        player1Name: paddedPlayers[i] ? playerNames.get(paddedPlayers[i]) : undefined,
        player2Name: paddedPlayers[i + 1] ? playerNames.get(paddedPlayers[i + 1]) : undefined,
        round: 0,
        position: i / 2,
      });
    }

    rounds.push(firstRound);

    // Create subsequent rounds (placeholders)
    let currentRoundSize = firstRound.length / 2;
    let roundNum = 1;

    while (currentRoundSize > 0) {
      const nextRound: BracketNode[] = [];
      for (let i = 0; i < currentRoundSize; i++) {
        nextRound.push({
          id: `match-${roundNum}-${i}`,
          round: roundNum,
          position: i,
        });
      }
      rounds.push(nextRound);
      currentRoundSize = currentRoundSize / 2;
      roundNum++;
    }

    return { rounds };
  }

  /**
   * Generate round-robin matches for all players
   * Each player plays every other player once
   */
  generateRoundRobinMatches(playerIds: string[]): RoundRobinMatch[] {
    const matches: RoundRobinMatch[] = [];

    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        matches.push({
          player1Id: playerIds[i],
          player2Id: playerIds[j],
          score1: 0,
          score2: 0,
        });
      }
    }

    return matches;
  }

  /**
   * Calculate round-robin standings
   */
  calculateRoundRobinStandings(
    playerIds: string[],
    matches: Array<{ player1Id: string; player2Id: string; score1: number; score2: number }>,
    playerNames: Map<string, string>
  ) {
    const standings = new Map<
      string,
      { playerName: string; wins: number; losses: number; draws: number; points: number; matchesPlayed: number }
    >();

    // Initialize
    playerIds.forEach((id) => {
      standings.set(id, {
        playerName: playerNames.get(id) || 'Unknown',
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        matchesPlayed: 0,
      });
    });

    // Calculate results
    matches.forEach((match) => {
      const p1 = standings.get(match.player1Id);
      const p2 = standings.get(match.player2Id);

      if (p1 && p2) {
        p1.matchesPlayed += 1;
        p2.matchesPlayed += 1;

        if (match.score1 > match.score2) {
          p1.wins += 1;
          p2.losses += 1;
          p1.points += 3; // Win = 3 points
        } else if (match.score2 > match.score1) {
          p2.wins += 1;
          p1.losses += 1;
          p2.points += 3;
        } else {
          // Draw = 1 point each
          p1.draws += 1;
          p2.draws += 1;
          p1.points += 1;
          p2.points += 1;
        }
      }
    });

    // Sort by points, then by wins, then by draw count
    return Array.from(standings.entries())
      .map(([playerId, stats]) => ({
        playerId,
        ...stats,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.draws - a.draws;
      });
  }

  /**
   * Record match result in tournament bracket
   * Advance winner to next round if knockout
   */
  async recordBracketMatch(
    _tournamentId: string,
    matchId: string,
    player1Score: number,
    player2Score: number
  ) {
    const winnerId = player1Score > player2Score ? 'player1' : 'player2';
    const winnerScore = Math.max(player1Score, player2Score);
    const loserScore = Math.min(player1Score, player2Score);

    return {
      matchId,
      winner: winnerId,
      winnerScore,
      loserScore,
      score: `${player1Score}-${player2Score}`,
      status: 'completed',
    };
  }

  /**
   * Advance winner to next round in knockout tournament
   * Updates bracket with winner info and propagates to next round
   */
  advanceWinnerToNextRound(
    rounds: BracketNode[][],
    roundIndex: number,
    position: number,
    winnerId: string,
    winnerName: string
  ): BracketNode[][] {
    const updatedRounds = JSON.parse(JSON.stringify(rounds)); // Deep copy

    // Mark winner in current match
    updatedRounds[roundIndex][position].winnerId = winnerId;
    updatedRounds[roundIndex][position].winnerName = winnerName;

    // Advance to next round if not finals
    if (roundIndex < updatedRounds.length - 1) {
      const nextRound = updatedRounds[roundIndex + 1];
      const nextPosition = Math.floor(position / 2);

      if (position % 2 === 0) {
        // Winner goes to player1 slot of next match
        nextRound[nextPosition].player1Id = winnerId;
        nextRound[nextPosition].player1Name = winnerName;
      } else {
        // Winner goes to player2 slot of next match
        nextRound[nextPosition].player2Id = winnerId;
        nextRound[nextPosition].player2Name = winnerName;
      }
    }

    return updatedRounds;
  }

  /**
   * Get tournament participants
   */
  async getTournamentParticipants(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        practice: {
          include: {
            club: {
              include: {
                members: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!tournament) return null;

    // Get all members from the practice's club with user data for names
    return tournament.practice.club.members.map((member: any) => ({
      ...member,
      name: member.user.username,
    }));
  }

  /**
   * Create new tournament
   */
  async createTournament(
    clubId: string,
    practiceId: string,
    name: string,
    format: TournamentFormat
  ) {
    const tournament = await prisma.tournament.create({
      data: {
        clubId,
        practiceId,
        name,
        format,
        status: 'UPCOMING',
      },
    });

    return tournament;
  }

  /**
   * Get tournament by ID
   */
  async getTournament(tournamentId: string) {
    return await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        club: true,
        practice: true,
      },
    });
  }

  /**
   * Update tournament status
   */
  async updateTournamentStatus(
    tournamentId: string,
    status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED'
  ) {
    return await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status },
    });
  }

  /**
   * List tournaments for a club
   */
  async getClubTournaments(clubId: string) {
    return await prisma.tournament.findMany({
      where: { clubId },
      include: {
        practice: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new TournamentService();
