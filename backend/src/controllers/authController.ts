import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { UnauthorizedError, ValidationError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export interface RegisterInput {
  username: string;
  password: string;
  name: string;
  email?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    role: string;
  };
  token: string;
}

/**
 * Register a new user
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { username, password, name, email } = input;

  // Validate input
  if (!username || !password || !name) {
    throw new ValidationError('Username, password, and name are required');
  }

  if (username.length < 3) {
    throw new ValidationError('Username must be at least 3 characters long');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long');
  }

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {
    throw new ValidationError('Username already exists', { username });
  }

  // Hash password
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name, // Display name is required
      role: 'MEMBER', // Default role for new users
    },
  });

  // Don't create member profile during registration
  // Users will join a club after login

  // Generate token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  };
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { username, password } = input;

  // Validate input
  if (!username || !password) {
    throw new ValidationError('Username and password are required');
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new UnauthorizedError('Invalid username or password');
  }

  // Compare password
  const isPasswordValid = await bcryptjs.compare(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid username or password');
  }

  // Generate token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  };
}

/**
 * Get current user details
 */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      phone: true,
      skillLevel: true,
      createdAt: true,
      clubMemberships: {
        select: {
          id: true,
          status: true,
          type: true,
          joinedAt: true,
          club: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new ValidationError('User not found');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
    skillLevel: user.skillLevel,
    clubMemberships: user.clubMemberships,
    createdAt: user.createdAt,
  };
}

/**
 * Refresh JWT token
 */
export async function refreshToken(userId: string): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Generate new token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  };
}

/**
 * Verify password (used for sensitive operations)
 */
export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    return false;
  }

  return bcryptjs.compare(password, user.password);
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters long');
  }

  const isValid = await verifyPassword(userId, currentPassword);
  if (!isValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}
