import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class AttendanceService {
  /**
   * Check in a member to a practice
   */
  async checkInMember(memberId: string, practiceId: string) {
    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        practiceId_memberId: {
          practiceId,
          memberId,
        },
      },
    });

    if (existingAttendance) {
      throw new Error('Member already checked in for this practice');
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        memberId,
        practiceId,
        checkInAt: new Date(),
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        practice: true,
      },
    });

    return attendance;
  }

  /**
   * Self check-in for current user
   */
  async selfCheckIn(userId: string, practiceId: string) {
    // Find the member record for this user and practice's club
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) {
      throw new Error('Practice not found');
    }

    const member = await prisma.member.findFirst({
      where: {
        userId,
        clubId: practice.clubId,
      },
    });

    if (!member) {
      throw new Error('You are not a member of this club');
    }

    return this.checkInMember(member.id, practiceId);
  }

  /**
   * Get attendance records for a practice
   */
  async getPracticeAttendance(practiceId: string) {
    const attendance = await prisma.attendance.findMany({
      where: { practiceId },
      include: {
        member: {
          include: {
            user: true,
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
   * Get attendance records for a user
   */
  async getUserAttendance(userId: string) {
    const member = await prisma.member.findFirst({
      where: { userId },
    });

    if (!member) {
      return [];
    }

    const attendance = await prisma.attendance.findMany({
      where: { memberId: member.id },
      include: {
        practice: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        checkInAt: 'desc',
      },
    });

    return attendance;
  }

  /**
   * Get attendance records for a member
   */
  async getMemberAttendance(
    memberId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = {
      memberId,
    };

    if (startDate || endDate) {
      where.practice = {
        date: {},
      };
      if (startDate) where.practice.date.gte = startDate;
      if (endDate) where.practice.date.lte = endDate;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        practice: {
          include: {
            club: true,
          },
        },
      },
      orderBy: {
        checkInAt: 'desc',
      },
    });

    return attendance;
  }

  /**
   * Get attendance statistics for a member
   */
  async getMemberAttendanceStats(memberId: string, clubId: string) {
    const attendance = await prisma.attendance.findMany({
      where: {
        memberId,
        practice: {
          clubId,
        },
      },
    });

    const practices = await prisma.practice.count({
      where: {
        clubId,
        date: {
          lte: new Date(),
        },
      },
    });

    return {
      totalAttended: attendance.length,
      totalPractices: practices,
      attendanceRate: practices > 0 ? (attendance.length / practices) * 100 : 0,
    };
  }

  /**
   * Get daily attendance summary
   */
  async getDailyAttendance(practiceId: string) {
    const attendance = await prisma.attendance.findMany({
      where: { practiceId },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });

    return {
      total: attendance.length,
      members: attendance,
    };
  }

  /**
   * Get club attendance history
   */
  async getClubAttendanceHistory(clubId: string) {
    const attendance = await prisma.attendance.findMany({
      where: {
        practice: {
          clubId,
        },
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        practice: true,
      },
      orderBy: {
        checkInAt: 'desc',
      },
      take: 100,
    });

    return attendance;
  }

  /**
   * Get attendance report
   */
  async getAttendanceReport(clubId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      practice: {
        clubId,
      },
    };

    if (startDate || endDate) {
      where.practice.date = {};
      if (startDate) where.practice.date.gte = startDate;
      if (endDate) where.practice.date.lte = endDate;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        member: {
          include: {
            user: true,
          },
        },
        practice: true,
      },
      orderBy: {
        checkInAt: 'desc',
      },
    });

    return attendance;
  }

  /**
   * Export attendance to CSV
   */
  async exportAttendanceToCSV(clubId: string) {
    const attendance = await prisma.attendance.findMany({
      where: {
        practice: {
          clubId,
        },
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
        practice: true,
      },
      orderBy: {
        checkInAt: 'desc',
      },
    });

    let csv = 'Member Name,Practice Date,Check-in Time\n';

    attendance.forEach((record) => {
      const name = record.member.user.name;
      const date = new Date(record.practice.date).toLocaleDateString();
      const time = new Date(record.checkInAt).toLocaleTimeString();
      csv += `${name},${date},${time}\n`;
    });

    return csv;
  }

  /**
   * Get weekly statistics
   */
  async getWeeklyStats(clubId: string) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findMany({
      where: {
        practice: {
          clubId,
          date: {
            gte: startOfWeek,
          },
        },
      },
      include: {
        practice: true,
      },
    });

    const stats = {
      totalCheckIns: attendance.length,
      practicesThisWeek: new Set(attendance.map((a) => a.practiceId)).size,
      averagePerPractice: 0,
    };

    if (stats.practicesThisWeek > 0) {
      stats.averagePerPractice = stats.totalCheckIns / stats.practicesThisWeek;
    }

    return stats;
  }

  /**
   * Remove check-in (mark as absent)
   */
  async removeCheckIn(attendanceId: string) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });

    if (!attendance) {
      throw new Error('Attendance record not found');
    }

    return await prisma.attendance.delete({
      where: { id: attendanceId },
    });
  }

  /**
   * Check in a guest for a practice
   */
  async checkInGuest(practiceId: string, guestId: string) {
    // Verify practice exists
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) {
      throw new Error('Practice not found');
    }

    // Verify guest member exists
    const guest = await prisma.member.findUnique({
      where: { id: guestId },
    });

    if (!guest) {
      throw new Error('Guest not found');
    }

    // Check if already checked in
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        practiceId_memberId: {
          practiceId,
          memberId: guestId,
        },
      },
    });

    if (existingAttendance) {
      throw new Error('Guest already checked in for this practice');
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        memberId: guestId,
        practiceId,
        checkInAt: new Date(),
      },
      include: {
        member: { include: { user: true } },
        practice: true,
      },
    });

    return attendance;
  }
}

export default new AttendanceService();
