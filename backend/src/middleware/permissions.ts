import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check if user has access to a specific club
 * - SUPER_ADMIN: Access to all clubs
 * - MANAGER: Access only to clubs they manage
 * - MEMBER: Access only to their specific club (via Member model)
 * - GUEST: Access only to their specific club (via Member model)
 */
export async function checkClubAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const clubId = req.params.clubId || req.body?.clubId;
  if (!clubId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Club ID is required.',
    });
    return;
  }

  try {
    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // MANAGER needs to have explicit club access
    if (req.user.role === 'MANAGER') {
      const hasAccess = await prisma.clubManager.findUnique({
        where: {
          userId_clubId: {
            userId: req.user.userId,
            clubId,
          },
        },
      });

      if (!hasAccess) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this club.',
        });
        return;
      }

      next();
      return;
    }

    // MEMBER and GUEST need to be members of the club
    if (req.user.role === 'MEMBER' || req.user.role === 'GUEST') {
      const member = await prisma.member.findUnique({
        where: {
          userId: req.user.userId,
        },
      });

      if (!member || member.clubId !== clubId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this club.',
        });
        return;
      }

      next();
      return;
    }

    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this club.',
    });
  } catch (error) {
    console.error('Club access check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check club access.',
    });
  }
}

/**
 * Check if user can see practices and matches
 * - SUPER_ADMIN: See all
 * - MANAGER: See in clubs they manage
 * - MEMBER: See in their club
 * - GUEST: See in their club only
 */
export async function checkPracticeAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const practiceId = req.params.practiceId || req.params.id;
  if (!practiceId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Practice ID is required.',
    });
    return;
  }

  try {
    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Get the practice to find the club
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { clubId: true },
    });

    if (!practice) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Practice not found.',
      });
      return;
    }

    // Now check club access
    if (req.user.role === 'MANAGER') {
      const hasAccess = await prisma.clubManager.findUnique({
        where: {
          userId_clubId: {
            userId: req.user.userId,
            clubId: practice.clubId,
          },
        },
      });

      if (!hasAccess) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this practice.',
        });
        return;
      }

      next();
      return;
    }

    // MEMBER and GUEST can see practices in their club
    if (req.user.role === 'MEMBER' || req.user.role === 'GUEST') {
      const member = await prisma.member.findUnique({
        where: { userId: req.user.userId },
        select: { clubId: true },
      });

      if (!member || member.clubId !== practice.clubId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this practice.',
        });
        return;
      }

      next();
      return;
    }

    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this practice.',
    });
  } catch (error) {
    console.error('Practice access check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check practice access.',
    });
  }
}

/**
 * Check if user can see matches (same as practices)
 */
export async function checkMatchAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const matchId = req.params.matchId || req.params.id;
  if (!matchId) {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Match ID is required.',
    });
    return;
  }

  try {
    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      next();
      return;
    }

    // Get the match to find the practice and club
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        practice: {
          select: { clubId: true },
        },
      },
    });

    if (!match) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Match not found.',
      });
      return;
    }

    const clubId = match.practice.clubId;

    // Check club access
    if (req.user.role === 'MANAGER') {
      const hasAccess = await prisma.clubManager.findUnique({
        where: {
          userId_clubId: {
            userId: req.user.userId,
            clubId,
          },
        },
      });

      if (!hasAccess) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this match.',
        });
        return;
      }

      next();
      return;
    }

    // MEMBER and GUEST can see matches in their club
    if (req.user.role === 'MEMBER' || req.user.role === 'GUEST') {
      const member = await prisma.member.findUnique({
        where: { userId: req.user.userId },
        select: { clubId: true },
      });

      if (!member || member.clubId !== clubId) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have access to this match.',
        });
        return;
      }

      next();
      return;
    }

    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have access to this match.',
    });
  } catch (error) {
    console.error('Match access check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check match access.',
    });
  }
}
/**
 * Check if user is SUPER_ADMIN or MANAGER
 * Used for operations that only admins/managers can perform
 */
export async function requireAdminOrManager(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'MANAGER') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Only super admins and managers can perform this action.',
    });
    return;
  }

  next();
}