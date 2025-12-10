import { PrismaClient, SkillLevel, MemberStatus, MemberType, MembershipTier } from '@prisma/client';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export class MemberService {
  /**
   * Add a new member to a club
   */
  async addMember(data: {
    clubId: string;
    name: string;
    email?: string;
    phone?: string;
    skillLevel?: SkillLevel;
    membershipTier?: MembershipTier;
    type: MemberType;
    joinedAt?: string;
    username?: string;
    password?: string;
  }) {
    if (!data.clubId || !data.name || !data.type) {
      throw new ValidationError('Club ID, name, and type are required');
    }

    // Verify club exists
    const club = await prisma.club.findUnique({ where: { id: data.clubId } });
    if (!club) {
      throw new NotFoundError(`Club with ID ${data.clubId} not found`);
    }

    try {
      let userId: string | undefined;

      // Create or update user account
      const userEmail = data.email || `guest-${Date.now()}@temp.local`;
      
      // Check if user with this email exists
      let user = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!user) {
        // Create new user account
        const hashedPassword = data.password 
          ? await bcrypt.hash(data.password, 10)
          : await bcrypt.hash(Math.random().toString(36), 10); // Random password for guests
        
        user = await prisma.user.create({
          data: {
            username: data.username || userEmail,
            password: hashedPassword,
            email: userEmail,
            name: data.name.trim(),
            phone: data.phone?.trim() || null,
            skillLevel: data.skillLevel || 'INTERMEDIATE',
            role: 'MEMBER',
          },
        });
      } else {
        // Update existing user with new info
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            name: data.name.trim(),
            phone: data.phone?.trim() || user.phone,
            skillLevel: data.skillLevel || user.skillLevel,
          },
        });
      }

      userId = user.id;

      const member = await prisma.member.create({
        data: {
          clubId: data.clubId,
          userId: userId,
          membershipTier: data.membershipTier || 'ADULT',
          type: data.type,
          status: 'ACTIVE',
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        },
        include: {
          user: {
            select: { id: true, username: true, email: true, role: true, name: true, skillLevel: true },
          },
        },
      });

      return member;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ValidationError('A member with this email already exists in this club');
      }
      throw error;
    }
  }

  /**
   * Get members with filters
   */
  async getMembers(
    clubId?: string,
    skillLevel?: SkillLevel,
    status?: MemberStatus,
    searchTerm?: string
  ) {
    // Build where clause - keep it simple
    const where: any = {};

    // Only filter by clubId and status - these are on the Member model
    if (clubId) where.clubId = clubId;
    if (status) where.status = status;

    // Query members without complex nested filters for now
    const members = await prisma.member.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, role: true, name: true, skillLevel: true },
        },
        club: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by skillLevel and searchTerm in JavaScript
    let filtered = members;
    
    if (skillLevel) {
      filtered = filtered.filter(m => m.user.skillLevel === skillLevel);
    }
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(m => 
        m.user.name.toLowerCase().includes(lowerSearch) ||
        m.user.email?.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }

  /**
   * Get single member by ID
   */
  async getMemberById(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, email: true, role: true },
        },
        club: {
          select: { id: true, name: true },
        },
      },
    });

    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found`);
    }

    return member;
  }

  /**
   * Update member
   */
  async updateMember(
    memberId: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      skillLevel?: SkillLevel;
      status?: MemberStatus;
      membershipTier?: MembershipTier;
    }
  ) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });

    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found`);
    }

    try {
      // Update user fields if provided
      if (data.name || data.email || data.phone || data.skillLevel) {
        await prisma.user.update({
          where: { id: member.userId },
          data: {
            ...(data.name && { name: data.name.trim() }),
            ...(data.email !== undefined && { email: data.email?.trim() }),
            ...(data.phone !== undefined && { phone: data.phone?.trim() }),
            ...(data.skillLevel && { skillLevel: data.skillLevel }),
          },
        });
      }

      // Update member-specific fields
      const updated = await prisma.member.update({
        where: { id: memberId },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.membershipTier && { membershipTier: data.membershipTier }),
        },
        include: {
          user: {
            select: { id: true, email: true, role: true, name: true, skillLevel: true },
          },
        },
      });

      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ValidationError('A member with this email already exists');
      }
      throw error;
    }
  }

  /**
   * Delete member
   */
  async deleteMember(memberId: string) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });

    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found`);
    }

    await prisma.member.delete({ where: { id: memberId } });

    return { message: `Member ${member.name} has been removed from the club` };
  }

  /**
   * Check in member for attendance
   */
  async checkInMember(memberId: string, practiceId: string) {
    if (!practiceId) {
      throw new ValidationError('Practice ID is required for check-in');
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { club: true },
    });

    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found`);
    }

    // Create attendance record for practice
    const attendance = await prisma.attendance.create({
      data: {
        memberId,
        practiceId,
      },
      include: {
        member: {
          select: { name: true, club: { select: { name: true } } },
        },
      },
    });

    return attendance;
  }

  /**
   * Check in guest (member checks in guest)
   */
  async checkInGuest(data: { clubId: string; guestName: string; checkedInById: string }) {
    const { clubId, guestName, checkedInById } = data;

    // Verify the member doing the check-in exists and is in the same club
    const checkerMember = await prisma.member.findUnique({
      where: { id: checkedInById },
    });

    if (!checkerMember || checkerMember.clubId !== clubId) {
      throw new ValidationError('Invalid check-in member');
    }

    // Create user account for guest
    const guestUser = await prisma.user.create({
      data: {
        username: `guest-${Date.now()}`,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        name: guestName.trim(),
        skillLevel: 'INTERMEDIATE',
        role: 'GUEST',
      },
    });

    // Create guest member
    const guest = await prisma.member.create({
      data: {
        clubId,
        userId: guestUser.id,
        type: 'GUEST',
        membershipTier: 'ADULT',
        status: 'ACTIVE',
        checkedInById,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, skillLevel: true, role: true },
        },
      },
    });

    return {
      guest,
      message: `Guest ${guestName} checked in successfully`,
    };
  }

  /**
   * Get all members of a club
   */
  async getClubMembers(clubId: string, skillLevel?: SkillLevel, status?: MemberStatus) {
    const club = await prisma.club.findUnique({ where: { id: clubId } });

    if (!club) {
      throw new NotFoundError(`Club with ID ${clubId} not found`);
    }

    const where: any = { clubId };
    if (skillLevel) where.skillLevel = skillLevel;
    if (status) where.status = status;

    const members = await prisma.member.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return members;
  }

  /**
   * Get member statistics for a club
   */
  async getMemberStats(clubId: string) {
    const members = await prisma.member.groupBy({
      by: ['type', 'skillLevel', 'status'],
      where: { clubId },
      _count: true,
    });

    const total = await prisma.member.count({ where: { clubId } });
    const activeMembers = await prisma.member.count({
      where: { clubId, status: 'ACTIVE' },
    });
    const guests = await prisma.member.count({
      where: { clubId, type: 'GUEST' },
    });

    return {
      total,
      activeMembers,
      guests,
      byType: members.filter((m) => m.type === 'MEMBER' || m.type === 'GUEST'),
      bySkillLevel: members.filter((m) => m.skillLevel),
    };
  }

  /**
   * Reset member's password
   */
  async resetMemberPassword(memberId: string, newPassword: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundError(`Member with ID ${memberId} not found`);
    }

    if (!member.userId || !member.user) {
      throw new ValidationError('This member does not have a user account');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: member.userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Get guests created by this member
   */
  async getMyGuests(userId: string) {
    const member = await prisma.member.findFirst({
      where: { userId },
    });

    if (!member) {
      return [];
    }

    // Find all guests checked in by this member
    const guests = await prisma.member.findMany({
      where: {
        checkedInById: member.id,
        type: 'GUEST',
      },
      include: { user: true },
    });

    return guests;
  }

  /**
   * Create a guest user and check them in to a practice
   */
  async createGuestAndCheckIn(data: {
    createdById: string;
    guestName: string;
    skillLevel: string;
    practiceId: string;
  }) {
    const { createdById, guestName, skillLevel, practiceId } = data;

    // Get the club from the practice
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
    });

    if (!practice) {
      throw new NotFoundError(`Practice with ID ${practiceId} not found`);
    }

    const practice_clubId = practice.clubId;

    // Get the member to find their club
    const creatingMember = await prisma.member.findFirst({
      where: { userId: createdById },
    });

    if (!creatingMember) {
      throw new NotFoundError(`Member not found`);
    }

    // Validate skillLevel is valid
    const validSkillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    const normalizedSkillLevel = skillLevel.toUpperCase();
    if (!validSkillLevels.includes(normalizedSkillLevel)) {
      throw new ValidationError('Invalid skill level');
    }

    // Create guest user account
    const guestUser = await prisma.user.create({
      data: {
        username: `guest-${Date.now()}`,
        name: guestName,
        email: null,
        password: '',
        phone: null,
        skillLevel: normalizedSkillLevel as any, // Cast to SkillLevel enum
        role: 'GUEST',
      },
    });

    // Create member record for guest
    const guestMember = await prisma.member.create({
      data: {
        userId: guestUser.id,
        clubId: practice_clubId,
        type: 'GUEST',
        status: 'ACTIVE',
        checkedInById: creatingMember.id,
      },
      include: { user: true },
    });

    // Check in the guest to the practice
    const attendance = await prisma.attendance.create({
      data: {
        memberId: guestMember.id,
        practiceId,
        checkInAt: new Date(),
      },
      include: {
        member: { include: { user: true } },
        practice: true,
      },
    });

    return {
      message: 'Guest created and checked in successfully',
      guest: guestMember,
      attendance,
    };
  }
}

export const memberService = new MemberService();
