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
