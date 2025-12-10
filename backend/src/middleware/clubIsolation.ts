import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Club isolation middleware
 * Ensures users can only access data for clubs they're members of
 */
export async function clubIsolationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    // SUPER_ADMIN users have access to all clubs
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Get the clubId from params, query, or body
    const clubId = req.params.clubId || req.params.id || req.query.clubId || req.body?.clubId;

    if (!clubId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Club ID is required.',
      });
      return;
    }

    // Check if user is a member of this club
    const member = await prisma.member.findFirst({
      where: {
        clubId: clubId as string,
        userId: req.user.userId,
      },
    });

    if (!member) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this club.',
      });
      return;
    }

    // Attach clubId to request for later use
    req.body = req.body || {};
    req.body.clubId = clubId;

    next();
  } catch (error) {
    console.error('Club isolation middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while checking club access.',
    });
  }
}

/**
 * Verify club access without throwing error
 * Returns true if user has access to the club
 */
export async function hasClubAccess(userId: string, clubId: string, role: string): Promise<boolean> {
  try {
    // Admin users have access to all clubs
    if (role === 'ADMIN') {
      return true;
    }

    const member = await prisma.member.findFirst({
      where: {
        clubId,
        userId,
      },
    });

    return !!member;
  } catch (error) {
    console.error('Error checking club access:', error);
    return false;
  }
}

/**
 * Get all clubs a user has access to
 */
export async function getUserClubs(userId: string, role: string): Promise<string[]> {
  try {
    if (role === 'ADMIN') {
      // Admin has access to all clubs
      const clubs = await prisma.club.findMany({
        select: { id: true },
      });
      return clubs.map(c => c.id);
    }

    // Get clubs where user is a member
    const memberships = await prisma.member.findMany({
      where: { userId },
      select: { clubId: true },
      distinct: ['clubId'],
    });

    return memberships.map(m => m.clubId);
  } catch (error) {
    console.error('Error getting user clubs:', error);
    return [];
  }
}
