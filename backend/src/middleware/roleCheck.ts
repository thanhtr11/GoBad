import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type UserRole = 'SUPER_ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

/**
 * Create a role check middleware for specific roles
 */
export function roleCheck(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Super Admin only middleware
 */
export function superAdminOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires super admin privileges.',
    });
    return;
  }

  next();
}

/**
 * Admin only middleware (SUPER_ADMIN or MANAGER with club access)
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
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
      message: 'This action requires admin privileges.',
    });
    return;
  }

  next();
}

/**
 * Manager or Super Admin middleware with club access check
 */
export async function managerOrAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  // SUPER_ADMIN has access to everything
  if (req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }

  // MANAGER must have access to the specific club
  if (req.user.role === 'MANAGER') {
    const clubId = req.params.clubId || req.body?.clubId;
    if (!clubId) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Club ID is required.',
      });
      return;
    }

    try {
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
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to check club access.',
      });
    }
    return;
  }

  res.status(403).json({
    error: 'Forbidden',
    message: 'This action requires admin privileges.',
  });
}

/**
 * Member access middleware (MEMBER, MANAGER, SUPER_ADMIN)
 */
export function memberAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'MANAGER', 'MEMBER'];
  const userRole = req.user.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'This action is not available for your role.',
    });
    return;
  }

  next();
}

/**
 * Guest access middleware (all roles except pure guests have access)
 */
export function guestAccess(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  // All roles have access
  next();
}

/**
 * Member or admin middleware
 */
export function memberOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.',
    });
    return;
  }

  const role = req.user.role as UserRole;
  if (role !== 'MEMBER' && role !== 'SUPER_ADMIN' && role !== 'MANAGER') {
    res.status(403).json({
      error: 'Forbidden',
      message: 'This action requires member or higher privileges.',
    });
    return;
  }

  next();
}
