import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { clubService } from '../services/clubService';
import { ValidationError, HTTPError } from '../middleware/errorHandler';

// Validation schemas
const createClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  location: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
});

const updateClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters').optional(),
  location: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
});

interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: {
    userId: string;
    username: string;
    role: string;
  };
  clubId?: string;
}

class ClubController {
  async createClub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validation = createClubSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(validation.error.issues[0].message);
      }

      const club = await clubService.createClub(validation.data);

      res.status(201).json({
        message: 'Club created successfully',
        club,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clubs
   * Get all clubs for current user (or all if admin)
   */
  async getAllClubs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const userId = req.user.userId;
      const userRole = req.user.role;
      let clubs;

      // SUPER_ADMIN sees all clubs, MANAGER sees their managed clubs, others see their member clubs
      if (userRole === 'SUPER_ADMIN') {
        clubs = await clubService.getAllClubs();
      } else {
        clubs = await clubService.getClubsByUserId(userId);
      }

      res.status(200).json({
        message: 'Clubs retrieved successfully',
        count: clubs.length,
        clubs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clubs/:id
   * Get specific club details (must be member of club or be SUPER_ADMIN)
   */
  async getClubById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new HTTPError('Unauthorized', 401);
      }

      // Check club isolation (user must be member of club or be SUPER_ADMIN)
      const hasAccess = req.user?.role === 'SUPER_ADMIN' || (await clubService.hasClubAccess(userId, id));

      if (!hasAccess) {
        throw new HTTPError('You do not have access to this club', 403);
      }

      const club = await clubService.getClubById(id);

      res.status(200).json({
        message: 'Club retrieved successfully',
        club,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/clubs/:id
   * Update club (Admin or SUPER_ADMIN or club member)
   */
  async updateClub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.userId;

      if (!userId) {
        throw new HTTPError('Unauthorized', 401);
      }

      // Check club isolation (user must be member of club or be SUPER_ADMIN)
      const hasAccess = req.user?.role === 'SUPER_ADMIN' || (await clubService.hasClubAccess(userId, id));

      if (!hasAccess) {
        throw new HTTPError('You do not have access to this club', 403);
      }

      const validation = updateClubSchema.safeParse(req.body);

      if (!validation.success) {
        throw new ValidationError(validation.error.issues[0].message);
      }

      const club = await clubService.updateClub(id, validation.data);

      res.status(200).json({
        message: 'Club updated successfully',
        club,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/clubs/:id
   * Delete club (Admin only)
   */
  async deleteClub(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await clubService.deleteClub(id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clubs/:id/members
   * Get club members
   */
  async getClubMembers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const userId = req.user.userId;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      // Check club isolation (user must be member of club or be SUPER_ADMIN)
      const hasAccess = isSuperAdmin || (await clubService.hasClubAccess(userId, id));

      if (!hasAccess) {
        throw new HTTPError('You do not have access to this club', 403);
      }

      const members = await clubService.getClubMembers(id);

      res.status(200).json({
        message: 'Club members retrieved successfully',
        count: members.length,
        members,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clubs/:id/stats
   * Get club statistics
   */
  async getClubStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        throw new HTTPError('Unauthorized', 401);
      }

      const userId = req.user.userId;
      const isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      // Check club isolation (user must be member of club or be SUPER_ADMIN)
      const hasAccess = isSuperAdmin || (await clubService.hasClubAccess(userId, id));

      if (!hasAccess) {
        throw new HTTPError('You do not have access to this club', 403);
      }

      const stats = await clubService.getClubStats(id);

      res.status(200).json({
        message: 'Club statistics retrieved successfully',
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/clubs/:id/managers
   * Assign a manager to a club
   */
  async assignManager(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: clubId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        throw new ValidationError('userId is required');
      }

      const manager = await clubService.assignManager(clubId, userId);

      res.status(201).json({
        message: 'Manager assigned successfully',
        manager,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/clubs/:id/managers
   * Get managers of a club
   */
  async getClubManagers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: clubId } = req.params;

      const managers = await clubService.getClubManagers(clubId);

      res.status(200).json({
        message: 'Club managers retrieved successfully',
        managers,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/clubs/:clubId/managers/:userId
   * Remove a manager from a club
   */
  async removeManager(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { clubId, userId } = req.params;

      await clubService.removeManager(clubId, userId);

      res.status(200).json({
        message: 'Manager removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const clubController = new ClubController();
