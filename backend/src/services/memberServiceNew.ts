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
 * Guest name will include who created it
 */
export async function createGuestMember(data: {
  name: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  practiceId: string;
  createdBy?: string; // Username or name of who created the guest
}) {
  // First, get the practice to find the club
  const practice = await prisma.practice.findUnique({
    where: { id: data.practiceId },
    select: { clubId: true },
  });

  if (!practice) {
    throw new Error('Practice not found');
  }

  // Format guest name to show who created it
  const guestDisplayName = data.createdBy 
    ? `${data.name} (added by ${data.createdBy})`
    : data.name;

  // Create a guest user account
  const guestUser = await prisma.user.create({
    data: {
      username: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: guestDisplayName,
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

/**
 * Convert guest member to regular member and remove the guest
 */
export async function convertGuestToMember(memberId: string) {
  // Get the guest member details
  const guestMember = await prisma.member.findUnique({
    where: { id: memberId },
    include: { user: true },
  });

  if (!guestMember) {
    throw new Error('Guest member not found');
  }

  if (guestMember.type !== 'GUEST') {
    throw new Error('Member is not a guest');
  }

  // Update the member type to MEMBER
  await prisma.member.update({
    where: { id: memberId },
    data: { type: 'MEMBER' },
  });

  // Delete the temporary guest user
  await prisma.user.delete({
    where: { id: guestMember.userId },
  });

  return { success: true, message: 'Guest converted to member and guest account removed' };
}

/**
 * Get guests created by a user (for a specific user)
 */
export async function getGuestsForUser(userId: string) {
  return prisma.member.findMany({
    where: {
      type: 'GUEST',
      user: {
        id: userId,
      },
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
      club: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });
}
