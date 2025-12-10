import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as userService from '../services/userService';

const router = express.Router();

// Middleware to check if user is Super Admin or Manager
const checkAdminOrManager = (req: Request, res: Response, next: Function): void => {
  const user = (req as any).user;
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER')) {
    res.status(403).json({ error: 'Unauthorized: Admin or Manager role required' });
    return;
  }
  next();
};

// GET all users (public, but filtered based on role)
router.get('/', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getAllUsers();
    res.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

// GET single user by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

// POST create user (Admin/Manager only)
router.post('/', authMiddleware, checkAdminOrManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, phone, skillLevel, role } = req.body;

    // Validate required fields
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if username already exists
    const existingUser = await userService.findUserByUsername(username);
    if (existingUser) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const newUser = await userService.createUser({
      username,
      email,
      password,
      name,
      phone,
      skillLevel,
      role,
    });

    res.status(201).json({ user: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
  }
});

// PUT update user (Admin/Manager only)
router.put('/:id', authMiddleware, checkAdminOrManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, phone, skillLevel, role } = req.body;

    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await userService.updateUser(req.params.id, {
      email,
      name,
      phone,
      skillLevel,
      role,
    });

    res.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

// DELETE user (Admin/Manager only)
router.delete('/:id', authMiddleware, checkAdminOrManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    await userService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
});

// POST reset user password (Admin/Manager only)
router.post('/:id/reset-password', authMiddleware, checkAdminOrManager, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Default password for reset
    const defaultPassword = 'Password123!';

    const updatedUser = await userService.resetPassword(req.params.id, defaultPassword);
    res.json({ 
      message: `Password reset successfully. New password is: ${defaultPassword}`,
      user: updatedUser 
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

export default router;
