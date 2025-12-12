import { PrismaClient } from '@prisma/client';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class ClubService {
  /**
   * Create a new club
   */
  async createClub(data: {
    name: string;
    location?: string;
    contactName?: string;
    email?: string;
  }) {
    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Club name is required');
    }

    try {
      const club = await prisma.club.create({
        data: {
          name: data.name.trim(),
          location: data.location?.trim(),
          contactName: data.contactName?.trim(),
          email: data.email?.trim(),
        },
      });

      return club;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ValidationError('A club with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Get club by ID
   */
  async getClubById(clubId: string) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        _count: {
          select: {
            members: true,
            practices: true,
            finances: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found`);
    }

    return club;
  }

  /**
   * Get all clubs for a user (via their member records)
   */
  async getClubsByUserId(userId: string) {
    const member = await prisma.member.findFirst({
      where: { userId },
    });

    if (!member) {
      return [];
    }

    // Get all clubs where user has a member record
    const clubs = await prisma.club.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            practices: true,
            finances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clubs;
  }

  /**
   * Get all clubs (admin only)
   */
  async getAllClubs() {
    const clubs = await prisma.club.findMany({
      include: {
        _count: {
          select: {
            members: true,
            practices: true,
            finances: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clubs;
  }

  /**
   * Update a club
   */
  async updateClub(
    clubId: string,
    data: {
      name?: string;
      location?: string;
      contactName?: string;
      email?: string;
    }
  ) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found`);
    }

    try {
      const updatedClub = await prisma.club.update({
        where: { id: clubId },
        data: {
          ...(data.name && { name: data.name.trim() }),
          ...(data.location !== undefined && { location: data.location?.trim() }),
          ...(data.contactName !== undefined && { contactName: data.contactName?.trim() }),
          ...(data.email !== undefined && { email: data.email?.trim() }),
        },
      });

      return updatedClub;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ValidationError('A club with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a club (and all related data via cascade)
   */
  async deleteClub(clubId: string) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found`);
    }

    try {
      await prisma.club.delete({
        where: { id: clubId },
      });

      return { message: `Club '${club.name}' and all related data has been deleted` };
    } catch (error: any) {
      throw new ValidationError('Failed to delete club');
    }
  }

  /**
   * Get club members
   */
  async getClubMembers(clubId: string) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found`);
    }

    const members = await prisma.member.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return members;
  }

  /**
   * Get club statistics
   */
  async getClubStats(clubId: string) {
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        _count: {
          select: {
            members: true,
            practices: true,
            finances: true,
            tournaments: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found`);
    }

    // Calculate total finances
    const finances = await prisma.finance.findMany({
      where: { clubId },
    });

    const totalIncome = finances
      .filter((f) => f.type === 'INCOME')
      .reduce((sum, f) => sum + f.amount.toNumber(), 0);

    const totalExpense = finances
      .filter((f) => f.type === 'EXPENSE')
      .reduce((sum, f) => sum + f.amount.toNumber(), 0);

    const balance = totalIncome - totalExpense;

    return {
      clubId,
      clubName: club.name,
      memberCount: club._count.members,
      practiceCount: club._count.practices,
      transactionCount: club._count.finances,
      tournamentCount: club._count.tournaments,
      totalIncome,
      totalExpense,
      balance,
    };
  }

  /**
   * Check if user has access to club
   */
  async hasClubAccess(userId: string, clubId: string): Promise<boolean> {
    const member = await prisma.member.findFirst({
      where: {
        userId,
        clubId,
      },
    });

    return !!member;
  }

  /**
   * Get user clubs (convenience method for auth context)
   */
  async getUserClubs(userId: string) {
    const clubs = await prisma.club.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      select: {
        id: true,
        name: true,
        location: true,
      },
      orderBy: { name: 'asc' },
    });

    return clubs;
  }

  /**
   * Assign a manager to a club
   */
  async assignManager(clubId: string, userId: string) {
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new Error('Club not found');
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if manager is already assigned
    const existingManager = await prisma.clubManager.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (existingManager) {
      throw new Error('User is already a manager of this club');
    }

    // Assign manager
    const manager = await prisma.clubManager.create({
      data: {
        userId,
        clubId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return manager;
  }

  /**
   * Get managers of a club
   */
  async getClubManagers(clubId: string) {
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new Error('Club not found');
    }

    const managers = await prisma.clubManager.findMany({
      where: { clubId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return managers;
  }

  /**
   * Remove a manager from a club
   */
  async removeManager(clubId: string, userId: string) {
    // Verify manager exists
    const manager = await prisma.clubManager.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (!manager) {
      throw new Error('Manager not found for this club');
    }

    await prisma.clubManager.delete({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });
  }
}

export const clubService = new ClubService();
