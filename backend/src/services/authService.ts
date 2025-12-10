import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Auth service for authentication-related database operations
 */

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      member: {
        select: {
          id: true,
          name: true,
          phone: true,
          skillLevel: true,
          status: true,
          membershipTier: true,
        },
      },
    },
  });
}

export async function getUserClubs(userId: string) {
  const memberships = await prisma.member.findMany({
    where: { userId },
    select: {
      club: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
    },
    distinct: ['clubId'],
  });

  return memberships.map(m => m.club);
}

export async function getUserMember(userId: string) {
  return prisma.member.findFirst({
    where: { userId },
    include: {
      club: true,
    },
  });
}
