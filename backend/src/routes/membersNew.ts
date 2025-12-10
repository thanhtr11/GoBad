import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as memberService from '../services/memberServiceNew';

const router = express.Router();

// Allow only SUPER_ADMIN or MANAGER to mutate members
const requireManager = (req: Request, res: Response, next: Function) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER')) {
    res.status(403).json({ error: 'Unauthorized: Admin or Manager role required' });
    return;
  }
  next();
};

// GET members by club
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { clubId } = req.query;
    
    if (!clubId || typeof clubId !== 'string') {
      res.status(400).json({ error: 'clubId query parameter is required' });
      return;
    }

    const members = await memberService.getMembersByClub(clubId);
    res.json(members);
  } catch (error: any) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch members' });
  }
});

// GET my guests (guests created by current user) - MUST be before /:id route
router.get('/my-guests', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const guests = await memberService.getGuestsForUser(user.id);
    res.json({ guests });
  } catch (error: any) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch guests' });
  }
});

// GET single member by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await memberService.getMemberById(req.params.id);
    
    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    
    res.json(member);
  } catch (error: any) {
    console.error('Error fetching member:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch member' });
  }
});

// POST add member to club
router.post('/', authMiddleware, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, clubId, status, type, membershipTier } = req.body;
    
    if (!userId || !clubId) {
      res.status(400).json({ error: 'userId and clubId are required' });
      return;
    }

    const member = await memberService.addMemberToClub({
      userId,
      clubId,
      status,
      type,
      membershipTier,
    });
    
    res.status(201).json(member);
  } catch (error: any) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: error.message || 'Failed to add member' });
  }
});

// PUT update member
router.put('/:id', authMiddleware, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, membershipTier } = req.body;
    
    const member = await memberService.updateMember(req.params.id, {
      status,
      type,
      membershipTier,
    });
    
    res.json(member);
  } catch (error: any) {
    console.error('Error updating member:', error);
    res.status(500).json({ error: error.message || 'Failed to update member' });
  }
});

// DELETE member
router.delete('/:id', authMiddleware, requireManager, async (req: Request, res: Response): Promise<void> => {
  try {
    await memberService.deleteMember(req.params.id);
    res.json({ message: 'Member deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: error.message || 'Failed to delete member' });
  }
});

// POST create guest member for practice
router.post('/create-guest', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, skillLevel, practiceId } = req.body;
    
    if (!name || !skillLevel || !practiceId) {
      res.status(400).json({ error: 'name, skillLevel, and practiceId are required' });
      return;
    }

    const guest = await memberService.createGuestMember({
      name,
      skillLevel,
      practiceId,
    });
    
    res.status(201).json(guest);
  } catch (error: any) {
    console.error('Error creating guest member:', error);
    res.status(500).json({ error: error.message || 'Failed to create guest member' });
  }
});

export default router;

