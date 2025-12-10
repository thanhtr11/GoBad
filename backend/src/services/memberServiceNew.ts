import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all members for a club with user information
 */
export async function getMembersByClub(clubId: string) {
  return prisma.member.findMany({
    where: { clubId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          skillLevel: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}

/**
 * Get member by ID
 */
export async function getMemberById(memberId: string) {
  return prisma.member.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          skillLevel: true,
        },
      },
      club: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
  });
}

/**
 * Update member status or type
 */
export async function updateMember(memberId: string, data: {
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  type?: 'MEMBER' | 'GUEST';
  membershipTier?: 'ADULT' | 'JUNIOR' | 'FAMILY';
}) {
  return prisma.member.update({
    where: { id: memberId },
    data,
  });
}

/**
 * Delete member
 */
export async function deleteMember(memberId: string) {
  return prisma.member.delete({
    where: { id: memberId },
  });
}

/**
 * Add user to club (create membership)
 */
export async function addMemberToClub(data: {
  userId: string;
  clubId: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  type?: 'MEMBER' | 'GUEST';
  membershipTier?: 'ADULT' | 'JUNIOR' | 'FAMILY';
}) {
  return prisma.member.create({
    data: {
      userId: data.userId,
      clubId: data.clubId,
      status: data.status || 'ACTIVE',
      type: data.type || 'MEMBER',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          skillLevel: true,
        },
      },
    },
  });
}

/**
 * Create a guest member for a practice
 * Guest members are temporary members created for single practice sessions
 */
export async function createGuestMember(data: {
  name: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  practiceId: string;
}) {
  // First, get the practice to find the club
  const practice = await prisma.practice.findUnique({
    where: { id: data.practiceId },
    select: { clubId: true },
  });

  if (!practice) {
    throw new Error('Practice not found');
  }

  // Create a guest user account
  const guestUser = await prisma.user.create({
    data: {
      username: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      email: `guest_${Date.now()}@gobad.local`,
      password: 'guest_temp_password',
      role: 'GUEST',
      skillLevel: data.skillLevel,
    },
  });

  // Add guest to the club
  const guestMember = await prisma.member.create({
    data: {
      userId: guestUser.id,
      clubId: practice.clubId,
      type: 'GUEST',
      status: 'ACTIVE',
      membershipTier: 'ADULT',
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          skillLevel: true,
        },
      },
    },
  });

  return guestMember;
}
