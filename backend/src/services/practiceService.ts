import { PrismaClient } from '@prisma/client';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

interface CreatePracticeData {
  clubId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  court: string;
  expectedParticipants?: number;
  isTournament?: boolean;
}

interface UpdatePracticeData {
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  court?: string;
  expectedParticipants?: number;
  isTournament?: boolean;
}

class PracticeService {
  /**
   * Create a new practice session
   */
  async createPractice(data: CreatePracticeData) {
    const { clubId, date, startTime, endTime, court, expectedParticipants, isTournament } = data;

    // Validate club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      throw new NotFoundError('Club not found');
    }

    // Validate time range
    if (startTime >= endTime) {
      throw new ValidationError('Start time must be before end time');
    }

    // Check for scheduling conflicts (same court, overlapping times)
    const conflicts = await this.checkScheduleConflicts(clubId, date, startTime, endTime, court);
    if (conflicts.length > 0) {
      throw new ValidationError(`Court ${court} is already booked during this time`);
    }

    // Create practice
    const practice = await prisma.practice.create({
      data: {
        clubId,
        date,
        startTime,
        endTime,
        court,
        expectedParticipants: expectedParticipants || 0,
        isTournament: isTournament || false,
      },
      include: {
        club: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            attendance: true,
            matches: true,
          },
        },
      },
    });

    return practice;
  }

  /**
   * Get practices with optional filters
   */
  async getPractices(clubId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (clubId) {
      where.clubId = clubId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const practices = await prisma.practice.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            attendance: true,
            matches: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return practices;
  }

  /**
   * Get practice by ID
   */
  async getPracticeById(id: string) {
    const practice = await prisma.practice.findUnique({
      where: { id },
      include: {
        club: {
          select: { id: true, name: true },
        },
        attendance: {
          include: {
            member: {
              select: { 
                id: true, 
                user: {
                  select: { id: true, name: true }
                }
              },
            },
          },
        },
        matches: {
          include: {
            player1: {
              select: { 
                id: true, 
                user: {
                  select: { name: true }
                }
              },
            },
            player2: {
              select: { 
                id: true, 
                user: {
                  select: { name: true }
                }
              },
            },
          },
        },
        _count: {
          select: {
            attendance: true,
            matches: true,
          },
        },
      },
    });

    if (!practice) {
      throw new NotFoundError(`Practice with ID ${id} not found`);
    }

    return practice;
  }

  /**
   * Update practice
   */
  async updatePractice(id: string, data: UpdatePracticeData) {
    const practice = await prisma.practice.findUnique({
      where: { id },
    });

    if (!practice) {
      throw new NotFoundError(`Practice with ID ${id} not found`);
    }

    // If updating time or court, check for conflicts
    if (data.startTime || data.endTime || data.court || data.date) {
      const date = data.date || practice.date;
      const startTime = data.startTime || practice.startTime;
      const endTime = data.endTime || practice.endTime;
      const court = data.court || practice.court;

      // Validate time range
      if (startTime >= endTime) {
        throw new ValidationError('Start time must be before end time');
      }

      const conflicts = await this.checkScheduleConflicts(
        practice.clubId,
        date,
        startTime,
        endTime,
        court,
        id // Exclude current practice from conflict check
      );

      if (conflicts.length > 0) {
        throw new ValidationError(`Court ${court} is already booked during this time`);
      }
    }

    const updated = await prisma.practice.update({
      where: { id },
      data,
      include: {
        club: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            attendance: true,
            matches: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete practice
   */
  async deletePractice(id: string) {
    const practice = await prisma.practice.findUnique({
      where: { id },
    });

    if (!practice) {
      throw new NotFoundError(`Practice with ID ${id} not found`);
    }

    await prisma.practice.delete({
      where: { id },
    });

    return { message: 'Practice deleted successfully' };
  }

  /**
   * Get club practices
   */
  async getClubPractices(clubId: string, startDate?: Date, endDate?: Date) {
    const where: any = { clubId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = startDate;
      }
      if (endDate) {
        where.date.lte = endDate;
      }
    }

    const practices = await prisma.practice.findMany({
      where,
      include: {
        club: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            attendance: true,
            matches: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return practices;
  }

  /**
   * Get practice attendance
   */
  async getPracticeAttendance(practiceId: string) {
    const attendance = await prisma.attendance.findMany({
      where: { practiceId },
      include: {
        member: {
          select: {
            id: true,
            type: true,
            user: {
              select: {
                name: true,
                email: true,
                skillLevel: true,
              }
            }
          },
        },
      },
      orderBy: {
        checkInAt: 'asc',
      },
    });

    return attendance;
  }

  /**
   * Check for scheduling conflicts
   */
  private async checkScheduleConflicts(
    clubId: string,
    date: Date,
    startTime: Date,
    endTime: Date,
    court: string,
    excludePracticeId?: string
  ) {
    // Find practices on the same date and court
    const conflicts = await prisma.practice.findMany({
      where: {
        clubId,
        court,
        date,
        id: excludePracticeId ? { not: excludePracticeId } : undefined,
        OR: [
          // New practice starts during existing practice
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          // New practice ends during existing practice
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          // New practice completely contains existing practice
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return conflicts;
  }
}

export const practiceService = new PracticeService();
