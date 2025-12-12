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
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
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
          practice: {
            select: { id: true },
          },
        },
      });

      if (!tournament || !tournament.club) return null;

      // Get all members from the tournament's club with user data for names
      return tournament.club.members.map((member: any) => ({
        ...member,
        name: member.user.username,
      }));
    } catch (error) {
      console.error('Error in getTournamentParticipants:', error);
      return null;
    }
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
    try {
      return await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          club: true,
          practice: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              court: true,
              isTournament: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error in getTournament:', error);
      // Fallback: return tournament without practice data
      return await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          club: true,
        },
      });
    }
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
    try {
      const tournaments = await prisma.tournament.findMany({
        where: { clubId },
        include: {
          practice: {
            select: {
              id: true,
              date: true,
              startTime: true,
              endTime: true,
              court: true,
              isTournament: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Filter out tournaments with missing practices to avoid errors
      return tournaments.filter(t => t.practice !== null);
    } catch (error) {
      console.error('Error in getClubTournaments:', error);
      // Fallback: return tournaments without practice data
      return await prisma.tournament.findMany({
        where: { clubId },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  /**
   * Add participant to tournament
   */
  async addParticipant(tournamentId: string, memberId: string, seedRank?: number) {
    try {
      console.log('Service: Adding participant', { tournamentId, memberId, seedRank });
      return await prisma.tournamentParticipant.create({
        data: {
          tournamentId,
          memberId,
          seedRank: seedRank || 999, // Default to bottom seed
        },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Service: Error adding participant:', error);
      if (error instanceof Error && error.message.includes('tournament_participants')) {
        console.warn('Tournament tables not yet created, skipping participant creation');
        return null;
      }
      throw error;
    }
  }

  /**
   * Remove participant from tournament
   */
  async removeParticipant(tournamentId: string, memberId: string) {
    try {
      return await prisma.tournamentParticipant.deleteMany({
        where: {
          tournamentId,
          memberId,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('tournament_participants')) {
        console.warn('Tournament tables not yet created, skipping participant removal');
        return { count: 0 };
      }
      throw error;
    }
  }

  /**
   * Get all tournament participants with member details
   */
  async getParticipantsWithDetails(tournamentId: string) {
    try {
      const participants = await prisma.tournamentParticipant.findMany({
        where: { tournamentId },
        include: {
          member: {
            include: {
              user: true,
            },
          },
        },
        orderBy: { seedRank: 'asc' },
      });

      return participants.map((p) => ({
        participantId: p.id,
        memberId: p.memberId,
        name: p.member.user.username,
        seedRank: p.seedRank,
        joinedAt: p.joinedAt,
      }));
    } catch (error) {
      if (error instanceof Error && error.message.includes('tournament_participants')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Create all matches for a tournament (initialize bracket)
   */
  async initializeMatches(tournamentId: string) {
    try {
      console.log('Service: Initializing matches for tournament:', tournamentId);
      
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) throw new Error('Tournament not found');

      const participants = await this.getParticipantsWithDetails(tournamentId);
      console.log('Service: Found', participants.length, 'participants');

      if (participants.length < 2) {
        throw new Error('Need at least 2 participants to create matches');
      }

      const playerIds = participants.map((p) => p.memberId);
      const playerNames = new Map(participants.map((p) => [p.memberId, p.name]));

      let matches: any[] = [];

      if (tournament.format === 'KNOCKOUT') {
        console.log('Service: Creating knockout bracket');
        // Generate knockout bracket
        const bracket = this.generateKnockoutBracket(playerIds, playerNames);

        // Create matches in database for each bracket node
        for (let roundNum = 0; roundNum < bracket.rounds.length; roundNum++) {
          const round = bracket.rounds[roundNum];
          for (let position = 0; position < round.length; position++) {
            const node = round[position];
            const match = await prisma.tournamentMatch.create({
              data: {
                tournamentId,
                round: roundNum,
                position,
                player1Id: node.player1Id || null,
                player2Id: node.player2Id || null,
                status: 'SCHEDULED',
              },
            });
            matches.push(match);
          }
        }
      } else {
        console.log('Service: Creating round-robin matches');
        // Generate round-robin matches
        for (let i = 0; i < playerIds.length; i++) {
          for (let j = i + 1; j < playerIds.length; j++) {
            const match = await prisma.tournamentMatch.create({
              data: {
                tournamentId,
                round: 0,
                position: i * playerIds.length + j,
                player1Id: playerIds[i],
                player2Id: playerIds[j],
                status: 'SCHEDULED',
              },
            });
            matches.push(match);
          }
        }
      }

      console.log('Service: Successfully created', matches.length, 'matches');
      return matches;
    } catch (error) {
      console.error('Service: Error initializing matches:', error);
      if (error instanceof Error && error.message.includes('tournament_matches')) {
        console.warn('Tournament tables not yet created, skipping match initialization');
        return [];
      }
      throw error;
    }
  }

  /**
   * Record match result and advance winners
   */
  async recordMatchResult(
    tournamentId: string,
    matchId: string,
    player1Score: number,
    player2Score: number,
    scheduledDate?: string,
    court?: string
  ) {
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
      });

      if (!tournament) throw new Error('Tournament not found');

      const match = await prisma.tournamentMatch.findUnique({
        where: { id: matchId },
      });

      if (!match) throw new Error('Match not found');

      const winnerId = player1Score > player2Score ? match.player1Id : match.player2Id;

      // Update match result
      const updatedMatch = await prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          winnerId,
          player1Score,
          player2Score,
          status: 'COMPLETED',
          scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
          court,
        },
      });

      // Update standings for player1
      if (match.player1Id) {
        await prisma.tournamentStanding.upsert({
          where: {
            tournamentId_memberId: {
              tournamentId,
              memberId: match.player1Id,
            },
          },
          update: {
            matchesPlayed: { increment: 1 },
            wins: { increment: player1Score > player2Score ? 1 : 0 },
            losses: { increment: player1Score > player2Score ? 0 : 1 },
            pointsFor: { increment: player1Score },
            pointsAgainst: { increment: player2Score },
          },
          create: {
            tournamentId,
            memberId: match.player1Id,
            matchesPlayed: 1,
            wins: player1Score > player2Score ? 1 : 0,
            losses: player1Score > player2Score ? 0 : 1,
            pointsFor: player1Score,
            pointsAgainst: player2Score,
            ranking: 0,
          },
        });
      }

      // Update standings for player2
      if (match.player2Id) {
        await prisma.tournamentStanding.upsert({
          where: {
            tournamentId_memberId: {
              tournamentId,
              memberId: match.player2Id,
            },
          },
          update: {
            matchesPlayed: { increment: 1 },
            wins: { increment: player2Score > player1Score ? 1 : 0 },
            losses: { increment: player2Score > player1Score ? 0 : 1 },
            pointsFor: { increment: player2Score },
            pointsAgainst: { increment: player1Score },
          },
          create: {
            tournamentId,
            memberId: match.player2Id,
            matchesPlayed: 1,
            wins: player2Score > player1Score ? 1 : 0,
            losses: player2Score > player1Score ? 0 : 1,
            pointsFor: player2Score,
            pointsAgainst: player1Score,
            ranking: 0,
          },
        });
      }

      // For knockout, advance winner to next round
      if (tournament.format === 'KNOCKOUT' && match.round < 10) {
        const nextRoundMatches = await prisma.tournamentMatch.findMany({
          where: {
            tournamentId,
            round: match.round + 1,
          },
          orderBy: { position: 'asc' },
        });

        if (nextRoundMatches.length > 0) {
          const nextMatchIndex = Math.floor(match.position / 2);
          if (nextMatchIndex < nextRoundMatches.length) {
            const nextMatch = nextRoundMatches[nextMatchIndex];
            if (match.position % 2 === 0) {
              // Advance to player1 slot
              await prisma.tournamentMatch.update({
                where: { id: nextMatch.id },
                data: { player1Id: winnerId },
              });
            } else {
              // Advance to player2 slot
              await prisma.tournamentMatch.update({
                where: { id: nextMatch.id },
                data: { player2Id: winnerId },
              });
            }
          }
        }
      }

      // Return enriched match with player names and formatted scores
      let player1Name = null;
      let player2Name = null;
      let winnerName = null;

      if (updatedMatch.player1Id) {
        const member = await prisma.member.findUnique({
          where: { id: updatedMatch.player1Id },
          include: { user: true },
        });
        player1Name = member?.user?.username || null;
      }

      if (updatedMatch.player2Id) {
        const member = await prisma.member.findUnique({
          where: { id: updatedMatch.player2Id },
          include: { user: true },
        });
        player2Name = member?.user?.username || null;
      }

      if (updatedMatch.winnerId) {
        const member = await prisma.member.findUnique({
          where: { id: updatedMatch.winnerId },
          include: { user: true },
        });
        winnerName = member?.user?.username || null;
      }

      return {
        ...updatedMatch,
        player1Name,
        player2Name,
        winnerName,
        scores: updatedMatch.player1Score && updatedMatch.player2Score ? `${updatedMatch.player1Score}-${updatedMatch.player2Score}` : null,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('tournament')) {
        console.warn('Tournament tables not yet created or match not found');
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all matches for a tournament with player details
   */
  async getTournamentMatches(tournamentId: string) {
    try {
      const matches = await prisma.tournamentMatch.findMany({
        where: { tournamentId },
        orderBy: [{ round: 'asc' }, { position: 'asc' }],
      });

      // Enrich with player names
      const enriched = await Promise.all(
        matches.map(async (match) => {
          let player1Name = null;
          let player2Name = null;
          let winnerName = null;

          if (match.player1Id) {
            const member = await prisma.member.findUnique({
              where: { id: match.player1Id },
              include: { user: true },
            });
            player1Name = member?.user?.username || null;
          }

          if (match.player2Id) {
            const member = await prisma.member.findUnique({
              where: { id: match.player2Id },
              include: { user: true },
            });
            player2Name = member?.user?.username || null;
          }

          if (match.winnerId) {
            const member = await prisma.member.findUnique({
              where: { id: match.winnerId },
              include: { user: true },
            });
            winnerName = member?.user?.username || null;
          }

          return {
            ...match,
            player1Name,
            player2Name,
            winnerName,
            scores: match.player1Score && match.player2Score ? `${match.player1Score}-${match.player2Score}` : null,
          };
        })
      );

      return enriched;
    } catch (error) {
      // If tournament_matches table doesn't exist yet, return empty array
      if (error instanceof Error && error.message.includes('tournament_matches')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get tournament standings sorted by ranking
   */
  async getTournamentStandings(tournamentId: string) {
    try {
      console.log('Service: Getting standings for tournament:', tournamentId);
      const standings = await prisma.tournamentStanding.findMany({
        where: { tournamentId },
        orderBy: [{ wins: 'desc' }, { pointsFor: 'desc' }],
      });

      console.log('Service: Found', standings.length, 'standing records');

      // Enrich with member/user details
      const enriched = await Promise.all(
        standings.map(async (standing) => {
          const member = await prisma.member.findUnique({
            where: { id: standing.memberId },
            include: { user: true },
          });

          return {
            ...standing,
            memberName: member?.user?.username || 'Unknown',
          };
        })
      );

      // Calculate ranking
      const result = enriched.map((standing, index) => ({
        ...standing,
        ranking: index + 1,
      }));

      console.log('Service: Returning', result.length, 'enriched standings');
      return result;
    } catch (error) {
      // If tournament_standings table doesn't exist yet, return empty array
      if (error instanceof Error && error.message.includes('tournament_standings')) {
        console.warn('Service: tournament_standings table not found, returning empty');
        return [];
      }
      console.error('Service: Error getting standings:', error);
      throw error;
    }
  }

  /**
   * Update match schedule (date, time, court)
   */
  async scheduleMatch(
    matchId: string,
    scheduledDate: string,
    court?: string
  ) {
    return await prisma.tournamentMatch.update({
      where: { id: matchId },
      data: {
        scheduledDate: new Date(scheduledDate),
        court,
      },
    });
  }

  /**
   * Get tournament stats by player
   */
  async getPlayerStats(tournamentId: string, memberId: string) {
    const standing = await prisma.tournamentStanding.findUnique({
      where: {
        tournamentId_memberId: {
          tournamentId,
          memberId,
        },
      },
    });

    if (!standing) return null;

    // Get all matches for this player
    const playerMatches = await prisma.tournamentMatch.findMany({
      where: {
        tournamentId,
        OR: [
          { player1Id: memberId },
          { player2Id: memberId },
        ],
      },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    });

    // Enrich match details
    const enrichedMatches = await Promise.all(
      playerMatches.map(async (match) => {
        let opponentId = null;
        let opponentName = null;
        const isPlayer1 = match.player1Id === memberId;

        if (isPlayer1 && match.player2Id) {
          opponentId = match.player2Id;
        } else if (!isPlayer1 && match.player1Id) {
          opponentId = match.player1Id;
        }

        if (opponentId) {
          const opponent = await prisma.member.findUnique({
            where: { id: opponentId },
            include: { user: true },
          });
          opponentName = opponent?.user?.username || 'Unknown';
        }

        const playerScore = isPlayer1 ? match.player1Score || 0 : match.player2Score || 0;
        const opponentScore = isPlayer1 ? match.player2Score || 0 : match.player1Score || 0;
        const won = match.winnerId === memberId;

        return {
          matchId: match.id,
          round: match.round,
          opponent: opponentName,
          opponentId,
          playerScore,
          opponentScore,
          won,
          status: match.status,
          scheduledDate: match.scheduledDate,
          court: match.court,
        };
      })
    );

    return {
      ...standing,
      matches: enrichedMatches,
      winRate: standing.matchesPlayed > 0 ? (standing.wins / standing.matchesPlayed * 100).toFixed(1) : '0',
    };
  }

  /**
   * Delete tournament and all related data
   */
  async deleteTournament(tournamentId: string) {
    // Delete all matches
    await prisma.tournamentMatch.deleteMany({
      where: { tournamentId },
    });

    // Delete all participants
    await prisma.tournamentParticipant.deleteMany({
      where: { tournamentId },
    });

    // Delete all standings
    await prisma.tournamentStanding.deleteMany({
      where: { tournamentId },
    });

    // Delete tournament
    return await prisma.tournament.delete({
      where: { id: tournamentId },
    });
  }
}

export default new TournamentService();
